// src/app/api/earnings/route.js
// Returns wallet data for the authenticated musician.
// Currency always reflects the musician's rate_currency from their profile.

import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Missing Supabase env vars — URL: ${url ? 'OK' : 'MISSING'}, KEY: ${key ? 'OK' : 'MISSING'}`);
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(req) {
  // ── Auth: verify Bearer token ───────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '').trim();

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch (err) {
    return Response.json({ error: 'Server configuration error', details: err.message }, { status: 500 });
  }

  // ── Verify token and get user ────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const musicianId = user.id;

  try {
    // ── Fetch musician profile (for rate_currency) ───────────────────────
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('rate_currency, hourly_rate, display_name')
      .eq('id', musicianId)
      .maybeSingle();

    // ── Fetch wallet ─────────────────────────────────────────────────────
    const { data: wallet, error: walletError } = await supabase
      .from('musician_wallets')
      .select('*')
      .eq('musician_id', musicianId)
      .maybeSingle();

    if (walletError) {
      console.error('❌ Wallet fetch error:', walletError);
      return Response.json({ error: 'Failed to fetch wallet', details: walletError.message }, { status: 500 });
    }

    // ── Currency: always follow musician's rate_currency ─────────────────
    // If wallet currency is stale (e.g. 'NGN' but musician set 'USD'),
    // we sync it here so the front-end always sees the right currency.
    const currency = profile?.rate_currency || wallet?.currency || 'NGN';

    // Sync wallet currency if it drifted
    if (wallet && wallet.currency !== currency) {
      supabase
        .from('musician_wallets')
        .update({ currency, updated_at: new Date().toISOString() })
        .eq('musician_id', musicianId)
        .then(({ error }) => {
          if (error) console.warn('⚠️ Wallet currency sync failed (non-critical):', error.message);
          else console.log(`💱 Wallet currency synced to ${currency} for musician ${musicianId}`);
        });
    }

    return Response.json({
      available:     Number(wallet?.available_balance ?? 0),
      ledger:        Number(wallet?.ledger_balance    ?? 0),
      totalEarnings: Number(wallet?.total_earned      ?? wallet?.total_earnings ?? 0),
      pendingWithdrawals: Number(wallet?.pending_withdrawals ?? 0),
      totalWithdrawn:     Number(wallet?.total_withdrawn     ?? 0),
      currency,
      // Extra context for the UI
      walletId:      wallet?.id ?? null,
      musicianId,
      profile: {
        displayName:  profile?.display_name ?? null,
        hourlyRate:   profile?.hourly_rate  ?? null,
        rateCurrency: profile?.rate_currency ?? currency,
      },
    });

  } catch (error) {
    console.error('❌ Earnings API error:', error);
    return Response.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}