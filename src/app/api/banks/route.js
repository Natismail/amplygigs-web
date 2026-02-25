// src/app/api/banks/route.js
// ⭐ CORRECT PATH: This matches the fetch('/api/banks') call in BankAccountManager

export async function GET() {
  try {
    console.log('📡 Fetching banks from Paystack...');
    
    const response = await fetch('https://api.paystack.co/bank', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Paystack API error:', response.status, response.statusText);
      throw new Error(`Paystack API returned ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Paystack response:', result.status ? 'Success' : 'Failed');

    if (result.status) {
      // Sort banks alphabetically
      const sortedBanks = result.data.sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      console.log(`✅ Returning ${sortedBanks.length} banks`);

      return Response.json({
        success: true,
        banks: sortedBanks,
        count: sortedBanks.length
      });
    } else {
      console.error('❌ Paystack returned status: false');
      return Response.json({
        success: false,
        error: result.message || 'Failed to fetch banks from Paystack'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Fetch banks error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to fetch banks list'
    }, { status: 500 });
  }
}