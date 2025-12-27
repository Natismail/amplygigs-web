// src/app/api/webhook/payment/route.js - UPDATED WITH ESCROW INTEGRATION
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get('x-paystack-signature') || req.headers.get('verif-hash');
  
  // Determine provider
  const isPaystack = req.headers.get('x-paystack-signature') !== null;
  const isFlutterwave = req.headers.get('verif-hash') !== null;

  if (isPaystack) {
    return await handlePaystackWebhook(body, signature);
  } else if (isFlutterwave) {
    return await handleFlutterwaveWebhook(body, signature);
  } else {
    return Response.json({ error: 'Unknown payment provider' }, { status: 400 });
  }
}

// Paystack Webhook Handler
async function handlePaystackWebhook(body, signature) {
  try {
    // Verify Paystack signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('❌ Invalid Paystack signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    console.log('📨 Paystack webhook received:', payload.event);

    // Handle successful charge
    if (payload.event === 'charge.success') {
      const { data } = payload;
      const txRef = data.reference;
      const bookingId = data.metadata?.booking_id;

      console.log('💳 Processing payment:', { txRef, bookingId });

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

      // Prevent duplicate processing
      if (transaction.payment_status === 'successful') {
        console.log('⚠️ Already processed:', txRef);
        return Response.json({ message: 'Already processed' }, { status: 200 });
      }

      // Update transaction
      await supabase
        .from('transactions')
        .update({
          payment_status: 'successful',
          metadata: {
            ...transaction.metadata,
            paystack_transaction_id: data.id,
            payment_method: data.channel,
            charged_amount: data.amount / 100, // Convert from kobo
            authorization_code: data.authorization?.authorization_code,
            card_type: data.authorization?.card_type,
            last4: data.authorization?.last4,
            bank: data.authorization?.bank
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      console.log('✅ Transaction updated');

      // Update booking
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

      // ⭐ ADD TO ESCROW (UPDATED FUNCTION)
      await addToEscrow(transaction, txRef);

      console.log('🎉 Paystack payment processed successfully:', txRef);
      
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

      console.log('Transaction marked as failed');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('❌ Paystack webhook error:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Flutterwave Webhook Handler
async function handleFlutterwaveWebhook(body, signature) {
  try {
    // Verify Flutterwave signature
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    
    if (signature !== secretHash) {
      console.error('❌ Invalid Flutterwave signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    console.log('📨 Flutterwave webhook received:', payload.event);

    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const { data } = payload;
      const txRef = data.tx_ref;
      const bookingId = data.meta?.booking_id;

      console.log('💳 Processing payment:', { txRef, bookingId });

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_ref', txRef)
        .single();

      if (txError || !transaction) {
        console.error('❌ Transaction not found:', txRef);
        return Response.json({ error: 'Transaction not found' }, { status: 404 });
      }

      if (transaction.payment_status === 'successful') {
        console.log('⚠️ Already processed:', txRef);
        return Response.json({ message: 'Already processed' }, { status: 200 });
      }

      await supabase
        .from('transactions')
        .update({
          payment_status: 'successful',
          metadata: {
            ...transaction.metadata,
            flutterwave_transaction_id: data.id,
            payment_method: data.payment_type,
            charged_amount: data.charged_amount,
            app_fee: data.app_fee
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      console.log('✅ Transaction updated');

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

      // ⭐ ADD TO ESCROW (UPDATED FUNCTION)
      await addToEscrow(transaction, txRef);

      console.log('🎉 Flutterwave payment processed successfully:', txRef);
      return Response.json({ success: true, message: 'Payment processed' });
    }

    if (payload.event === 'charge.completed' && payload.data.status === 'failed') {
      const txRef = payload.data.tx_ref;
      
      console.log('❌ Payment failed:', txRef);
      
      await supabase
        .from('transactions')
        .update({
          payment_status: 'failed',
          metadata: {
            failure_reason: payload.data.processor_response
          }
        })
        .eq('transaction_ref', txRef);

      console.log('Transaction marked as failed');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('❌ Flutterwave webhook error:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// ⭐ UPDATED FUNCTION - Add to escrow instead of direct wallet update
async function addToEscrow(transaction, paymentReference) {
  try {
    console.log('💰 Adding to escrow:', {
      booking_id: transaction.booking_id,
      musician_id: transaction.musician_id,
      amount: transaction.amount,
      net_amount: transaction.net_amount
    });
    
    // ⭐ Use the database function to add to ledger balance
    const { data, error } = await supabase
      .rpc('add_to_ledger_balance', {
        p_booking_id: transaction.booking_id,
        p_musician_id: transaction.musician_id,
        p_client_id: transaction.client_id,
        p_gross_amount: transaction.amount,
        p_platform_fee: transaction.platform_fee || 0,
        p_paystack_reference: paymentReference
      });

    if (error) {
      console.error('❌ Escrow error:', error);
      throw error;
    }

    console.log('✅ Added to escrow. Transaction ID:', data);
    
    // Update transaction with escrow info
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
    
    // Update transaction to indicate escrow failure
    await supabase
      .from('transactions')
      .update({
        metadata: {
          ...transaction.metadata,
          escrow_error: error.message,
          escrow_failed_at: new Date().toISOString()
        }
      })
      .eq('id', transaction.id);
    
    throw error;
  }
}

// Disable body parsing for raw body access
export const config = {
  api: {
    bodyParser: false,
  },
};