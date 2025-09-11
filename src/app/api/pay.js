// src/pages/api/pay.js
// Add this at the very beginning of your component function
//console.log("🔴 COMPONENT LOADING");
//alert("Component is loading!"); // This will force a popup

import Flutterwave from 'flutterwave-node-v3';
import { supabase } from '@/lib/supabaseClient'; // Make sure you have this import

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, email, currency, bookingId, musicianId } = req.body;
  const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  const flw = new Flutterwave(flutterwaveSecretKey);

  try {
    // Fetch musician's subaccount ID from your database
    const { data: musician, error } = await supabase
      .from('user_profiles')
      .select('flutterwave_subaccount_id')
      .eq('id', musicianId)
      .single();

    if (error || !musician || !musician.flutterwave_subaccount_id) {
      return res.status(404).json({ error: 'Musician subaccount not found.' });
    }

    // This is the variable you needed to replace!
    const musicianSubaccountId = musician.flutterwave_subaccount_id;

    const payload = {
      tx_ref: `gig_${bookingId}_${Date.now()}`,
      amount,
      currency,
      redirect_url: `${req.headers.origin}/payment-success?bookingId=${bookingId}`,
      customer: { email },
      subaccounts: [
        {
          id: musicianSubaccountId, // Use the real ID fetched from the database
          transaction_charge_type: "flat_subaccount_charge",
          // Calculate the musician's share
          transaction_charge: amount * 0.9, 
        }
      ]
    };

    const response = await flw.Charge.initiate(payload);

    if (response.status === 'success') {
      res.status(200).json({ paymentLink: response.data.link });
    } else {
      res.status(400).json({ error: response.data.message });
    }
  } catch (error) {
    console.error("Flutterwave API Error:", error.message);
    res.status(500).json({ error: "Failed to initiate payment." });
  }
}