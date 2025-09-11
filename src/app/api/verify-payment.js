// src/pages/api/verify-payment.js
import Flutterwave from 'flutterwave-node-v3';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req, res) {
  const { transaction_id } = req.body; // or req.query for a GET request
  const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  const flw = new Flutterwave(flutterwaveSecretKey);

  if (!transaction_id) {
    return res.status(400).json({ error: 'Transaction ID is required.' });
  }

  try {
    const response = await flw.Transaction.verify({ id: transaction_id });

    if (response.status === 'success') {
      // Payment is successful, now update your database
      const bookingId = response.data.meta.bookingId;

      const { data, error } = await supabase
        .from('gigs')
        .update({ 
          status: 'paid',
          transaction_id: transaction_id,
          escrow_amount: response.data.amount,
        })
        .eq('id', bookingId);
      
      if (error) {
        return res.status(500).json({ error: 'Failed to update gig status.' });
      }

      res.status(200).json({ message: 'Payment verified and gig updated.' });
    } else {
      res.status(400).json({ error: 'Payment verification failed.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during verification.' });
  }
}