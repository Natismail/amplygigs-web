//src/components/payments/PlatformFeePaymentForm.jsx

"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation";

const PLATFORM_FEE_PERCENTAGE = 5; // 5%

export default function PlatformFeePaymentForm({ booking, onPaymentSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentProvider, setPaymentProvider] = useState('paystack');
  
  const gigFee = booking.amount || 0;
  const platformFee = gigFee * (PLATFORM_FEE_PERCENTAGE / 100);
  const totalAmount = gigFee; // Client pays gig fee only
  const musicianReceives = gigFee - platformFee;

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pay-paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          email: user.email,
          bookingId: booking.id,
          musicianId: booking.musician_id,
          paymentProvider: paymentProvider
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        router.push = result.paymentLink;
      } else {
        setError(result.error || 'Payment initiation failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Confirm Payment</h2>
          <p className="text-purple-100 text-sm">Secure escrow payment</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Booking Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Booking Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Event:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {booking.event_name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Musician:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {booking.musician_name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Date:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {booking.event_date ? new Date(booking.event_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>💰</span> Payment Breakdown
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Gig Fee:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ₦{gigFee.toLocaleString()}
                </span>
              </div>
              
              {/* Platform Fee Notice */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3 my-2">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 text-sm">ℹ️</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                      Platform Service Fee ({PLATFORM_FEE_PERCENTAGE}%)
                    </p>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      This fee helps us maintain the platform, provide secure payments, and support both musicians and clients.
                    </p>
                    <div className="flex justify-between mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-700">
                      <span className="text-xs text-yellow-700 dark:text-yellow-300">Fee Amount:</span>
                      <span className="text-xs font-semibold text-red-600">-₦{platformFee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Total to Pay:
                  </span>
                  <span className="font-bold text-xl text-purple-600">
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-sm pt-2 bg-green-50 dark:bg-green-900/20 rounded p-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Musician Receives (after fee):
                </span>
                <span className="font-medium text-green-600">
                  ₦{musicianReceives.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentProvider('paystack')}
                className={`p-4 border-2 rounded-lg text-center transition ${
                  paymentProvider === 'paystack'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white">Paystack</div>
                <div className="text-xs text-gray-500 mt-1">Recommended</div>
              </button>
              <button
                onClick={() => setPaymentProvider('flutterwave')}
                className={`p-4 border-2 rounded-lg text-center transition ${
                  paymentProvider === 'flutterwave'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white">Flutterwave</div>
                <div className="text-xs text-gray-500 mt-1">Alternative</div>
              </button>
            </div>
          </div>

          {/* Escrow Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-2xl">🔒</span>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Secure Escrow Payment
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your payment is held securely. The musician receives ₦{musicianReceives.toLocaleString()} in their <strong>ledger</strong> (after ₦{platformFee.toLocaleString()} platform fee). Funds move to <strong>available balance</strong> only after you confirm the service is complete.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-2">
                <span className="text-red-600">⚠️</span>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>💳</span>
                Pay ₦{totalAmount.toLocaleString()} via {paymentProvider === 'paystack' ? 'Paystack' : 'Flutterwave'}
              </span>
            )}
          </button>

          {/* Security Notice */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
              <span>🔐</span>
              256-bit SSL Encryption • PCI DSS Compliant • Your data is safe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


