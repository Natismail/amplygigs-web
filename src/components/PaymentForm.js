// src/components/PaymentForm.js
// UPDATED WITH LOCATION-BASED PROVIDER ROUTING

"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PLATFORM_FEE_PERCENTAGE = 5;
const VAT_PERCENTAGE = 7.5;

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

export default function PaymentForm({ booking, onPaymentSuccess }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentProvider, setPaymentProvider] = useState(null);
  const [countryCode, setCountryCode] = useState(null);
  const [currency, setCurrency] = useState('NGN');
  const [clientSecret, setClientSecret] = useState(null);
  
  const gigFee = booking.amount || 0;
  const platformFee = gigFee * (PLATFORM_FEE_PERCENTAGE / 100);
  const vatAmount = gigFee * (VAT_PERCENTAGE / 100);
  const totalDeductions = platformFee + vatAmount;
  const musicianReceives = gigFee - totalDeductions;

  // Detect user's location and set provider
  useEffect(() => {
    async function detectLocation() {
      try {
        // Get user's country from profile
        const userCountry = user?.country_code || await getUserCountry();
        setCountryCode(userCountry);
        
        // Determine provider and currency based on country
        if (userCountry === 'NG') {
          setPaymentProvider('paystack');
          setCurrency('NGN');
        } else {
          setPaymentProvider('stripe');
          setCurrency(getCurrencyForCountry(userCountry));
        }
      } catch (err) {
        console.error('Location detection error:', err);
        // Default to Paystack for Nigeria
        setPaymentProvider('paystack');
        setCountryCode('NG');
        setCurrency('NGN');
      }
    }

    detectLocation();
  }, [user]);

  async function getUserCountry() {
    try {
      // Try to get from IP geolocation API
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return data.country_code || 'NG';
    } catch {
      return 'NG'; // Default to Nigeria
    }
  }

  function getCurrencyForCountry(country) {
    const currencyMap = {
      'NG': 'NGN',
      'US': 'USD',
      'GB': 'GBP',
      'CA': 'CAD',
      'GH': 'GHS',
      'KE': 'KES',
      'ZA': 'ZAR'
    };
    return currencyMap[country] || 'USD';
  }

  const handlePayment = async () => {
    if (!paymentProvider) {
      setError('Payment provider not determined');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: gigFee,
          email: user.email,
          bookingId: booking.id,
          musicianId: booking.musician_id,
          countryCode: countryCode
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment initiation failed');
      }

      if (result.success) {
        if (paymentProvider === 'paystack') {
          // Redirect to Paystack payment page
          window.location.href = result.paymentLink;
        } else if (paymentProvider === 'stripe') {
          // Set client secret for Stripe Elements
          setClientSecret(result.clientSecret);
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while detecting location
  if (!paymentProvider) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Detecting your location...</p>
        </div>
      </div>
    );
  }

  // If Stripe and we have client secret, show Stripe Elements
  if (paymentProvider === 'stripe' && clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <StripeCheckoutForm 
          booking={booking}
          clientSecret={clientSecret}
          gigFee={gigFee}
          platformFee={platformFee}
          vatAmount={vatAmount}
          musicianReceives={musicianReceives}
          currency={currency}
        />
      </Elements>
    );
  }

  const currencySymbol = currency === 'NGN' ? '₦' : '$';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-purple-700 safe-top">
        <div className="px-4 py-6 text-white">
          <button
            onClick={() => router.back()}
            className="mb-3 text-white hover:text-purple-100 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold mb-1">Confirm Payment</h1>
          <p className="text-purple-100 text-sm">
            Secure {paymentProvider === 'stripe' ? 'Stripe' : 'Paystack'} payment • {currency}
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Booking Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Booking Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Event</span>
              <span className="font-medium text-gray-900 dark:text-white text-right">
                {booking.event_name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Musician</span>
              <span className="font-medium text-gray-900 dark:text-white text-right">
                {booking.musician_name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Date</span>
              <span className="font-medium text-gray-900 dark:text-white text-right">
                {booking.event_date ? new Date(booking.event_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 border-2 border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>💰</span> Payment Breakdown
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-base">
              <span className="text-gray-700 dark:text-gray-300">Gig Fee</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {currencySymbol}{gigFee.toLocaleString()}
              </span>
            </div>

            {/* Platform Fee Card */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">ℹ️</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Platform Service Fee ({PLATFORM_FEE_PERCENTAGE}%)
                  </p>
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    Helps maintain secure payments & support
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-yellow-200 dark:border-yellow-700">
                <span className="text-xs text-yellow-700 dark:text-yellow-300">Fee Amount</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                  -{currencySymbol}{platformFee.toLocaleString()}
                </span>
              </div>
            </div>

            {/* VAT */}
            {vatAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">VAT ({VAT_PERCENTAGE}%)</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  -{currencySymbol}{vatAmount.toLocaleString()}
                </span>
              </div>
            )}

            <div className="pt-3 border-t-2 border-blue-300 dark:border-blue-600">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-900 dark:text-white">You Pay</span>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {currencySymbol}{gigFee.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Musician receives</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {currencySymbol}{musicianReceives.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Provider Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {paymentProvider === 'stripe' ? (
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Stripe</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">International payments</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">P</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Paystack</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nigerian payments</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Escrow Notice */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
          <div className="flex gap-3">
            <span className="text-2xl">🔒</span>
            <div className="flex-1">
              <h4 className="font-bold text-green-900 dark:text-green-100 mb-2">
                Secure Escrow Protection
              </h4>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• Funds held safely in company account</li>
                <li>• Released to musician after event completion</li>
                <li>• Full refund if musician cancels</li>
                <li>• Auto-release after 24 hours if not manually released</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
            <div className="flex gap-2">
              <span className="text-red-600 dark:text-red-400">⚠️</span>
              <p className="text-sm text-red-800 dark:text-red-200 flex-1">{error}</p>
            </div>
          </div>
        )}

        {/* Payment Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-bottom z-10">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full min-h-[56px] bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Processing...
              </span>
            ) : (
              <span>Pay {currencySymbol}{gigFee.toLocaleString()}</span>
            )}
          </button>
          
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center justify-center gap-1">
            <span>🔐</span> Powered by {paymentProvider === 'stripe' ? 'Stripe' : 'Paystack'} • 256-bit Encrypted
          </p>
        </div>
      </div>

      <div className="h-32"></div>
    </div>
  );
}

// Stripe Checkout Form Component
function StripeCheckoutForm({ booking, clientSecret, gigFee, platformFee, vatAmount, musicianReceives, currency }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/verify?booking_id=${booking.id}&provider=stripe`,
      },
    });

    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
    }
  };

  const currencySymbol = currency === 'NGN' ? '₦' : '$';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Payment Details</h2>
            <PaymentElement />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || processing}
            className="w-full min-h-[56px] bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Processing...
              </span>
            ) : (
              <span>Pay {currencySymbol}{gigFee.toLocaleString()}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}