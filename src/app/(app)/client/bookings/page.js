// //app/client/bookings/page.js


"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import ReleaseFundsButton from '@/components/ReleaseFundsButton';

export default function ClientBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { bookings, loading, fetchBookings } = useData();
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    if (user && (!bookings || bookings.length === 0)) {
      fetchBookings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refreshBookings = () => {
    fetchBookings(true);
  };

  // Filter bookings for this client
  const clientBookings = bookings.filter(b => b.client_id === user?.id);
  
  const upcomingBookings = clientBookings.filter(
    b => b.status === 'confirmed' && new Date(b.event_date) >= new Date()
  );
  const pastBookings = clientBookings.filter(
    b => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.event_date) < new Date())
  );
  const pendingRequests = clientBookings.filter(b => b.status === 'pending');

  const getPaymentStatusBadge = (booking) => {
    if (!booking.payment_status || booking.payment_status === 'pending') {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Unpaid</span>;
    }
    if (booking.payment_status === 'paid' && !booking.funds_released_at) {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Paid - In Escrow</span>;
    }
    if (booking.funds_released_at) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Completed</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Unknown</span>;
  };

  const handlePayNow = (bookingId) => {
    // Redirect to payment page
    window.location.href = `/payment?bookingId=${bookingId}`;
  };

  if (authLoading || (loading.bookings && bookings.length === 0)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-lg text-gray-600">Please log in to view your bookings.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
        <button
          onClick={refreshBookings}
          className="text-sm text-blue-600 hover:underline"
        >
          🔄 Refresh
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'upcoming'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'pending'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'past'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Past ({pastBookings.length})
        </button>
      </div>

      {/* Upcoming Bookings */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map(booking => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {booking.events?.title || 'Event'}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        <strong>Musician:</strong> {booking.musician?.first_name} {booking.musician?.last_name}
                      </p>
                      <p>
                        <strong>Location:</strong> {booking.event_location}
                      </p>
                      <p>
                        <strong>Date:</strong> {new Date(booking.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p>
                        <strong>Amount:</strong> ₦{booking.amount?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    {getPaymentStatusBadge(booking)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  {(!booking.payment_status || booking.payment_status === 'pending') && (
                    <button
                      onClick={() => handlePayNow(booking.id)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      💳 Pay Now
                    </button>
                  )}
                  
                  {booking.payment_status === 'paid' && !booking.funds_released_at && (
                    <div className="flex-1">
                      <ReleaseFundsButton
                        booking={{
                          ...booking,
                          musician_name: `${booking.musician?.first_name} ${booking.musician?.last_name}`,
                          event_name: booking.events?.title
                        }}
                        onSuccess={refreshBookings}
                      />
                    </div>
                  )}

                  <button
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500">No upcoming bookings.</p>
            </div>
          )}
        </div>
      )}

      {/* Pending Requests */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingRequests.length > 0 ? (
            pendingRequests.map(booking => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {booking.events?.title || 'Event'}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        <strong>Musician:</strong> {booking.musician?.first_name} {booking.musician?.last_name}
                      </p>
                      <p>
                        <strong>Location:</strong> {booking.event_location}
                      </p>
                      <p>
                        <strong>Status:</strong> Awaiting Musician Approval
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded">
                    Pending
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500">No pending requests.</p>
            </div>
          )}
        </div>
      )}

      {/* Past Bookings */}
      {activeTab === 'past' && (
        <div className="space-y-4">
          {pastBookings.length > 0 ? (
            pastBookings.map(booking => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {booking.events?.title || 'Event'}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        <strong>Musician:</strong> {booking.musician?.first_name} {booking.musician?.last_name}
                      </p>
                      <p>
                        <strong>Location:</strong> {booking.event_location}
                      </p>
                      <p>
                        <strong>Date:</strong> {new Date(booking.event_date).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Amount:</strong> ₦{booking.amount?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                  <div>
                    {getPaymentStatusBadge(booking)}
                  </div>
                </div>

                {/* Show release button for paid but not released bookings */}
                {booking.payment_status === 'paid' && !booking.funds_released_at && (
                  <div className="mt-4">
                    <ReleaseFundsButton
                      booking={{
                        ...booking,
                        musician_name: `${booking.musician?.first_name} ${booking.musician?.last_name}`,
                        event_name: booking.events?.title
                      }}
                      onSuccess={refreshBookings}
                    />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500">No past bookings.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


