// src/app/api/wallet/deposit/route.js
// Initialize wallet deposit (Paystack or Stripe)

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { amount, email, clientId, countryCode } = await req.json();

    if (!amount || !email || !clientId) {
      return Response.json({ 
        success: false,
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate amount
    if (amount < 100) {
      return Response.json({ 
        success: false,
        error: 'Minimum deposit is ₦100' 
      }, { status: 400 });
    }

    if (amount > 1000000) {
      return Response.json({ 
        success: false,
        error: 'Maximum deposit is ₦1,000,000' 
      }, { status: 400 });
    }

    // Determine payment provider based on country
    const paymentProvider = countryCode === 'NG' ? 'paystack' : 'stripe';
    const currency = countryCode === 'NG' ? 'NGN' : 'USD';

    console.log(`💰 Wallet deposit: ${currency}${amount} via ${paymentProvider}`);

    if (paymentProvider === 'paystack') {
      return await initializePaystackDeposit(amount, email, clientId, currency);
    } else {
      return await initializeStripeDeposit(amount, email, clientId, currency);
    }

  } catch (error) {
    console.error('❌ Deposit API error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

// ============================================
// PAYSTACK DEPOSIT
// ============================================

async function initializePaystackDeposit(amount, email, clientId, currency) {
  try {
    const txRef = `wallet_deposit_${clientId}_${Date.now()}`;
    const amountInKobo = Math.round(amount * 100);

    console.log('🟢 Initializing Paystack deposit...');

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        currency,
        reference: txRef,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet/verify?tx_ref=${txRef}&provider=paystack`,
        metadata: {
          client_id: clientId,
          purpose: 'wallet_deposit',
          deposit_amount: amount
        },
        channels: ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer']
      })
    });

    const result = await response.json();

    if (result.status) {
      console.log('✅ Paystack initialized');
      
      return Response.json({
        success: true,
        paymentLink: result.data.authorization_url,
        reference: txRef,
        provider: 'paystack'
      });
    } else {
      throw new Error(result.message || 'Paystack initialization failed');
    }
  } catch (error) {
    console.error('❌ Paystack error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

// ============================================
// STRIPE DEPOSIT
// ============================================

async function initializeStripeDeposit(amount, email, clientId, currency) {
  try {
    const amountInCents = Math.round(amount * 100);
    
    console.log('🔵 Initializing Stripe deposit...');

    // Get or create Stripe customer
    let customerId;
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', clientId)
      .single();

    if (userData?.stripe_customer_id) {
      customerId = userData.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: email,
        metadata: { user_id: clientId }
      });
      customerId = customer.id;

      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', clientId);
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      customer: customerId,
      description: `Wallet deposit for client ${clientId}`,
      metadata: {
        client_id: clientId,
        purpose: 'wallet_deposit',
        deposit_amount: amount
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('✅ Stripe initialized');

    return Response.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      reference: paymentIntent.id,
      provider: 'stripe'
    });

  } catch (error) {
    console.error('❌ Stripe error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}