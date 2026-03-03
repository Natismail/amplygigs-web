// src/components/payments/PlatformFeePaymentForm.jsx
// CHANGES:
// - Removed hardcoded ₦ symbol → uses formatCurrency from CurrencySelector
// - VAT (7.5%) implementation COMMENTED OUT — re-enable when full employment flow is live
// - Only platform fee (10%) applied for now (contract role context)
// - Payment button correctly uses router.push (was broken: router.push = result.paymentLink)

"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation";
import { formatCurrency, getCurrencyByCode } from '@/components/CurrencySelector';

// ── Fee configuration ─────────────────────────────────────────────────────
const PLATFORM_FEE_PERCENTAGE = 10; // 10% platform service fee

// VAT DISABLED — uncomment when full employment/permanent roles are introduced
// const VAT_PERCENTAGE = 7.5; // 7.5% VAT (Nigeria)
// const APPLY_VAT = false; // Toggle when ready

export default function PlatformFeePaymentForm({ booking, onPaymentSuccess }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentProvider, setPaymentProvider] = useState('paystack');

  // Currency from booking, fallback to NGN
  const currency = booking.currency || 'NGN';
  const currencyInfo = getCurrencyByCode(currency);
  const fmt = (amount) => formatCurrency(amount, currency);

  const gigFee = booking.amount || 0;
  const platformFee = Math.round(gigFee * (PLATFORM_FEE_PERCENTAGE / 100));

  // VAT DISABLED — when re-enabled:
  // const vatAmount = APPLY_VAT ? Math.round(gigFee * (VAT_PERCENTAGE / 100)) : 0;
  // const totalAmount = gigFee + vatAmount; // client pays gig fee + VAT
  const vatAmount = 0; // disabled
  const totalAmount = gigFee; // client pays gig fee only (no VAT for now)

  const musicianReceives = gigFee - platformFee; // platform takes 10% from musician payout

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
          currency: currency,
          paymentProvider: paymentProvider,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // FIX: was `router.push = result.paymentLink` (assignment not navigation)
        router.push(result.paymentLink);
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
          <h2 className="text-2xl font-bold mb-1">Confirm Payment</h2>
          <p className="text-purple-100 text-sm">Secure escrow payment • {currencyInfo.flag} {currency}</p>
        </div>

        <div className="p-6 space-y-6">

          {/* Booking Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Booking Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Event</span>
                <span className="font-medium text-gray-900 dark:text-white">{booking.event_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Musician</span>
                <span className="font-medium text-gray-900 dark:text-white">{booking.musician_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Date</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {booking.event_date ? new Date(booking.event_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Currency</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {currencyInfo.flag} {currency} ({currencyInfo.name})
                </span>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              💰 Payment Breakdown
            </h3>

            <div className="space-y-2 text-sm">
              {/* Gig fee */}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Gig Fee</span>
                <span className="font-medium text-gray-900 dark:text-white">{fmt(gigFee)}</span>
              </div>

              {/* VAT — DISABLED, shown as note */}
              {/* 
              VAT (7.5%) — COMMENTED OUT
              Re-enable when permanent/employment roles are introduced.
              
              {APPLY_VAT && (
                <div className="flex justify-between text-orange-600">
                  <span>VAT (7.5%)</span>
                  <span>+{fmt(vatAmount)}</span>
                </div>
              )}
              */}

              {/* Platform fee notice */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 my-2">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 text-sm flex-shrink-0">ℹ️</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                      Platform Service Fee ({PLATFORM_FEE_PERCENTAGE}%)
                    </p>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      This fee covers secure payments, platform maintenance, and support for musicians and clients.
                      Deducted from the musician's payout — not added to your total.
                    </p>
                    <div className="flex justify-between mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-700">
                      <span className="text-xs text-yellow-700 dark:text-yellow-300">Deducted from musician:</span>
                      <span className="text-xs font-semibold text-red-600">−{fmt(platformFee)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">You Pay</span>
                  <span className="font-bold text-2xl text-purple-600 dark:text-purple-400">
                    {fmt(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Musician receives */}
              <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Musician receives</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{fmt(musicianReceives)}</span>
              </div>
            </div>
          </div>

          {/* Payment Provider */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'paystack', label: 'Paystack', note: 'Recommended for NGN/GHS/KES/ZAR' },
                { id: 'flutterwave', label: 'Flutterwave', note: 'Multi-currency alternative' },
              ].map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setPaymentProvider(provider.id)}
                  className={`p-4 border-2 rounded-xl text-left transition ${
                    paymentProvider === provider.id
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">{provider.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{provider.note}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Escrow notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex gap-3">
              <span className="text-2xl flex-shrink-0">🔒</span>
              <div>
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Secure Escrow Payment</h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your payment is held securely until the gig is completed. The musician receives{' '}
                  <strong>{fmt(musicianReceives)}</strong> in their ledger. Funds move to their available balance
                  only after you confirm the service is complete.
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex gap-2">
              <span className="text-red-600 flex-shrink-0">⚠️</span>
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Pay button */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                💳 Pay {fmt(totalAmount)} via {paymentProvider === 'paystack' ? 'Paystack' : 'Flutterwave'}
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
            🔐 256-bit SSL Encryption • PCI DSS Compliant • Your data is safe
          </p>
        </div>
      </div>
    </div>
  );
}