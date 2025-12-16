// src/app/api/banks.js (or banks/route.js for App Router)
import Flutterwave from 'flutterwave-node-v3';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const flw = new Flutterwave(
      process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      process.env.FLUTTERWAVE_SECRET_KEY
    );

    // Fetch list of Nigerian banks from Flutterwave
    const response = await flw.Bank.country({ country: 'NG' });

    if (response.status === 'success') {
      // Sort banks alphabetically
      const sortedBanks = response.data.sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      return res.status(200).json({
        success: true,
        banks: sortedBanks
      });
    } else {
      return res.status(400).json({
        error: 'Failed to fetch banks',
        details: response.message
      });
    }
  } catch (error) {
    console.error('Banks API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}