// src/app/client/bookings/[id]/page.js - UPDATED WITH RELEASE FUNDS
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import LiveMap from '@/components/LiveMap';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Wallet, CreditCard } from 'lucide-react';
import { getCurrencyByCode, formatCurrency } from "@/components/CurrencySelector";


export default function ClientBookingDetailPage() {
  const { user } = useAuth();
  const { bookings, fetchBookings } = useData();
  const { id } = useParams();
  const router = useRouter();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTracking, setShowTracking] = useState(false);
  const [releasingFunds, setReleasingFunds] = useState(false);

  useEffect(() => {
    const cachedBooking = bookings.find(b => b.id === id);
    
    if (cachedBooking) {
      setBooking(cachedBooking);
      setLoading(false);
      setShowTracking(
        cachedBooking.status === 'confirmed' && 
        new Date(cachedBooking.event_date) >= new Date()
      );
    } else {
      fetchBookingDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, bookings]);

  const fetchBookingDetails = async () => {
    if (!user || !id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        client:client_id(first_name, last_name, phone, email),
        musician:musician_id(first_name, last_name, phone, email),
        events:event_id(title, description)
      `)
      .eq('id', id)
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
    }
    setLoading(false);
  };

  const handleReleaseFunds = async () => {
    if (!confirm('Release funds to musician? This action cannot be undone.')) return;
    
    setReleasingFunds(true);
    setError(null);

    try {
      const response = await fetch('/api/release-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('✅ Funds released successfully! The musician will receive payment shortly.');
        await fetchBookingDetails();
        await fetchBookings(true);
      } else {
        throw new Error(result.error || 'Failed to release funds');
      }
    } catch (err) {
      setError(err.message);
      alert('❌ ' + err.message);
    } finally {
      setReleasingFunds(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking? If payment was made, it will be refunded to your wallet.')) return;
    
    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/booking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: id,
          userId: user.id,
          role: 'CLIENT',
          reason: 'Client requested cancellation',
          category: 'client_request'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Booking cancelled successfully. Refund has been processed to your wallet.');
        router.push('/client/bookings');
      } else {
        throw new Error(result.error || 'Failed to cancel booking');
      }
    } catch (err) {
      setError('Failed to cancel booking: ' + err.message);
    } finally {
      setActionLoading(false);
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
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'released': return 'bg-blue-100 text-blue-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const canReleaseFunds = booking.status === 'completed' && 
                          booking.payment_status === 'paid' &&
                          !booking.funds_released_at;

  const eventDate = new Date(booking.event_date);
  const isPastEvent = eventDate < new Date();

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
              Booking Details
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
                {booking.events?.title || 'Event Booking'}
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

        {/* Release Funds Notice */}
        {canReleaseFunds && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                  Ready to Release Funds?
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  The gig is complete! Release the funds to the musician now, or they will be auto-released after 24 hours.
                </p>
                <button
                  onClick={handleReleaseFunds}
                  disabled={releasingFunds}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {releasingFunds ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Releasing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Release Funds to Musician
                    </>
                  )}
                </button>
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
                  Funds Released
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Released on {new Date(booking.funds_released_at).toLocaleDateString()}
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
                📍 Live Location Tracking
              </h3>
              <Link
                href={`/tracking?bookingId=${booking.id}`}
                className="text-sm text-blue-600 font-medium"
              >
                Full Map →
              </Link>
            </div>
            
            <LiveMap 
              musicianId={booking.musician_id}
              eventLocation={{
                latitude: booking.event_latitude,
                longitude: booking.event_longitude,
              }}
            />

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">
                📱 How it works
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Track the musician&apos;s live location in real-time</li>
                <li>• Get notified when they&apos;re on the way</li>
                <li>• See ETA and distance to venue</li>
                <li>• Automatic arrival notification</li>
              </ul>
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Wallet className="w-5 h-5" /> Payment Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Booking Amount</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {/* ₦{booking.amount?.toLocaleString() || 0} */}
                {formatCurrency(booking.amount || 0, booking.currency || 'NGN')}
                
              </span>
            </div>
            {booking.payment_status && (
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Payment Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                  {booking.payment_status}
                </span>
              </div>
            )}
            {booking.escrow_amount && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">In Escrow</span>
                <span className="text-sm font-medium text-yellow-600">
                  {/* ₦{booking.escrow_amount.toLocaleString()} */}
                  {formatCurrency(escrow.amount || 0, escrow.currency || 'NGN')}
                  </span>
              </div>
            )}
          </div>
        </div>

        {/* Musician Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <span>🎵</span> Musician Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {booking.musician?.first_name} {booking.musician?.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
              <a 
                href={`tel:${booking.musician?.phone}`}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                {booking.musician?.phone || 'Not provided'}
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <a 
                href={`mailto:${booking.musician?.email}`}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                {booking.musician?.email || 'Not provided'}
              </a>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <span>📅</span> Event Details
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
              onClick={() => router.push(`/payment?bookingId=${booking.id}`)}
              className="w-full min-h-[56px] bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Complete Payment
            </button>
            <button
              onClick={handleCancelBooking}
              disabled={actionLoading}
              className="w-full min-h-[56px] bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  Cancel Booking
                </>
              )}
            </button>
          </div>
        )}


        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}