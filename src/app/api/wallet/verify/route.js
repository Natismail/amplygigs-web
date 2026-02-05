// src/app/api/wallet/verify/route.js
// Verify wallet deposit payment

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { txRef, provider } = await req.json();

    if (!txRef || !provider) {
      return Response.json({ 
        success: false,
        error: 'Missing payment reference or provider' 
      }, { status: 400 });
    }

    console.log(`🔍 Verifying ${provider} deposit: ${txRef}`);

    // Check if payment was already processed by webhook
    const { data: walletTxn } = await supabase
      .from('client_wallet_transactions')
      .select('*, client_wallets(*)')
      .eq('payment_reference', txRef)
      .eq('status', 'completed')
      .single();

    if (walletTxn) {
      console.log('✅ Payment already processed by webhook');
      
      return Response.json({
        success: true,
        message: `Your wallet has been credited with ${walletTxn.client_wallets.currency}${walletTxn.amount.toLocaleString()}`,
        amount: walletTxn.amount,
        currency: walletTxn.client_wallets.currency,
        balance: walletTxn.balance_after
      });
    }

    // If not found, verify with payment provider
    if (provider === 'paystack') {
      return await verifyPaystack(txRef);
    } else if (provider === 'stripe') {
      return await verifyStripe(txRef);
    } else {
      return Response.json({ 
        success: false,
        error: 'Invalid payment provider' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Verification error:', error);
    return Response.json({ 
      success: false,
      error: 'Verification failed. Please check your wallet or contact support.' 
    }, { status: 500 });
  }
}

async function verifyPaystack(reference) {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const result = await response.json();

    if (result.status && result.data.status === 'success') {
      const clientId = result.data.metadata.client_id;
      const amount = result.data.amount / 100; // Convert from kobo

      // Credit wallet (in case webhook missed it)
      const { data: transactionId, error } = await supabase
        .rpc('client_deposit_funds', {
          p_client_id: clientId,
          p_amount: amount,
          p_payment_reference: reference,
          p_payment_provider: 'paystack',
          p_paystack_reference: reference
        });

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }

      return Response.json({
        success: true,
        message: `Your wallet has been credited with ₦${amount.toLocaleString()}`,
        amount: amount,
        currency: 'NGN'
      });
    } else {
      return Response.json({ 
        success: false,
        error: 'Payment not successful' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Paystack verification error:', error);
    throw error;
  }
}

async function verifyStripe(paymentIntentId) {
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const clientId = paymentIntent.metadata.client_id;
      const amount = paymentIntent.amount / 100; // Convert from cents

      // Credit wallet (in case webhook missed it)
      const { data: transactionId, error } = await supabase
        .rpc('client_deposit_funds', {
          p_client_id: clientId,
          p_amount: amount,
          p_payment_reference: paymentIntentId,
          p_payment_provider: 'stripe',
          p_stripe_payment_intent_id: paymentIntentId
        });

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }

      return Response.json({
        success: true,
        message: `Your wallet has been credited with $${amount.toLocaleString()}`,
        amount: amount,
        currency: paymentIntent.currency.toUpperCase()
      });
    } else {
      return Response.json({ 
        success: false,
        error: 'Payment not successful' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Stripe verification error:', error);
    throw error;
  }
}