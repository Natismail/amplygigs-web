// src/app/api/earnings/route.js

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServerClient'; // Note: Use a server-side Supabase client
import { headers } from 'next/headers';

// Placeholder for your Flutterwave integration
// In a real-world scenario, you would import and use the official Flutterwave SDK here.
const getFlutterwaveBalance = async (subaccountId) => {
  // This is where you'd make a secure, server-side call to the Flutterwave API.
  // Example:
  // const response = await fetch(`https://api.flutterwave.com/v3/subaccounts/${subaccountId}/balance`, {
  //   headers: {
  //     'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  // });
  // const data = await response.json();
  // return data.balance;

  // Using a mock API response for demonstration
  console.log(`Fetching balance for subaccount: ${subaccountId}`);
  return 50000; // Mock available balance in Naira
};

// Placeholder for Flutterwave ledger
const getFlutterwaveLedger = async (subaccountId) => {
  // This would fetch the list of transactions from Flutterwave for the subaccount.
  console.log(`Fetching ledger for subaccount: ${subaccountId}`);
  return 75000; // Mock ledger balance
};

export async function GET(request) {
  try {
    // 1. Get the user's ID from the authorization header
    // This is a secure way to identify the user on the server
    const headersList = headers();
    const authorization = headersList.get('authorization');
    if (!authorization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authorization.split(' ')[1];
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // 2. Get the musician's Flutterwave sub-account ID from your database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('flutterwave_subaccount_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.flutterwave_subaccount_id) {
      return NextResponse.json({ error: 'Musician sub-account not found' }, { status: 404 });
    }

    const subaccountId = profile.flutterwave_subaccount_id;

    // 3. Securely fetch data from Flutterwave on the server
    const availableBalance = await getFlutterwaveBalance(subaccountId);
    const ledgerBalance = await getFlutterwaveLedger(subaccountId);

    // 4. Return the data to the client
    return NextResponse.json({
      available: availableBalance,
      ledger: ledgerBalance,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}