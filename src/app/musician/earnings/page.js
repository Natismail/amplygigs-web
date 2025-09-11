'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function MusicianEarningsPage() {
  const { user, loading, session } = useAuth();
  const [earnings, setEarnings] = useState({ available: 0, ledger: 0 });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user || !session) {
        setFetching(false);
        return;
      }
      
      try {
        const response = await fetch('/api/earnings', {
          method: 'GET',
          headers: {
            // Pass the user's session token securely
            'Authorization': `Bearer ${session.access_token}`, 
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEarnings(data);
      } catch (error) {
        console.error('Failed to fetch earnings:', error);
        // You might want to show a user-facing error message here
      } finally {
        setFetching(false);
      }
    };

    if (!loading) {
      fetchEarnings();
    }
  }, [user, loading, session]);

  if (loading || fetching) {
    return <div>Loading your earnings...</div>;
  }

  if (!user) {
    return <div>Please log in to view your earnings.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Earnings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800">Available Balance</h2>
          <p className="text-4xl font-bold text-green-600 mt-2">₦{earnings.available.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Funds available for withdrawal.</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Withdraw Funds</button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800">Ledger Balance</h2>
          <p className="text-4xl font-bold text-orange-600 mt-2">₦{earnings.ledger.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Funds held for upcoming or completed gigs.</p>
        </div>
      </div>
    </div>
  );
}