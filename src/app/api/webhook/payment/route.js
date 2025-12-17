// src/app/api/webhook/payment/route.js
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
      console.error('Invalid Paystack signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    console.log('Paystack webhook received:', payload.event);

    // Handle successful charge
    if (payload.event === 'charge.success') {
      const { data } = payload;
      const txRef = data.reference;
      const bookingId = data.metadata?.booking_id;

      // Find transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_ref', txRef)
        .single();

      if (txError || !transaction) {
        console.error('Transaction not found:', txRef);
        return Response.json({ error: 'Transaction not found' }, { status: 404 });
      }

      // Prevent duplicate processing
      if (transaction.payment_status === 'successful') {
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

      // Update booking
      await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          transaction_id: transaction.id,
          escrow_amount: transaction.net_amount,
          payment_verified_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      // Add to musician's ledger
      await updateMusicianLedger(transaction.musician_id, transaction.net_amount);

      console.log(`✅ Paystack payment processed: ${txRef}`);
      
      // TODO: Send notifications
      return Response.json({ success: true, message: 'Payment processed' });
    }

    // Handle failed charges
    if (payload.event === 'charge.failed') {
      const txRef = payload.data.reference;
      
      await supabase
        .from('transactions')
        .update({
          payment_status: 'failed',
          metadata: {
            failure_reason: payload.data.gateway_response
          }
        })
        .eq('transaction_ref', txRef);

      console.log(`❌ Paystack payment failed: ${txRef}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Flutterwave Webhook Handler
async function handleFlutterwaveWebhook(body, signature) {
  try {
    // Verify Flutterwave signature
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    
    if (signature !== secretHash) {
      console.error('Invalid Flutterwave signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    console.log('Flutterwave webhook received:', payload.event);

    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const { data, meta } = payload;
      const txRef = data.tx_ref;
      const bookingId = meta?.booking_id;

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_ref', txRef)
        .single();

      if (txError || !transaction) {
        console.error('Transaction not found:', txRef);
        return Response.json({ error: 'Transaction not found' }, { status: 404 });
      }

      if (transaction.payment_status === 'successful') {
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

      await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          transaction_id: transaction.id,
          escrow_amount: transaction.net_amount,
          payment_verified_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      await updateMusicianLedger(transaction.musician_id, transaction.net_amount);

      console.log(`✅ Flutterwave payment processed: ${txRef}`);
      return Response.json({ success: true, message: 'Payment processed' });
    }

    if (payload.event === 'charge.completed' && payload.data.status === 'failed') {
      const txRef = payload.data.tx_ref;
      
      await supabase
        .from('transactions')
        .update({
          payment_status: 'failed',
          metadata: {
            failure_reason: payload.data.processor_response
          }
        })
        .eq('transaction_ref', txRef);

      console.log(`❌ Flutterwave payment failed: ${txRef}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Helper function to update musician ledger
async function updateMusicianLedger(musicianId, amount) {
  const { data: wallet, error: walletError } = await supabase
    .from('musician_wallets')
    .select('*')
    .eq('musician_id', musicianId)
    .single();

  if (!walletError && wallet) {
    const newLedgerBalance = parseFloat(wallet.ledger_balance) + parseFloat(amount);
    const newTotalEarnings = parseFloat(wallet.total_earnings) + parseFloat(amount);

    await supabase
      .from('musician_wallets')
      .update({
        ledger_balance: newLedgerBalance,
        total_earnings: newTotalEarnings
      })
      .eq('musician_id', musicianId);
  }
}
