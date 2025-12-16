// src/components/ReleaseFundsButton.js

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ReleaseFundsButton({ booking, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const eventHasPassed = new Date(booking.event_date) < new Date();

  const handleReleaseFunds = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/release-funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          //clientId: user.id,      //not to send clientId:::
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        setShowConfirmModal(false);
        if (onSuccess) onSuccess(result.data);
      } else {
        setError(result.error || 'Failed to release funds');
      }
    } catch (err) {
      console.error('Release funds error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-green-900">Funds Released Successfully!</p>
            <p className="text-sm text-green-700">
              The musician can now withdraw their payment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirmModal(true)}
        disabled={loading || booking.funds_released_at}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
      >
        {booking.funds_released_at ? (
          <>
            <span>✓</span>
            Funds Already Released
          </>
        ) : (
          <>
            <span>💰</span>
            Release Payment to Musician
          </>
        )}
      </button>

{booking.payment_status === 'paid' && !booking.funds_released_at && (
  <p className="text-blue-600 mt-2">
    💰 Payment received — in escrow
  </p>
)}

{booking.funds_released_at && (
  <p className="text-green-600 mt-2">
    ✅ Funds released — available for withdrawal
  </p>
)}


      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Confirm Fund Release
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to release the payment? This action cannot be undone.
              </p>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Musician:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {booking.musician_name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Event:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {booking.event_name}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-600 pt-2">
                <span className="text-gray-600 dark:text-gray-400">Amount to Release:</span>
                <span className="font-bold text-lg text-green-600">
                  ₦{booking.escrow_amount?.toLocaleString() || '0'}
                </span>
              </div>
            </div>

            {/* Confirmation Checklist */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                Please confirm:
              </p>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>The event has been completed successfully</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>You are satisfied with the musician&apos;s performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>You want to release the funds from escrow</span>
                </li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setError(null);
                }}
                disabled={loading}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReleaseFunds}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Releasing...
                  </span>
                ) : (
                  'Confirm Release'
                )}
              </button>
            </div>

            {/* Info Note */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Once released, funds will move from the musician&apos;s ledger to their available balance
            </p>
          </div>
        </div>
      )}
    </>
  );
}