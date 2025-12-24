// //app/(app)/musician/bookings/page.js


 'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

export default function MusicianBookingsPage() {
  const { user } = useAuth();
  const { bookings, loading, fetchBookings } = useData();
  const [activeTab, setActiveTab] = useState('requests');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && (!bookings || bookings.length === 0)) {
      fetchBookings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookings(true);
    setRefreshing(false);
  };

  const myBookings = bookings.filter(b => b.musician_id === user?.id);
  const gigRequests = myBookings.filter(b => b.status === 'pending');
  const confirmedGigs = myBookings.filter(b => b.status === 'confirmed');
  const pastGigs = myBookings.filter(b => b.status === 'completed');

  if (loading.bookings && bookings.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <div className="text-6xl mb-4">🎵</div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Please log in to view your bookings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 sm:pb-6">
      {/* Mobile Header - Sticky */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 safe-top">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            My Gigs
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition disabled:opacity-50"
            aria-label="Refresh"
          >
            <span className={`text-xl ${refreshing ? 'animate-spin' : ''}`}>🔄</span>
          </button>
        </div>

        {/* Tabs - Horizontal Scroll on mobile */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex px-4 gap-2 min-w-max">
            <button
              onClick={() => setActiveTab('requests')}
              className={`min-h-[44px] px-5 py-2 rounded-full font-medium text-sm whitespace-nowrap transition ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Requests ({gigRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('confirmed')}
              className={`min-h-[44px] px-5 py-2 rounded-full font-medium text-sm whitespace-nowrap transition ${
                activeTab === 'confirmed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Confirmed ({confirmedGigs.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`min-h-[44px] px-5 py-2 rounded-full font-medium text-sm whitespace-nowrap transition ${
                activeTab === 'past'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Past ({pastGigs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {/* Gig Requests */}
        {activeTab === 'requests' && (
          gigRequests.length > 0 ? (
            gigRequests.map(booking => (
              <Link href={`/musician/bookings/${booking.id}`} key={booking.id}>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 border-yellow-200 dark:border-yellow-800 active:scale-98 transition-transform">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full mb-2">
                        New Request
                      </span>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {booking.events?.title || 'Gig Request'}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <span className="w-5">👤</span>
                      <span>{booking.client?.first_name} {booking.client?.last_name}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <span className="w-5">📍</span>
                      <span className="truncate">{booking.event_location}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <span className="w-5">📅</span>
                      <span>{new Date(booking.event_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500">Offered Price</span>
                    <span className="text-lg font-bold text-green-600">
                      ₦{booking.amount?.toLocaleString() || '0'}
                    </span>
                  </div>

                  {/* Action hint */}
                  <div className="mt-3 text-center">
                    <span className="text-xs text-blue-600 font-medium">
                      Tap to view details →
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                No New Requests
              </h3>
              <p className="text-sm text-gray-500">
                Check back later for new gig opportunities
              </p>
            </div>
          )
        )}

        {/* Confirmed Gigs */}
        {activeTab === 'confirmed' && (
          confirmedGigs.length > 0 ? (
            confirmedGigs.map(booking => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full mb-2">
                      Confirmed
                    </span>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {booking.events?.title || 'Confirmed Gig'}
                    </h3>
                  </div>
                  {booking.payment_status === 'paid' && (
                    <span className="text-xl">💰</span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <span className="w-5">👤</span>
                    <span>{booking.client?.first_name} {booking.client?.last_name}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <span className="w-5">📍</span>
                    <span className="truncate">{booking.event_location}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <span className="w-5">📅</span>
                    <span>{new Date(booking.event_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-lg font-bold text-green-600">
                    ₦{booking.amount?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🎸</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                No Confirmed Gigs
              </h3>
              <p className="text-sm text-gray-500">
                Accept requests to see them here
              </p>
            </div>
          )
        )}

        {/* Past Gigs */}
        {activeTab === 'past' && (
          pastGigs.length > 0 ? (
            pastGigs.map(booking => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 opacity-75"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full mb-2">
                      Completed
                    </span>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {booking.events?.title || 'Past Gig'}
                    </h3>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <span className="w-5">👤</span>
                    <span>{booking.client?.first_name} {booking.client?.last_name}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <span className="w-5">📍</span>
                    <span className="truncate">{booking.event_location}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <span className="w-5">📅</span>
                    <span>{new Date(booking.event_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500">Earned</span>
                  <span className="text-lg font-bold text-gray-600">
                    ₦{booking.escrow_amount?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🎼</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                No Past Gigs
              </h3>
              <p className="text-sm text-gray-500">
                Your completed gigs will appear here
              </p>
            </div>
          )
        )}
      </div>

      {/* iOS Safe Area Bottom */}
      <div className="h-safe-bottom"></div>
    </div>
  );
}


