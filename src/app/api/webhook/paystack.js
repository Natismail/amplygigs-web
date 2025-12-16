import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify Paystack signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    // 2. Handle successful charge
    if (event.event === 'charge.success') {
      const reference = event.data.reference;

      // 3. Fetch transaction
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_ref', reference)
        .single();

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Idempotency check
      if (transaction.payment_status === 'successful') {
        return res.status(200).json({ message: 'Already processed' });
      }

      // 4. Update transaction
      await supabase
        .from('transactions')
        .update({
          payment_status: 'successful',
          payment_provider: 'paystack',
          metadata: {
            paystack_transaction_id: event.data.id,
            channel: event.data.channel,
            fees: event.data.fees
          }
        })
        .eq('id', transaction.id);

      // 5. Update booking
      const { data: booking } = await supabase
        .from('bookings')
        .select('id, musician_id')
        .eq('id', transaction.booking_id)
        .single();

      await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          escrow_amount: transaction.net_amount,
          payment_verified_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      // 6. Credit ledger safely (RPC)
      await supabase.rpc('credit_musician_ledger', {
        p_musician_id: booking.musician_id,
        p_amount: transaction.net_amount
      });

      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Paystack webhook error:', err);
    return res.status(500).json({ error: 'Webhook error' });
  }
}
