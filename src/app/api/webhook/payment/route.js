// src/app/api/webhook/payment/route.js
// UNIFIED WEBHOOK HANDLER FOR STRIPE + PAYSTACK

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  
  // Determine provider by checking headers
  const paystackSignature = req.headers.get('x-paystack-signature');
  const stripeSignature = req.headers.get('stripe-signature');
  
  if (paystackSignature) {
    console.log('📨 Received Paystack webhook');
    return await handlePaystackWebhook(body, paystackSignature);
  } else if (stripeSignature) {
    console.log('📨 Received Stripe webhook');
    return await handleStripeWebhook(body, stripeSignature);
  } else {
    console.error('❌ Unknown payment provider');
    return Response.json({ error: 'Unknown payment provider' }, { status: 400 });
  }
}

// ============================================
// PAYSTACK WEBHOOK HANDLER
// ============================================

async function handlePaystackWebhook(body, signature) {
  try {
    // 1. Verify Paystack signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('❌ Invalid Paystack signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    console.log('📋 Paystack event:', payload.event);

    // 2. Handle successful charge
    if (payload.event === 'charge.success') {
      const { data } = payload;
      const txRef = data.reference;
      const bookingId = data.metadata?.booking_id;

      console.log('💳 Processing Paystack payment:', { txRef, bookingId });

      // Find transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_ref', txRef)
        .single();

      if (txError || !transaction) {
        console.error('❌ Transaction not found:', txRef);
        return Response.json({ error: 'Transaction not found' }, { status: 404 });
      }

      // Idempotency check
      if (transaction.payment_status === 'successful') {
        console.log('⚠️ Already processed:', txRef);
        return Response.json({ message: 'Already processed' }, { status: 200 });
      }

      // 3. Update transaction
      await supabase
        .from('transactions')
        .update({
          payment_status: 'successful',
          metadata: {
            ...transaction.metadata,
            paystack_transaction_id: data.id,
            channel: data.channel,
            fees: data.fees,
            authorization_code: data.authorization?.authorization_code,
            card_type: data.authorization?.card_type,
            last4: data.authorization?.last4,
            bank: data.authorization?.bank
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      console.log('✅ Transaction updated');

      // 4. Update booking
      await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          transaction_id: transaction.id,
          payment_reference: txRef,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      console.log('✅ Booking updated');

      // 5. 🌟 ADD TO ESCROW (CRITICAL STEP)
      await addToEscrow(
        transaction,
        txRef,
        'paystack',
        data.id // paystack_transaction_id
      );

      // 6. Send notifications
      await sendPaymentNotifications(transaction, bookingId, 'paystack');

      console.log('🎉 Paystack payment processed successfully');
      return Response.json({ success: true, message: 'Payment processed' });
    }

    // Handle failed charges
    if (payload.event === 'charge.failed') {
      const txRef = payload.data.reference;
      
      console.log('❌ Payment failed:', txRef);
      
      await supabase
        .from('transactions')
        .update({
          payment_status: 'failed',
          metadata: {
            failure_reason: payload.data.gateway_response
          }
        })
        .eq('transaction_ref', txRef);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('❌ Paystack webhook error:', error);
    return Response.json({ 
      error: 'Webhook processing failed', 
      details: error.message 
    }, { status: 500 });
  }
}

// ============================================
// STRIPE WEBHOOK HANDLER
// ============================================

async function handleStripeWebhook(body, signature) {
  try {
    // 1. Verify Stripe signature
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Invalid Stripe signature:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('📋 Stripe event:', event.type);

    // 2. Handle payment intent succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const txRef = paymentIntent.metadata?.tx_ref;
      const bookingId = paymentIntent.metadata?.booking_id;

      console.log('💳 Processing Stripe payment:', { txRef, bookingId });

      if (!txRef) {
        console.error('❌ No tx_ref in metadata');
        return Response.json({ error: 'Missing tx_ref' }, { status: 400 });
      }

      // Find transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_ref', txRef)
        .single();

      if (txError || !transaction) {
        console.error('❌ Transaction not found:', txRef);
        return Response.json({ error: 'Transaction not found' }, { status: 404 });
      }

      // Idempotency check
      if (transaction.payment_status === 'successful') {
        console.log('⚠️ Already processed:', txRef);
        return Response.json({ message: 'Already processed' }, { status: 200 });
      }

      // 3. Update transaction
      await supabase
        .from('transactions')
        .update({
          payment_status: 'successful',
          metadata: {
            ...transaction.metadata,
            stripe_payment_intent_id: paymentIntent.id,
            stripe_charge_id: paymentIntent.latest_charge,
            payment_method: paymentIntent.payment_method,
            amount_received: paymentIntent.amount_received / 100,
            currency: paymentIntent.currency.toUpperCase()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      console.log('✅ Transaction updated');

      // 4. Update booking
      await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          transaction_id: transaction.id,
          payment_reference: txRef,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      console.log('✅ Booking updated');

      // 5. 🌟 ADD TO ESCROW (CRITICAL STEP)
      await addToEscrow(
        transaction,
        txRef,
        'stripe',
        paymentIntent.id // stripe_payment_intent_id
      );

      // 6. Send notifications
      await sendPaymentNotifications(transaction, bookingId, 'stripe');

      console.log('🎉 Stripe payment processed successfully');
      return Response.json({ success: true, message: 'Payment processed' });
    }

    // Handle payment intent failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const txRef = paymentIntent.metadata?.tx_ref;

      console.log('❌ Stripe payment failed:', txRef);

      if (txRef) {
        await supabase
          .from('transactions')
          .update({
            payment_status: 'failed',
            metadata: {
              failure_reason: paymentIntent.last_payment_error?.message
            }
          })
          .eq('transaction_ref', txRef);
      }
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('❌ Stripe webhook error:', error);
    return Response.json({ 
      error: 'Webhook processing failed', 
      details: error.message 
    }, { status: 500 });
  }
}

// ============================================
// 🌟 ADD TO ESCROW FUNCTION
// This is where money goes into the company account
// and musician sees it in their ledger balance
// ============================================

async function addToEscrow(transaction, paymentReference, provider, providerId) {
  try {
    console.log('💰 Adding to escrow:', {
      booking_id: transaction.booking_id,
      musician_id: transaction.musician_id,
      gross_amount: transaction.amount,
      net_amount: transaction.net_amount,
      provider: provider
    });
    
    // Call database function to hold funds in escrow
    const { data, error } = await supabase
      .rpc('hold_escrow_funds', {
        p_booking_id: transaction.booking_id,
        p_gross_amount: transaction.amount,
        p_payment_reference: paymentReference,
        p_payment_provider: provider,
        p_currency: transaction.currency || 'NGN',
        p_stripe_payment_intent_id: provider === 'stripe' ? providerId : null,
        p_paystack_transaction_id: provider === 'paystack' ? providerId : null
      });

    if (error) {
      console.error('❌ Escrow error:', error);
      throw error;
    }

    console.log('✅ Escrow transaction created:', data);
    
    // Update original transaction with escrow reference
    await supabase
      .from('transactions')
      .update({
        metadata: {
          ...transaction.metadata,
          escrow_transaction_id: data,
          escrow_added: true,
          escrow_added_at: new Date().toISOString()
        }
      })
      .eq('id', transaction.id);

    return { success: true, escrow_transaction_id: data };
    
  } catch (error) {
    console.error('❌ Failed to add to escrow:', error);
    
    // Log escrow failure but don't fail the webhook
    // (Payment was successful, escrow can be handled manually if needed)
    await supabase
      .from('transactions')
      .update({
        metadata: {
          ...transaction.metadata,
          escrow_error: error.message,
          escrow_failed_at: new Date().toISOString(),
          needs_manual_escrow: true
        }
      })
      .eq('id', transaction.id);
    
    // Don't throw - payment was successful
    console.warn('⚠️ Payment received but escrow failed - flagged for manual processing');
  }
}

// ============================================
// SEND NOTIFICATIONS
// ============================================

async function sendPaymentNotifications(transaction, bookingId, provider) {
  try {
    console.log('📧 Sending notifications...');

    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        musician:musician_id(id, first_name, last_name, email),
        client:client_id(id, first_name, last_name, email),
        event:event_id(title)
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) {
      console.warn('⚠️ Booking not found for notifications');
      return;
    }

    const currencySymbol = transaction.currency === 'NGN' ? '₦' : '$';

    // Notify musician (funds in ledger)
    await supabase.from('notifications').insert({
      user_id: transaction.musician_id,
      type: 'payment_received',
      title: '💰 Payment Received!',
      message: `You received ${currencySymbol}${transaction.net_amount.toLocaleString()} for "${booking.event?.title || 'upcoming gig'}". Funds are held in escrow and will be released after the event.`,
      data: {
        booking_id: bookingId,
        transaction_id: transaction.id,
        amount: transaction.net_amount,
        currency: transaction.currency,
        event_title: booking.event?.title,
        payment_provider: provider
      }
    });

    // Notify client (payment successful)
    await supabase.from('notifications').insert({
      user_id: transaction.client_id,
      type: 'payment_success',
      title: '✅ Payment Successful!',
      message: `Your payment of ${currencySymbol}${transaction.amount.toLocaleString()} was successful. ${booking.musician?.first_name} ${booking.musician?.last_name} has been notified and your booking is confirmed.`,
      data: {
        booking_id: bookingId,
        transaction_id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        musician_name: `${booking.musician?.first_name} ${booking.musician?.last_name}`,
        event_title: booking.event?.title,
        payment_provider: provider
      }
    });

    console.log('✅ Notifications sent');
  } catch (error) {
    console.error('⚠️ Notification error:', error);
    // Don't throw - notifications are not critical
  }
}

// // Disable body parsing to get raw body for signature verification
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };