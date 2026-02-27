// src/app/musician/bookings/[bookingId]/page.js - ENHANCED
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import LiveTracking from '@/components/LiveTracking';
import Link from 'next/link';
import { CheckCircle, Clock, Wallet, DollarSign, AlertCircle } from 'lucide-react';
import { getCurrencyByCode, formatCurrency } from "@/components/CurrencySelector";


export default function BookingDetailsPage() {
  const { user } = useAuth();
  const { bookings, fetchBookings } = useData();
  const { bookingId } = useParams();
  const router = useRouter();
  
  const [booking, setBooking] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState(null);
  const [showTracking, setShowTracking] = useState(false);

  useEffect(() => {
    // First try to get from cache
    const cachedBooking = bookings.find(b => b.id === bookingId);
    
    if (cachedBooking) {
      setBooking(cachedBooking);
      setLoading(false);
      setShowTracking(
        cachedBooking.status === 'confirmed' && 
        new Date(cachedBooking.event_date) >= new Date()
      );
      // Fetch escrow if paid
      if (cachedBooking.payment_status === 'paid') {
        fetchEscrowDetails();
      }
    } else {
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
      setShowTracking(
        data.status === 'confirmed' && 
        new Date(data.event_date) >= new Date()
      );
      // Fetch escrow if paid
      if (data.payment_status === 'paid') {
        fetchEscrowDetails();
      }
    }
    setLoading(false);
  };

  const fetchEscrowDetails = async () => {
    const { data: escrowData } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (escrowData) {
      setEscrow(escrowData);
    }
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

      setBooking({ ...booking, status: 'confirmed' });
      setShowTracking(true);
      await fetchBookings(true);
      
      alert('Gig accepted successfully!');
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

      setBooking({ ...booking, status: 'declined' });
      await fetchBookings(true);
      
      alert('Gig declined.');
      router.push('/musician/bookings');
    } catch (err) {
      setError('Failed to decline gig: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!confirm('Mark this gig as complete? The client will have 24 hours to release funds before auto-release.')) return;

    setMarking(true);
    setError(null);

    try {
      const response = await fetch('/api/booking/mark-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          musicianId: user.id
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('✅ Gig marked as complete! Funds will be released within 24 hours.');
        await fetchBookingDetails();
        await fetchBookings(true);
      } else {
        throw new Error(result.error || 'Failed to mark complete');
      }
    } catch (err) {
      setError(err.message);
      alert('❌ ' + err.message);
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
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
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'declined': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const eventDate = new Date(booking.event_date);
  const isPastEvent = eventDate < new Date();
  const canMarkComplete = isPastEvent && 
                          booking.payment_status === 'paid' && 
                          booking.status !== 'completed' &&
                          booking.status !== 'declined';
  const isCompleted = booking.status === 'completed';
  const autoReleaseAt = booking.marked_complete_at 
    ? new Date(new Date(booking.marked_complete_at).getTime() + 24 * 60 * 60 * 1000)
    : null;
  const currencySymbol = escrow?.currency === 'NGN' ? '₦' : '$';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 sm:pb-6">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Gig Details
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-4xl mx-auto">
        {/* Booking Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                {booking.events?.title || 'Gig Details'}
              </h2>
              <p className="text-purple-100 text-sm">
                {booking.events?.description || 'Booking Information'}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-lg font-medium text-sm ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>
        </div>

        {/* Mark Complete Section */}
        {canMarkComplete && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                  Ready to Mark Complete?
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Event date has passed. Mark this gig as complete to start the payment release process. 
                  Funds will be auto-released in 24 hours if client doesn&apos;t act.
                </p>
                <button
                  onClick={handleMarkComplete}
                  disabled={marking}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {marking ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Marking Complete...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Mark Gig as Complete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Completion Status */}
        {isCompleted && escrow?.status === 'held' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  ⏰ Awaiting Payment Release
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Marked complete on {new Date(booking.marked_complete_at).toLocaleDateString()}
                </p>
                {autoReleaseAt && (
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Auto-release: {autoReleaseAt.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Funds Released Notice */}
        {booking.funds_released_at && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  🎉 Funds Released!
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Released on {new Date(booking.funds_released_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  💰 Available for withdrawal in your earnings
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Live Tracking Section */}
        {showTracking && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                📍 Share Your Location
              </h3>
              <Link
                href={`/tracking?bookingId=${booking.id}`}
                className="text-sm text-blue-600 font-medium"
              >
                Full Map →
              </Link>
            </div>
            
            <LiveTracking 
              bookingId={booking.id}
              eventLocation={{
                latitude: booking.event_latitude,
                longitude: booking.event_longitude,
              }}
            />
          </div>
        )}

        {/* Payment Info with Escrow Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Wallet className="w-5 h-5" /> Payment Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Offered Amount</span>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {/* {currencySymbol}{(booking?.amount || 0).toLocaleString()} */}
                {formatCurrency(booking?.amount || 0, booking?.currency || 'NGN')}

              </span>
            </div>
            
            {escrow ? (
              <>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Your Earnings (after fees)</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      {/* {currencySymbol}{escrow.net_amount?.toLocaleString()} */}
                     {formatCurrency(escrow?.net_amount || 0, escrow?.currency || 'NGN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Escrow Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      escrow.status === 'released' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                    }`}>
                      {escrow.status}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                You&apos;ll receive approximately <span className="font-semibold text-gray-900 dark:text-white">
                  {/* {currencySymbol}{((booking.amount || 0) * 0.825).toLocaleString()} */}
                                    {formatCurrency((booking.amount || 0) * 0.825, booking.currency || 'NGN')}
                  </span> after platform fee (10%) and VAT (7.5%)
              </p>
            )}
            
            {booking.payment_status && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Payment Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.payment_status === 'paid' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                }`}>
                  {booking.payment_status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <span>👤</span> Client Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {booking.client?.first_name} {booking.client?.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
              <a 
                href={`tel:${booking.client?.phone}`}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                {booking.client?.phone || 'Not provided'}
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <a 
                href={`mailto:${booking.client?.email}`}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                {booking.client?.email || 'Not provided'}
              </a>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <span>🎵</span> Event Details
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {booking.event_location}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {eventDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            {booking.event_duration && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {booking.event_duration} hours
                </p>
              </div>
            )}
            {booking.notes && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Additional Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {booking.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {booking.status === 'pending' && (
          <div className="space-y-3">
            <button
              onClick={handleAcceptGig}
              disabled={actionLoading}
              className="w-full min-h-[56px] bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 active:scale-98 transition-all shadow-lg disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : '✓ Accept Gig'}
            </button>
            <button
              onClick={handleDeclineGig}
              disabled={actionLoading}
              className="w-full min-h-[56px] bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-98 transition-all disabled:opacity-50"
            >
              ✗ Decline
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>

      {/* iOS Safe Area */}
      <div className="h-safe-bottom"></div>
    </div>
  );
}