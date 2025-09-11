// src/pages/api/musician/onboard.js
import Flutterwave from 'flutterwave-node-v3';

// Add this at the very beginning of your component function
//console.log("🔴 COMPONENT LOADING");
//alert("Component is loading!"); // This will force a popup

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { business_name, bank_code, account_number, musician_id } = req.body;
  const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  const flw = new Flutterwave(flutterwaveSecretKey);

  try {
    const response = await flw.Subaccount.create({
      business_name,
      bank_code,
      account_number,
    });

    if (response.status === 'success') {
      const subaccountId = response.data.subaccount_id;
      
      // Save the subaccount_id to your Supabase database
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ flutterwave_subaccount_id: subaccountId })
        .eq('id', musician_id);

      if (error) {
        return res.status(500).json({ error: 'Failed to save subaccount ID.' });
      }

      res.status(200).json({ message: 'Musician onboarded successfully.' });
    } else {
      res.status(400).json({ error: response.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating a subaccount.' });
  }
}