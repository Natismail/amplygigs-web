// src/app/api/cron/auto-release-escrow/route.js
// AUTO-RELEASE ESCROW CRON JOB
// FIXES:
//   1. Supabase client created inside handler (not module-level)
//   2. Wallet currency pulled from musician's rate_currency
//   3. total_earned updated on each auto-release

import { createClient } from '@supabase/supabase-js';

const PLATFORM_FEE_PERCENT = 0.10;
const AUTO_RELEASE_HOURS   = 24;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Missing Supabase env vars`);
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(req) {
  // ── Auth guard ───────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch (err) {
    return Response.json({ error: 'Server configuration error', details: err.message }, { status: 500 });
  }

  const startTime      = Date.now();
  const cutoffTime     = new Date(Date.now() - AUTO_RELEASE_HOURS * 60 * 60 * 1000).toISOString();

  console.log(`🔄 Auto-release cron started — cutoff: ${cutoffTime}`);

  // ── Find eligible bookings ───────────────────────────────────────────────
  const { data: eligibleBookings, error: fetchError } = await supabase
    .from('bookings')
    .select(`
      id, musician_id, client_id, amount, currency,
      marked_complete_at, event_type,
      musician:musician_id(id, first_name, last_name, rate_currency),
      client:client_id(id, first_name, last_name),
      events:event_id(title)
    `)
    .eq('status', 'completed')
    .is('funds_released_at', null)
    .eq('auto_released', false)
    .lte('marked_complete_at', cutoffTime);

  if (fetchError) {
    console.error('❌ Booking query failed:', fetchError);
    return Response.json({ success: false, error: fetchError.message }, { status: 500 });
  }

  console.log(`📋 ${eligibleBookings?.length ?? 0} bookings eligible for auto-release`);

  if (!eligibleBookings?.length) {
    return Response.json({
      success: true,
      message: 'No bookings eligible for auto-release',
      processed: 0,
      duration: `${Date.now() - startTime}ms`,
    });
  }

  const results = { total: eligibleBookings.length, successful: 0, failed: 0, errors: [] };

  for (const booking of eligibleBookings) {
    try {
      console.log(`⏰ Auto-releasing booking ${booking.id}...`);

      // Currency: musician's rate_currency > booking.currency > 'NGN'
      const currency =
        booking.musician?.rate_currency ||
        booking.currency ||
        'NGN';

      // Find escrow record
      const { data: escrow } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('booking_id', booking.id)
        .in('status', ['held', 'pending'])
        .eq('payment_status', 'successful')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const grossAmount = escrow
        ? Number(escrow.gross_amount ?? escrow.amount ?? booking.amount ?? 0)
        : Number(booking.amount ?? 0);

      if (!grossAmount || grossAmount <= 0) {
        console.warn(`⚠️ Skipping booking ${booking.id} — zero amount`);
        results.failed++;
        results.errors.push({ booking_id: booking.id, error: 'Zero or missing amount' });
        continue;
      }

      const platformFee = grossAmount * PLATFORM_FEE_PERCENT;
      const netAmount   = grossAmount - platformFee;

      // ── Try DB RPC first ───────────────────────────────────────────────
      let success = false;
      try {
        const { data: rpcResult, error: rpcErr } = await supabase.rpc('release_escrow_funds', {
          p_booking_id: booking.id,
        });
        if (rpcErr) throw rpcErr;
        if (rpcResult === false) throw new Error('RPC returned false');
        success = true;
        console.log(`✅ RPC auto-released booking ${booking.id}`);

      } catch (rpcErr) {
        console.warn(`⚠️ RPC failed for ${booking.id}, using manual:`, rpcErr.message);

        // Manual: update escrow
        if (escrow) {
          await supabase
            .from('escrow_transactions')
            .update({
              status:       'released',
              released_at:  new Date().toISOString(),
              release_type: 'auto_24h',
              updated_at:   new Date().toISOString(),
            })
            .eq('id', escrow.id);
        }

        // Manual: update wallet
        const { data: wallet } = await supabase
          .from('musician_wallets')
          .select('id, ledger_balance, available_balance, total_earned')
          .eq('musician_id', booking.musician_id)
          .maybeSingle();

        if (wallet) {
          await supabase
            .from('musician_wallets')
            .update({
              ledger_balance:    Math.max(0, Number(wallet.ledger_balance) - grossAmount),
              available_balance: Number(wallet.available_balance) + netAmount,
              total_earned:      Number(wallet.total_earned || 0) + netAmount,
              currency,          // ← always sync to rate_currency
              updated_at:        new Date().toISOString(),
            })
            .eq('id', wallet.id);
        } else {
          await supabase
            .from('musician_wallets')
            .insert({
              musician_id:       booking.musician_id,
              ledger_balance:    0,
              available_balance: netAmount,
              total_earned:      netAmount,
              currency,
              created_at:        new Date().toISOString(),
              updated_at:        new Date().toISOString(),
            });
        }

        success = true;
      }

      if (!success) {
        results.failed++;
        results.errors.push({ booking_id: booking.id, error: 'Release failed' });
        continue;
      }

      // Mark booking auto-released
      await supabase
        .from('bookings')
        .update({
          funds_released_at: new Date().toISOString(),
          auto_released:     true,
          auto_released_at:  new Date().toISOString(),
          payment_status:    'released',
          updated_at:        new Date().toISOString(),
        })
        .eq('id', booking.id);

      // Notify
      const symbol = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' }[currency] || currency;
      await Promise.allSettled([
        supabase.from('notifications').insert({
          user_id:  booking.musician_id,
          type:     'funds_auto_released',
          title:    '💰 Funds Auto-Released',
          message:  `${symbol}${netAmount.toLocaleString()} has been automatically released after 24 hours and is now in your wallet!`,
          data:     { booking_id: booking.id, escrow_id: escrow?.id ?? null, net_amount: netAmount, currency, event_title: booking.events?.title },
          read:     false,
          is_read:  false,
        }),
        supabase.from('notifications').insert({
          user_id:  booking.client_id,
          type:     'auto_release_notification',
          title:    '✅ Payment Auto-Released',
          message:  `${symbol}${netAmount.toLocaleString()} was automatically released to the musician after 24 hours.`,
          data:     { booking_id: booking.id, escrow_id: escrow?.id ?? null, amount: netAmount, currency, event_title: booking.events?.title },
          read:     false,
          is_read:  false,
        }),
      ]);

      results.successful++;
      console.log(`✅ Auto-released booking ${booking.id}: ${symbol}${netAmount} (${currency})`);

    } catch (err) {
      console.error(`❌ Error processing booking ${booking.id}:`, err.message);
      results.failed++;
      results.errors.push({ booking_id: booking.id, error: err.message });
    }
  }

  const duration = Date.now() - startTime;
  console.log(`🏁 Auto-release done: ${results.successful} released, ${results.failed} failed in ${duration}ms`);

  return Response.json({
    success:  true,
    message:  'Auto-release cron completed',
    results,
    duration: `${duration}ms`,
  });
}

// Allow manual POST trigger for testing
export async function POST(req) {
  return GET(req);
}