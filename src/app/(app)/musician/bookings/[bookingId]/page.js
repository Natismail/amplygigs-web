// //app/(app)/musician/bookings/[bookingId]/page.js


 'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function BookingDetailsPage() {
  const { user } = useAuth();
  const { bookings, fetchBookings } = useData();
  const { bookingId } = useParams();
  const router = useRouter();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // First try to get from cache
    const cachedBooking = bookings.find(b => b.id === bookingId);
    
    if (cachedBooking) {
      setBooking(cachedBooking);
      setLoading(false);
    } else {
      // If not in cache, fetch it
      fetchBookingDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, bookings]);

  const fetchBookingDetails = async () => {
    if (!user || !bookingId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        client:client_id(first_name, last_name, phone, email),
        musician:musician_id(first_name, last_name, phone, email),
        events:event_id(title, description)
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      setError('Failed to load booking details');
    } else {
      setBooking(data);
    }
    setLoading(false);
  };

  const handleAcceptGig = async () => {
    if (!confirm('Are you sure you want to accept this gig?')) return;
    
    setActionLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state
      setBooking({ ...booking, status: 'confirmed' });
      
      // Refresh bookings in cache
      await fetchBookings(true);
      
      alert('Gig accepted successfully!');
      router.push('/musician/bookings');
    } catch (err) {
      setError('Failed to accept gig: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineGig = async () => {
    if (!confirm('Are you sure you want to decline this gig?')) return;
    
    setActionLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'declined' })
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state
      setBooking({ ...booking, status: 'declined' });
      
      // Refresh bookings in cache
      await fetchBookings(true);
      
      alert('Gig declined.');
      router.push('/musician/bookings');
    } catch (err) {
      setError('Failed to decline gig: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error || 'Booking not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:underline"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <button
        onClick={() => router.back()}
        className="mb-6 text-blue-600 hover:underline flex items-center gap-2"
      >
        ← Back to Bookings
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {booking.events?.title || 'Gig Details'}
              </h1>
              <p className="text-purple-100">
                {booking.events?.description || 'Booking Information'}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-lg font-medium ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          {/* Client Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>👤</span> Client Information
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <p>
                <strong>Name:</strong> {booking.client?.first_name} {booking.client?.last_name}
              </p>
              <p>
                <strong>Phone:</strong> {booking.client?.phone || 'Not provided'}
              </p>
              <p>
                <strong>Email:</strong> {booking.client?.email || 'Not provided'}
              </p>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>🎵</span> Event Details
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <p>
                <strong>Location:</strong> {booking.event_location}
              </p>
              <p>
                <strong>Date:</strong> {new Date(booking.event_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {booking.event_duration && (
                <p>
                  <strong>Duration:</strong> {booking.event_duration} hours
                </p>
              )}
              {booking.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <strong>Additional Notes:</strong>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {booking.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>💰</span> Payment Information
            </h3>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Offered Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  ₦{booking.amount?.toLocaleString() || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You&apos;ll receive 90% after platform fee (₦{((booking.amount || 0) * 0.9).toLocaleString()})
              </p>
              {booking.payment_status && (
                <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    Payment Status: {booking.payment_status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {booking.status === 'pending' && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAcceptGig}
                disabled={actionLoading}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : '✓ Accept Gig'}
              </button>
              <button
                onClick={handleDeclineGig}
                disabled={actionLoading}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                ✗ Decline
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



// import { useState, useEffect } from 'react';
// import { supabase } from '@/lib/supabaseClient';
// import { useAuth } from '@/context/AuthContext';
// import { useParams } from 'next/navigation';

// export default function BookingDetailsPage() {
//   const { user } = useAuth();
//   const { bookingId } = useParams();
//   const [booking, setBooking] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchBooking = async () => {
//       if (!user || !bookingId) return;
      
//       const { data, error } = await supabase
//         .from('bookings')
//         .select(`
//           *,
//           client:client_id(first_name, last_name, phone),
//           musician:musician_id(first_name, last_name, phone)
//         `)
//         .eq('id', bookingId)
//         .single();

//       if (error) {
//         console.error('Error fetching booking details:', error.message);
//       } else {
//         setBooking(data);
//       }
//       setLoading(false);
//     };

//     fetchBooking();
//   }, [user, bookingId]);

//   if (loading) {
//     return <div>Loading booking details...</div>;
//   }

//   if (!booking) {
//     return <div>Booking not found.</div>;
//   }

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-6">Booking Details</h1>
//       <div className="bg-white p-6 rounded-lg shadow-md">
//         <p><strong>Gig Title:</strong> {booking.title}</p>
//         <p><strong>Client:</strong> {booking.client.first_name} {booking.client.last_name}</p>
//         <p><strong>Location:</strong> {booking.event_location}</p>
//         <p><strong>Date:</strong> {new Date(booking.event_date).toLocaleDateString()}</p>
//         <p><strong>Status:</strong> {booking.status}</p>
//         <p><strong>Proposed Amount:</strong> ${booking.offered_price}</p>
//         {/* Add more details here, and conditional buttons for actions */}
//         {booking.status === 'pending' && (
//           <div className="mt-4 space-x-2">
//             <button className="bg-green-600 text-white px-4 py-2 rounded">Accept Gig</button>
//             <button className="bg-red-600 text-white px-4 py-2 rounded">Decline Gig</button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }