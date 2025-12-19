// src/app/(app)/payment/page.js
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function PaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('paystack');

  useEffect(() => {
    if (bookingId && user) {
      fetchBookingDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, user]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          musician:musician_id(first_name, last_name, email),
          events:event_id(title, description)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (err) {
      setError('Failed to load booking details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!booking || !user) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/pay-paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: booking.amount,
          email: user.email,
          bookingId: booking.id,
          musicianId: booking.musician_id,
          paymentProvider: selectedProvider,
        }),
      });

      const result = await response.json();

      if (result.success && result.paymentLink) {
        // Redirect to payment gateway
        window.location.href = result.paymentLink;
      } else {
        throw new Error(result.error || 'Payment initialization failed');
      }
    } catch (err) {
      setError(err.message);
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold mb-2">Booking Not Found</h2>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const platformFee = booking.amount * 0.05;
  const totalAmount = booking.amount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:underline flex items-center gap-2"
        >
          ← Back to Booking
        </button>

        {/* Payment Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
            <p className="text-purple-100">Secure payment for your booking</p>
          </div>

          {/* Booking Details */}
          <div className="p-6 space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                Booking Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Event</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {booking.events?.title || 'Event'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Musician</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {booking.musician?.first_name} {booking.musician?.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Date</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(booking.event_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Location</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {booking.event_location}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                Payment Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Booking Amount</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ₦{booking.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Platform Fee (5%)</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ₦{platformFee.toLocaleString()}
                  </span>
                </div>
                <div className="pt-3 border-t-2 border-blue-200 dark:border-blue-700 flex justify-between">
                  <span className="font-semibold text-lg text-gray-900 dark:text-white">
                    Total Amount
                  </span>
                  <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Provider Selection */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                Select Payment Method
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedProvider('paystack')}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    selectedProvider === 'paystack'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">💳</div>
                    <p className="font-semibold text-gray-900 dark:text-white">Paystack</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Card, Bank Transfer, USSD
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedProvider('flutterwave')}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    selectedProvider === 'flutterwave'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">🦋</div>
                    <p className="font-semibold text-gray-900 dark:text-white">Flutterwave</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Multiple payment options
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔒</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1 text-sm">
                    Secure Payment
                  </h4>
                  <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                    <li>• Funds held in escrow until gig completion</li>
                    <li>• Full refund if musician cancels</li>
                    <li>• Secure encrypted payment processing</li>
                    <li>• Release funds after gig completion</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </span>
              ) : (
                `Pay ₦${totalAmount.toLocaleString()} with ${selectedProvider === 'paystack' ? 'Paystack' : 'Flutterwave'}`
              )}
            </button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              By proceeding, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}