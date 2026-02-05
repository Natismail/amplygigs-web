// src/app/api/banks/verify-account/route.js
// Verify bank account number using Paystack

export async function POST(req) {
  try {
    const { account_number, bank_code } = await req.json();

    // Validation
    if (!account_number || !bank_code) {
      return Response.json({
        success: false,
        error: 'Account number and bank code are required'
      }, { status: 400 });
    }

    if (account_number.length !== 10) {
      return Response.json({
        success: false,
        error: 'Account number must be exactly 10 digits'
      }, { status: 400 });
    }

    console.log('🔍 Verifying account:', { account_number, bank_code });

    // Call Paystack API
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (result.status && result.data) {
      console.log('✅ Account verified:', result.data.account_name);
      
      return Response.json({
        success: true,
        account_name: result.data.account_name,
        account_number: result.data.account_number,
        bank_id: result.data.bank_id
      });
    } else {
      console.log('❌ Verification failed:', result.message);
      
      return Response.json({
        success: false,
        error: result.message || 'Could not verify account. Please check the details and try again.'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Account verification error:', error);
    
    return Response.json({
      success: false,
      error: 'Account verification failed. Please try again.'
    }, { status: 500 });
  }
}