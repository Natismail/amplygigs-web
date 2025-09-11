'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function ClientBookingsPage() {
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          musician:musician_id(first_name, last_name, phone)
        `)
        .eq('client_id', user.id);

      if (error) {
        console.error('Error fetching client bookings:', error.message);
      } else {
        setBookings(data || []);
      }
    };

    if (!loading) {
      fetchBookings();
    }
  }, [user, loading]);

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
  const pastBookings = bookings.filter(b => b.status === 'completed');
  const pendingRequests = bookings.filter(b => b.status === 'pending');

  if (loading) {
    return <div>Loading your bookings...</div>;
  }

  if (!user) {
    return <div>Please log in to view your bookings.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Upcoming ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Pending ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'past' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Past ({pastBookings.length})
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'upcoming' && (
          upcomingBookings.length > 0 ? (
            upcomingBookings.map(booking => (
              <div key={booking.id} className="p-4 border rounded-lg shadow-sm">
                <p><strong>Musician:</strong> {booking.musician.first_name} {booking.musician.last_name}</p>
                <p><strong>Location:</strong> {booking.event_location}</p>
                <p><strong>Date:</strong> {new Date(booking.event_date).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <p>No upcoming bookings.</p>
          )
        )}
        {activeTab === 'pending' && (
          pendingRequests.length > 0 ? (
            pendingRequests.map(booking => (
              <div key={booking.id} className="p-4 border rounded-lg shadow-sm">
                <p><strong>Musician:</strong> {booking.musician.first_name} {booking.musician.last_name}</p>
                <p><strong>Location:</strong> {booking.event_location}</p>
                <p><strong>Status:</strong> Awaiting Musician Approval</p>
              </div>
            ))
          ) : (
            <p>No pending requests.</p>
          )
        )}
        {activeTab === 'past' && (
          pastBookings.length > 0 ? (
            pastBookings.map(booking => (
              <div key={booking.id} className="p-4 border rounded-lg shadow-sm">
                <p><strong>Musician:</strong> {booking.musician.first_name} {booking.musician.last_name}</p>
                <p><strong>Location:</strong> {booking.event_location}</p>
                <p><strong>Date:</strong> {new Date(booking.event_date).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <p>No past bookings.</p>
          )
        )}
      </div>
    </div>
  );
}