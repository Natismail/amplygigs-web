// src/app/api/release-funds/route.js
// v3 — definitive version
// Changes vs previous versions:
//   • Uses shared getCurrencyByCode / formatCurrency from @/components/CurrencySelector
//     instead of any hardcoded CURRENCY_SYMBOLS map
//   • rate_currency pulled from musician profile join (fixes NGN vs USD mismatch)
//   • total_earned + currency synced on every wallet update
//   • Supabase admin client always created inside handler (fixes ENOTFOUND)
//   • supabase instance passed to sendReleaseNotifications (no redundant client creation)

import { createClient } from '@supabase/supabase-js';
import { getCurrencyByCode, formatCurrency } from '@/components/CurrencySelector';

const PLATFORM_FEE_PERCENT = 0.10; // 10%

/** Always call inside a handler — never at module level */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      `Missing Supabase env vars — URL: ${url ? 'OK' : 'MISSING'}, SERVICE_ROLE_KEY: ${key ? 'OK' : 'MISSING'}`
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req) {
  let supabase;

  // ── 0. Init admin client ──────────────────────────────────────────────────
  try {
    supabase = getAdminClient();
  } catch (envError) {
    console.error('❌ Supabase init failed:', envError.message);
    return Response.json(
      { success: false, error: 'Server configuration error', details: envError.message },
      { status: 500 }
    );
  }

  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return Response.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
    }

    console.log('📤 Release request for booking:', bookingId);

    // ── 1. Fetch booking + musician profile (rate_currency is critical) ───────
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        musician:musician_id(
          id, first_name, last_name, email,
          rate_currency
        ),
        client:client_id(id, first_name, last_name, email)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('❌ Booking fetch error:', bookingError);
      return Response.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    // ── 2. Already released? ──────────────────────────────────────────────────
    if (booking.funds_released_at) {
      return Response.json(
        { success: false, error: 'Funds have already been released for this booking' },
        { status: 400 }
      );
    }

    // ── 3. Guard: must be completed or event date passed ──────────────────────
    const eventDate = new Date(booking.event_date);
    const now       = new Date();
    if (booking.status !== 'completed' && eventDate >= now) {
      return Response.json(
        { success: false, error: 'Event must be completed or its date must have passed before releasing funds' },
        { status: 400 }
      );
    }

    // ── 4. Currency resolution ─────────────────────────────────────────────────
    // Priority: musician's rate_currency → booking.currency → 'NGN'
    // getCurrencyByCode validates the code against the shared currency list;
    // falls back to 'NGN' for any unknown/null code.
    const rawCurrency      = booking.musician?.rate_currency || booking.currency || 'NGN';
    const currencyMeta     = getCurrencyByCode(rawCurrency);
    const resolvedCurrency = currencyMeta ? rawCurrency : 'NGN';

    console.log('💱 Resolved currency:', resolvedCurrency, '| musician rate_currency:', booking.musician?.rate_currency);

    // ── 5. Find escrow record ──────────────────────────────────────────────────
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('booking_id', bookingId)
      .in('status', ['held', 'pending'])
      .eq('payment_status', 'successful')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (escrowError) {
      console.error('❌ Escrow lookup error:', escrowError);
      return Response.json(
        { success: false, error: 'Error looking up escrow record', details: escrowError.message },
        { status: 500 }
      );
    }

    // ── 6. Compute amounts ─────────────────────────────────────────────────────
    let grossAmount, netAmount, platformFee;

    if (escrow) {
      grossAmount = Number(escrow.gross_amount ?? escrow.amount ?? booking.amount ?? 0);
      netAmount   = Number(escrow.net_amount   ?? grossAmount * (1 - PLATFORM_FEE_PERCENT));
      platformFee = Number(escrow.platform_fee ?? grossAmount * PLATFORM_FEE_PERCENT);

      console.log('💰 Escrow found:', { id: escrow.id, grossAmount, netAmount, platformFee, resolvedCurrency });
    } else {
      // No releasable escrow — check if one exists in a non-releasable state
      const { data: anyEscrow } = await supabase
        .from('escrow_transactions')
        .select('id, status, payment_status')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (anyEscrow) {
        if (anyEscrow.status === 'released') {
          return Response.json(
            { success: false, error: 'Funds have already been released for this booking' },
            { status: 400 }
          );
        }
        return Response.json(
          {
            success: false,
            error: `Cannot release — escrow status: "${anyEscrow.status}", payment_status: "${anyEscrow.payment_status}". Payment may not have been confirmed.`,
          },
          { status: 400 }
        );
      }

      // No escrow row at all — fall back to booking.amount
      if (!booking.amount) {
        return Response.json(
          { success: false, error: 'No payment record found. The client may not have completed payment yet.' },
          { status: 404 }
        );
      }

      console.warn('⚠️ No escrow row found — computing from booking.amount');
      grossAmount = Number(booking.amount);
      platformFee = grossAmount * PLATFORM_FEE_PERCENT;
      netAmount   = grossAmount - platformFee;
    }

    // ── 7. Try DB RPC first, then manual release ───────────────────────────────
    let releaseSuccess = false;

    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('release_escrow_funds', {
        p_booking_id: bookingId,
      });
      if (rpcError) throw rpcError;
      if (rpcResult === false) throw new Error('RPC returned false');
      releaseSuccess = true;
      console.log('✅ RPC release_escrow_funds succeeded');

    } catch (rpcErr) {
      console.warn('⚠️ RPC unavailable, using manual release:', rpcErr.message);

      // 7a. Update escrow record
      if (escrow) {
        const { error: escrowUpdateErr } = await supabase
          .from('escrow_transactions')
          .update({
            status:       'released',
            released_at:  new Date().toISOString(),
            released_by:  booking.client_id,
            release_type: 'manual_client',
            updated_at:   new Date().toISOString(),
          })
          .eq('id', escrow.id);

        if (escrowUpdateErr) {
          console.error('❌ Escrow update failed:', escrowUpdateErr);
          return Response.json(
            { success: false, error: 'Failed to update escrow record', details: escrowUpdateErr.message },
            { status: 500 }
          );
        }
      }

      // 7b. Update musician wallet
      // ┌────────────────────────────────────────────────────────────┐
      // │  BALANCE FLOW                                              │
      // │  On payment:  ledger_balance    += grossAmount             │
      // │  On release:  ledger_balance    -= grossAmount             │
      // │               available_balance += netAmount (after 10%)   │
      // │               total_earned      += netAmount               │
      // │               currency          = musician rate_currency   │
      // └────────────────────────────────────────────────────────────┘
      const { data: wallet } = await supabase
        .from('musician_wallets')
        .select('id, ledger_balance, available_balance, total_earned')
        .eq('musician_id', booking.musician_id)
        .maybeSingle();

      if (wallet) {
        const newLedger      = Math.max(0, Number(wallet.ledger_balance)   - grossAmount);
        const newAvailable   =            Number(wallet.available_balance) + netAmount;
        const newTotalEarned =            Number(wallet.total_earned || 0) + netAmount;

        const { error: walletErr } = await supabase
          .from('musician_wallets')
          .update({
            ledger_balance:    newLedger,
            available_balance: newAvailable,
            total_earned:      newTotalEarned,
            currency:          resolvedCurrency,  // ← always sync to rate_currency
            updated_at:        new Date().toISOString(),
          })
          .eq('id', wallet.id);

        if (walletErr) {
          // Non-fatal: escrow already marked released — log and continue
          console.error('❌ Wallet update failed (non-fatal):', walletErr);
        } else {
          console.log('💳 Wallet updated:', {
            musician_id: booking.musician_id,
            currency:    resolvedCurrency,
            ledger:      `${wallet.ledger_balance} → ${newLedger}`,
            available:   `${wallet.available_balance} → ${newAvailable}`,
            total_earned: newTotalEarned,
            platform_fee: platformFee,
          });
        }
      } else {
        // No wallet row yet — create one
        const { error: walletCreateErr } = await supabase
          .from('musician_wallets')
          .insert({
            musician_id:       booking.musician_id,
            ledger_balance:    0,
            available_balance: netAmount,
            total_earned:      netAmount,
            currency:          resolvedCurrency,
            created_at:        new Date().toISOString(),
            updated_at:        new Date().toISOString(),
          });

        if (walletCreateErr) {
          console.error('❌ Wallet creation failed:', walletCreateErr);
        } else {
          console.log('💳 New wallet created | musician:', booking.musician_id, '| currency:', resolvedCurrency);
        }
      }

      // 7c. Record wallet transaction (non-blocking — don't await)
      supabase.from('wallet_transactions').insert({
        musician_id:  booking.musician_id,
        booking_id:   bookingId,
        type:         'release',
        gross_amount: grossAmount,
        platform_fee: platformFee,
        net_amount:   netAmount,
        currency:     resolvedCurrency,
        status:       'completed',
        description:  `Funds released for booking ${bookingId}`,
        created_at:   new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.warn('⚠️ wallet_transactions insert failed (non-critical):', error.message);
      });

      // 7d. Mark booking as released
      const { error: bookingUpdateErr } = await supabase
        .from('bookings')
        .update({
          funds_released_at: new Date().toISOString(),
          payment_status:    'released',
          updated_at:        new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (bookingUpdateErr) {
        console.error('❌ Booking update failed:', bookingUpdateErr);
        return Response.json(
          { success: false, error: 'Failed to update booking status', details: bookingUpdateErr.message },
          { status: 500 }
        );
      }

      releaseSuccess = true;
      console.log('✅ Manual release complete');
    }

    if (!releaseSuccess) {
      return Response.json({ success: false, error: 'Failed to release funds' }, { status: 500 });
    }

    // ── 8. Non-blocking notifications ─────────────────────────────────────────
    sendReleaseNotifications({
      supabase, escrow, booking,
      netAmount, grossAmount, platformFee,
      currency: resolvedCurrency,
    }).catch(err => console.warn('⚠️ Notification error (non-critical):', err.message));

    // ── 9. Return success ──────────────────────────────────────────────────────
    const { data: updatedBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    return Response.json({
      success:     true,
      message:     'Funds released successfully',
      data:        updatedBooking,
      escrowId:    escrow?.id ?? null,
      amount:      netAmount,
      grossAmount,
      platformFee,
      currency:    resolvedCurrency,
    });

  } catch (error) {
    console.error('❌ Release API unhandled error:', error);
    return Response.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ── Notifications helper ───────────────────────────────────────────────────────
// Receives the existing supabase instance — avoids creating a redundant admin client
async function sendReleaseNotifications({ supabase, escrow, booking, netAmount, grossAmount, platformFee, currency }) {
  // formatCurrency from shared CurrencySelector util — no hardcoded symbols
  const netFormatted = formatCurrency(netAmount, currency);
  const musicianName =
    `${booking.musician?.first_name || ''} ${booking.musician?.last_name || ''}`.trim() || 'the musician';
  const gigTitle = booking.event_type || 'the gig';

  await Promise.allSettled([
    supabase.from('notifications').insert({
      user_id:  booking.musician_id,
      type:     'funds_released',
      title:    '🎉 Funds Released!',
      message:  `${netFormatted} is now available in your wallet. Great job completing "${gigTitle}"!`,
      data:     {
        booking_id:   booking.id,
        escrow_id:    escrow?.id ?? null,
        gross_amount: grossAmount,
        platform_fee: platformFee,
        net_amount:   netAmount,
        currency,
      },
      read:    false,
      is_read: false,
    }),
    supabase.from('notifications').insert({
      user_id:  booking.client_id,
      type:     'release_confirmed',
      title:    '✅ Payment Released',
      message:  `You've successfully released ${netFormatted} to ${musicianName}. Thank you for using AmplyGigs!`,
      data:     {
        booking_id:    booking.id,
        escrow_id:     escrow?.id ?? null,
        amount:        netAmount,
        currency,
        musician_name: musicianName,
      },
      read:    false,
      is_read: false,
    }),
  ]);

  console.log('✅ Release notifications sent');
}