// src/app/(app)/wallet/verify/page.js
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function WalletVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'failed'
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    verifyDeposit();
  }, []);

  const verifyDeposit = async () => {
    const txRef = searchParams.get('tx_ref');
    const provider = searchParams.get('provider') || 'paystack';

    if (!txRef) {
      setStatus('failed');
      setMessage('Invalid payment reference');
      return;
    }

    try {
      // Wait a bit for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch('/api/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txRef, provider }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('success');
        setMessage(result.message || 'Wallet funded successfully!');
        
        // Redirect to wallet after 3 seconds
        setTimeout(() => {
          router.push('/client/wallet');
        }, 3000);
      } else {
        setStatus('failed');
        setMessage(result.error || 'Payment verification failed');
      }
    } catch (error) {
      setStatus('failed');
      setMessage('Failed to verify payment. Please contact support.');
      console.error('Verification error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                <Loader className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verifying Payment
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we confirm your deposit...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Payment Successful! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Redirecting to your wallet...
                </p>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Payment Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <button
                onClick={() => router.push('/client/wallet')}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
              >
                Return to Wallet
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}