// src/pages/api/release-funds.js
import Flutterwave from 'flutterwave-node-v3';
import { supabase } from '@/lib/supabaseClient'; // Make sure this path is correct
// Add this at the very beginning of your component function
//console.log("🔴 COMPONENT LOADING");
//alert("Component is loading!"); // This will force a popup


export default async function handler(req, res) {
  // Ensure the request is a POST request to prevent unauthorized access
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Extract the necessary data from the request body
  const { bookingId, amount, musicianId } = req.body;
  
  const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  const flw = new Flutterwave(flutterwaveSecretKey);

  // Input validation
  if (!bookingId || !amount || !musicianId) {
    return res.status(400).json({ error: 'Missing required fields: bookingId, amount, and musicianId.' });
  }

  try {
    // 1. Validate the gig and its status from your database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('status, musician_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || booking.status !== 'confirmed_complete') {
      return res.status(400).json({ error: 'Invalid booking status or booking not found.' });
    }

    // 2. Fetch the musician's bank details for the transfer
    const { data: musician, error: musicianError } = await supabase
      .from('user_profiles')
      .select('bank_name, bank_account_number, bank_code, bank_account_name')
      .eq('id', musicianId)
      .single();
      
    if (musicianError || !musician || !musician.bank_account_number) {
      return res.status(404).json({ error: 'Musician bank details not found.' });
    }

    // 3. Initiate the transfer to the musician's bank account
    const payload = {
      account_bank: musician.bank_code,
      account_number: musician.bank_account_number,
      amount: amount,
      narration: `Gig payout for booking ${bookingId}`,
      currency: "NGN", // Assuming NGN, adjust as needed
      reference: `payout_${bookingId}_${Date.now()}`,
    };
    
    const response = await flw.Transfer.initiate(payload);

    if (response.status === 'success') {
      // 4. Update the booking status to indicate that funds have been released
      await supabase
        .from('bookings')
        .update({ status: 'funds_released' })
        .eq('id', bookingId);

      return res.status(200).json({ message: 'Funds successfully released to musician.', transaction_id: response.data.id });
    } else {
      console.error("Flutterwave Transfer Error:", response.message);
      return res.status(400).json({ error: response.message });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}

