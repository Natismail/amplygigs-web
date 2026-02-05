// src/app/api/banks/list/route.js
// Fetch list of Nigerian banks from Paystack

export async function GET() {
  try {
    const response = await fetch('https://api.paystack.co/bank', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.status) {
      // Sort banks alphabetically
      const sortedBanks = result.data.sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      return Response.json({
        success: true,
        banks: sortedBanks,
        count: sortedBanks.length
      });
    } else {
      return Response.json({
        success: false,
        error: 'Failed to fetch banks from Paystack'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Fetch banks error:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch banks list'
    }, { status: 500 });
  }
}