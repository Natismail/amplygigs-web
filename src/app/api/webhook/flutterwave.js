// src/app/api/webhook/flutterwave.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify webhook signature from Flutterwave
    const signature = req.headers['verif-hash'];
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;

    if (!signature || signature !== secretHash) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;
    console.log('Webhook received:', payload.event);

    // 2. Handle successful charge
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const { data, meta } = payload;
      const txRef = data.tx_ref;
      const bookingId = meta?.booking_id;
      const musicianId = meta?.musician_id;

      // 3. Find and update transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_ref', txRef)
        .single();

      if (txError || !transaction) {
        console.error('Transaction not found:', txRef);
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Prevent duplicate processing
      if (transaction.payment_status === 'successful') {
        return res.status(200).json({ message: 'Already processed' });
      }

      // 4. Update transaction status
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

      // 5. Update booking status
      await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          transaction_id: transaction.id,
          escrow_amount: transaction.net_amount,
          payment_verified_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      // 6. Add funds to musician's LEDGER balance (not available yet)
      const { data: wallet, error: walletError } = await supabase
        .from('musician_wallets')
        .select('*')
        .eq('musician_id', musicianId)
        .single();

      if (!walletError && wallet) {
        const newLedgerBalance = parseFloat(wallet.ledger_balance) + parseFloat(transaction.net_amount);
        const newTotalEarnings = parseFloat(wallet.total_earnings) + parseFloat(transaction.net_amount);

        await supabase
          .from('musician_wallets')
          .update({
            ledger_balance: newLedgerBalance,
            total_earnings: newTotalEarnings
          })
          .eq('musician_id', musicianId);
      }

      console.log(`✅ Payment processed: ${txRef} - Booking ${bookingId}`);

      // TODO: Send notification to musician about payment in escrow
      // TODO: Send confirmation email to client

      return res.status(200).json({
        success: true,
        message: 'Payment processed successfully'
      });
    }

await supabase.rpc('credit_musician_ledger', {
  p_musician_id: musicianId,
  p_amount: transaction.net_amount
});



    // Handle failed payments
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

      console.log(`❌ Payment failed: ${txRef}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      details: error.message
    });
  }
}