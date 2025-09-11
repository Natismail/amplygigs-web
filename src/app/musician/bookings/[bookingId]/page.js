'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';

export default function BookingDetailsPage() {
  const { user } = useAuth();
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!user || !bookingId) return;
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:client_id(first_name, last_name, phone),
          musician:musician_id(first_name, last_name, phone)
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('Error fetching booking details:', error.message);
      } else {
        setBooking(data);
      }
      setLoading(false);
    };

    fetchBooking();
  }, [user, bookingId]);

  if (loading) {
    return <div>Loading booking details...</div>;
  }

  if (!booking) {
    return <div>Booking not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Booking Details</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p><strong>Gig Title:</strong> {booking.title}</p>
        <p><strong>Client:</strong> {booking.client.first_name} {booking.client.last_name}</p>
        <p><strong>Location:</strong> {booking.event_location}</p>
        <p><strong>Date:</strong> {new Date(booking.event_date).toLocaleDateString()}</p>
        <p><strong>Status:</strong> {booking.status}</p>
        <p><strong>Proposed Amount:</strong> ${booking.offered_price}</p>
        {/* Add more details here, and conditional buttons for actions */}
        {booking.status === 'pending' && (
          <div className="mt-4 space-x-2">
            <button className="bg-green-600 text-white px-4 py-2 rounded">Accept Gig</button>
            <button className="bg-red-600 text-white px-4 py-2 rounded">Decline Gig</button>
          </div>
        )}
      </div>
    </div>
  );
}