// src/app/api/music/upload/purchase-credits/route.js
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { package_type } = body; // 'standard' or 'pro'

    const userId = session.user.id;

    // Get user profile for country/payment provider
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('country_code, payment_provider')
      .eq('id', userId)
      .single();

    const countryCode = profile?.country_code || 'NG';
    const paymentProvider = profile?.payment_provider || 'paystack';

    // Get pricing for package
    const { data: uploadFee, error: feeError } = await supabase
      .from('upload_fees')
      .select('*')
      .eq('country_code', countryCode)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (feeError) {
      return NextResponse.json({ error: 'Pricing not found' }, { status: 404 });
    }

    // Determine package details
    let packageDetails = {
      standard: {
        tracks_allowed: 10,
        fee_multiplier: 1,
        name: 'Standard Pack'
      },
      pro: {
        tracks_allowed: 50,
        fee_multiplier: 4,
        name: 'Pro Pack'
      }
    }[package_type] || packageDetails.standard;

    const amount = uploadFee.fee_amount * packageDetails.fee_multiplier;
    const currency = uploadFee.currency;

    // Create payment intent via your existing payment API
    const paymentResponse = await fetch(`${request.nextUrl.origin}/api/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        email: session.user.email,
        metadata: {
          type: 'upload_credits',
          package_type,
          tracks_allowed: packageDetails.tracks_allowed,
          musician_id: userId
        },
        countryCode
      })
    });

    const paymentData = await paymentResponse.json();

    if (!paymentData.success) {
      throw new Error('Payment initiation failed');
    }

    return NextResponse.json({
      success: true,
      paymentLink: paymentData.paymentLink,
      clientSecret: paymentData.clientSecret,
      amount,
      currency,
      package: packageDetails
    });

  } catch (error) {
    console.error('Purchase credits error:', error);
    return NextResponse.json({ error: 'Failed to initiate purchase' }, { status: 500 });
  }
}