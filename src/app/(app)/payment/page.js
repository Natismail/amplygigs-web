// src/app/(app)/payment/page.js - UPDATED WITH WALLET SUPPORT
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Wallet, CreditCard, Building2, ArrowRight, Shield, Clock } from 'lucide-react';

export default function PaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'wallet' or 'direct'
  const [selectedProvider, setSelectedProvider] = useState('paystack');

  useEffect(() => {
    if (bookingId && user) {
      fetchBookingDetails();
      fetchWalletBalance();
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

  const fetchWalletBalance = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_client_wallet_balance', { p_client_id: user.id });

      if (!error && data && data.length > 0) {
        setWallet(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    }
  };

  const handleWalletPayment = async () => {
    if (!booking || !user) return;

    // Check sufficient balance
    if (wallet.balance < (booking?.amount || 0)) {
      setError('Insufficient wallet balance. Please add funds or pay directly.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/booking/pay-from-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user.id,
          bookingId: booking.id,
          amount: booking.amount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Show success and redirect
        alert('Payment successful! Your booking is confirmed.');
        router.push(`/client/bookings/${booking.id}`);
      } else {
        throw new Error(result.error || 'Wallet payment failed');
      }
    } catch (err) {
      setError(err.message);
      console.error('Wallet payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDirectPayment = async () => {
    if (!booking || !user) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: booking.amount,
          email: user.email,
          bookingId: booking.id,
          musicianId: booking.musician_id,
          clientId: user.id,
          countryCode: user.country_code || 'NG',
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

  const handlePayment = () => {
    if (paymentMethod === 'wallet') {
      handleWalletPayment();
    } else if (paymentMethod === 'direct') {
      handleDirectPayment();
    } else {
      setError('Please select a payment method');
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


  // ⭐ NEW: Check for valid booking amount
  if (!booking.amount || booking.amount === null || booking.amount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-2 text-red-600">Invalid Booking Amount</h2>
        <p className="text-gray-600 mb-4">This booking has no amount set.</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  // const platformFee = booking.amount * 0.10; // 10%
  // const vat = booking.amount * 0.075; // 7.5%
  // const totalFees = platformFee + vat;
  // const totalAmount = booking.amount;
  // const musicianReceives = booking.amount - totalFees;
  // const hasWallet = wallet && wallet.balance > 0;
  // const hasSufficientBalance = wallet && wallet.balance >= booking.amount;
  // const currencySymbol = wallet?.currency === 'NGN' ? '₦' : '$';



// ⭐ SAFE CALCULATIONS:
  const bookingAmount = booking.amount || 0; // ⭐ Safe fallback
  const platformFee = bookingAmount * 0.10; // 10%
  const vat = bookingAmount * 0.075; // 7.5%
  const totalFees = platformFee + vat;
  const totalAmount = bookingAmount;
  const musicianReceives = bookingAmount - totalFees;
  const hasWallet = wallet && wallet.balance > 0;
  //const hasSufficientBalance = wallet && wallet.balance >= bookingAmount; // 
  const hasSufficientBalance = wallet && wallet.balance >= (booking?.amount || 0); // ⭐ Use safe amount
  const currencySymbol = wallet?.currency === 'NGN' ? '₦' : '$';


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
            <p className="text-purple-100">Choose your payment method</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Booking Details */}
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
              </div>
            </div>

           {/* Payment Amount */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-lg text-gray-900 dark:text-white">
                  Total Amount
                </span>
                <span className="font-bold text-3xl text-blue-600 dark:text-blue-400">
                  {/* ⭐ SAFE: Uses fallback */}
                  {currencySymbol}{(booking?.amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Booking Amount:</span>
                  {/* ⭐ SAFE: Uses fallback */}
                  <span>{currencySymbol}{(booking?.amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee (10%):</span>
                  {/* ⭐ SAFE: platformFee already calculated safely */}
                  <span>-{currencySymbol}{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (7.5%):</span>
                  {/* ⭐ SAFE: vat already calculated safely */}
                  <span>-{currencySymbol}{vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-blue-200 dark:border-blue-700 font-medium">
                  <span>Musician Receives:</span>
                  {/* ⭐ SAFE: musicianReceives already calculated safely */}
                  <span className="text-green-600">{currencySymbol}{musicianReceives.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                Select Payment Method
              </h3>

              <div className="space-y-3">
                {/* AmplyGigs Wallet Payment Option - PRIORITIZED */}
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  disabled={!hasWallet || !hasSufficientBalance}
                  className={`w-full p-5 border-2 rounded-xl transition-all text-left ${
                    paymentMethod === 'wallet'
                      ? 'border-purple-600 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/20 shadow-lg'
                      : hasWallet && hasSufficientBalance
                      ? 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                      : 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        paymentMethod === 'wallet' 
                          ? 'bg-purple-600' 
                          : hasWallet && hasSufficientBalance 
                          ? 'bg-purple-100 dark:bg-purple-900/30' 
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Wallet className={`w-6 h-6 ${
                          paymentMethod === 'wallet' 
                            ? 'text-white' 
                            : hasWallet && hasSufficientBalance 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900 dark:text-white">
                            AmplyGigs Wallet
                          </p>
                          {hasWallet && hasSufficientBalance && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        {hasWallet ? (
                          <>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Balance: <span className="font-semibold text-gray-900 dark:text-white">{currencySymbol}{wallet.balance.toLocaleString()}</span>
                            </p>
                            {!hasSufficientBalance && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                <span>⚠️</span>
                                Insufficient balance •Need {currencySymbol}{((booking?.amount || 0) - wallet.balance).toLocaleString()} more

                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            No wallet found • Create one in settings
                          </p>
                        )}
                      </div>
                    </div>
                    {paymentMethod === 'wallet' && (
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-lg">✓</span>
                      </div>
                    )}
                  </div>
                  {hasWallet && hasSufficientBalance && (
                    <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700/50">
                      <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 font-medium">
                        <Clock className="w-4 h-4" />
                        <span>⚡ Instant payment • No extra fees • Secure escrow</span>
                      </div>
                    </div>
                  )}
                </button>

                {/* OR Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 font-medium">
                      OR PAY WITH
                    </span>
                  </div>
                </div>

                {/* Card/Bank Payment Option */}
                <button
                  onClick={() => setPaymentMethod('direct')}
                  className={`w-full p-5 border-2 rounded-xl transition-all text-left ${
                    paymentMethod === 'direct'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        paymentMethod === 'direct' ? 'bg-purple-600' : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <CreditCard className={`w-6 h-6 ${
                          paymentMethod === 'direct' ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white mb-1">
                          Card / Bank Transfer
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Debit card, Bank transfer, USSD
                        </p>
                      </div>
                    </div>
                    {paymentMethod === 'direct' && (
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-lg">✓</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Provider Selection (if direct payment) */}
                {paymentMethod === 'direct' && (
                  <div className="ml-14 space-y-3 animate-fadeIn">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Choose payment provider:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedProvider('paystack')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          selectedProvider === 'paystack'
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">💳</div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">Paystack</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Card • Bank • USSD</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setSelectedProvider('stripe')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          selectedProvider === 'stripe'
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">🌍</div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">Stripe</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">International</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Add Funds Link (if insufficient balance) */}
            {hasWallet && !hasSufficientBalance && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Wallet className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                      Need more funds?
                    </p>
                    <button
                      onClick={() => router.push('/client/settings?tab=wallet')}
                      className="text-sm text-yellow-700 dark:text-yellow-300 underline hover:no-underline"
                    >
                      Add funds to your wallet →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1 text-sm">
                    Secure Escrow Protection
                  </h4>
                  <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                    <li>• Funds held securely until gig completion</li>
                    <li>• Full refund if musician cancels</li>
                    <li>• Release funds after successful event</li>
                    <li>• Auto-release after 24 hours of completion</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={processing || !paymentMethod}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : paymentMethod === 'wallet' ? (
                <>
                  Pay {currencySymbol}{totalAmount.toLocaleString()} from Wallet
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : paymentMethod === 'direct' ? (
                <>
                  Pay {currencySymbol}{totalAmount.toLocaleString()} with {selectedProvider === 'paystack' ? 'Paystack' : 'Stripe'}
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                'Select Payment Method'
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