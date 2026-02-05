// src/app/payment/verify/page.js - UPDATED WITH WALLET SUPPORT
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function PaymentVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const bookingId = searchParams.get('booking_id');
  const txRef = searchParams.get('tx_ref');
  const provider = searchParams.get('provider');
  const reference = searchParams.get('reference'); // Paystack reference
  const transactionId = searchParams.get('transaction_id'); // Flutterwave transaction_id
  const paymentType = searchParams.get('type'); // 'wallet' or 'direct'

  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const [message, setMessage] = useState('Verifying your payment...');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    // Handle wallet payments (instant, no verification needed)
    if (paymentType === 'wallet') {
      setStatus('success');
      setMessage('Wallet payment successful!');
      setTimeout(() => {
        router.push(`/client/bookings/${bookingId}`);
      }, 2000);
      return;
    }

    // Handle direct payments (requires verification)
    if (txRef && bookingId && provider) {
      verifyPayment();
    } else {
      setStatus('failed');
      setMessage('Invalid payment verification parameters');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txRef, bookingId, provider, paymentType]);

  const verifyPayment = async () => {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txRef,
          bookingId,
          provider,
          reference: provider === 'paystack' ? reference : transactionId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage('Payment verified successfully!');
        setDetails(result.details);
        
        // Redirect to booking page after 3 seconds
        setTimeout(() => {
          router.push(`/client/bookings/${bookingId}`);
        }, 3000);
      } else {
        setStatus('failed');
        setMessage(result.error || 'Payment verification failed');
      }
    } catch (error) {
      setStatus('failed');
      setMessage('An error occurred during verification');
      console.error('Verification error:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-purple-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              Verifying Payment
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we confirm your payment...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-7xl mb-6 animate-bounce">✅</div>
            <h2 className="text-3xl font-bold mb-2 text-green-600 dark:text-green-400">
              Payment Successful!
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {message}
            </p>
            
            {/* Wallet Payment Success */}
            {paymentType === 'wallet' && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-purple-900 dark:text-purple-100 mb-2">
                  <span className="text-2xl">💰</span>
                  <h3 className="font-semibold">Paid from AmplyGigs Wallet</h3>
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Your booking is confirmed! Funds are held securely in escrow.
                </p>
              </div>
            )}

            {/* Direct Payment Success */}
            {details && paymentType !== 'wallet' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                  Payment Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">Amount Paid</span>
                    <span className="font-semibold text-green-900 dark:text-green-100">
                      ₦{details.amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">Transaction Ref</span>
                    <span className="font-mono text-xs text-green-900 dark:text-green-100">
                      {details.reference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">Provider</span>
                    <span className="font-semibold text-green-900 dark:text-green-100 capitalize">
                      {provider}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Escrow Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2 text-xs text-blue-800 dark:text-blue-200">
                <span className="text-lg">🔒</span>
                <div className="text-left">
                  <p className="font-medium mb-1">Funds Protected in Escrow</p>
                  <p>Payment held securely until gig completion. Release funds after the event or they auto-release in 24 hours.</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to your booking...
            </p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="text-7xl mb-6">❌</div>
            <h2 className="text-3xl font-bold mb-2 text-red-600 dark:text-red-400">
              Payment Failed
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {message}
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                💡 <strong>Tip:</strong> Try paying from your AmplyGigs Wallet for instant confirmation!
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push(`/payment?bookingId=${bookingId}`)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/client/bookings')}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Back to Bookings
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}