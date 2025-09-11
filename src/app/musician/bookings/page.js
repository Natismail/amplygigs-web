'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function MusicianBookingsPage() {
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:client_id(first_name, last_name, phone)
        `)
        .eq('musician_id', user.id);

      if (error) {
        console.error('Error fetching musician bookings:', error.message);
      } else {
        setBookings(data || []);
      }
    };

    if (!loading) {
      fetchBookings();
    }
  }, [user, loading]);

  const gigRequests = bookings.filter(b => b.status === 'pending');
  const confirmedGigs = bookings.filter(b => b.status === 'confirmed');
  const pastGigs = bookings.filter(b => b.status === 'completed');

  if (loading) {
    return <div>Loading your gig requests...</div>;
  }

  if (!user) {
    return <div>Please log in to view your bookings.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Gigs & Bookings</h1>
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'requests' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Gig Requests ({gigRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('confirmed')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Confirmed Gigs ({confirmedGigs.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'past' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Past Gigs ({pastGigs.length})
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'requests' && (
          gigRequests.length > 0 ? (
            gigRequests.map(booking => (
              <div key={booking.id} className="p-4 border rounded-lg shadow-sm">
                <Link href={`/musician/bookings/${booking.id}`}>
  <div className="p-4 border rounded-lg shadow-sm">
    <p><strong>Client:</strong> {booking.client.first_name} {booking.client.last_name}</p>
    <p><strong>Location:</strong> {booking.event_location}</p>
    <p><strong>Price:</strong> ${booking.offered_price}</p>
    </div>
    </Link>
                {/* Add buttons to accept or decline the request */}
              </div>
            ))
          ) : (
            <p>No new gig requests.</p>
          )
        )}
        {activeTab === 'confirmed' && (
          confirmedGigs.length > 0 ? (
            confirmedGigs.map(booking => (
              <div key={booking.id} className="p-4 border rounded-lg shadow-sm">
                <p><strong>Client:</strong> {booking.client.first_name} {booking.client.last_name}</p>
                <p><strong>Location:</strong> {booking.event_location}</p>
                <p><strong>Date:</strong> {new Date(booking.event_date).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <p>No confirmed gigs yet.</p>
          )
        )}
        {activeTab === 'past' && (
          pastGigs.length > 0 ? (
            pastGigs.map(booking => (
              <div key={booking.id} className="p-4 border rounded-lg shadow-sm">
                <p><strong>Client:</strong> {booking.client.first_name} {booking.client.last_name}</p>
                <p><strong>Location:</strong> {booking.event_location}</p>
                <p><strong>Date:</strong> {new Date(booking.event_date).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <p>No past gigs.</p>
          )
        )}
      </div>
    </div>
  );
}