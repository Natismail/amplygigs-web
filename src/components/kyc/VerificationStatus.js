// src/components/kyc/VerificationStatus.js
"use client";

import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export default function VerificationStatus({ status, verification }) {
  const router = useRouter();

  const statusConfig = {
    verified: {
      icon: <CheckCircle2 className="w-16 h-16" />,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      title: 'Verification Complete!',
      message: 'Your profile is verified. You can now receive bookings and start earning.',
      buttonText: 'Go to Dashboard',
      buttonColor: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
    },
    pending: {
      icon: <Clock className="w-16 h-16 animate-pulse" />,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      title: 'Under Review',
      message: 'We\'re reviewing your documents. You\'ll be notified within 24-48 hours.',
      buttonText: 'Back to Dashboard',
      buttonColor: 'from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800'
    },
    rejected: {
      icon: <XCircle className="w-16 h-16" />,
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      title: 'Verification Rejected',
      message: verification?.rejection_reason || 'Your verification was rejected. Please review and resubmit with correct documents.',
      buttonText: 'Resubmit Documents',
      buttonColor: 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className={`w-24 h-24 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
          <div className={config.iconColor}>
            {config.icon}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {config.title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {config.message}
        </p>

        {/* Additional Info for Rejected */}
        {status === 'rejected' && verification?.rejection_reason && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4 text-left">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                  Rejection Reason
                </h4>
                <p className="text-sm text-red-800 dark:text-red-300">
                  {verification.rejection_reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Details */}
        {verification && (
          <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
              Verification Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ID Type:</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {verification.id_type?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Submitted:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(verification.submitted_at).toLocaleDateString()}
                </span>
              </div>
              {verification.reviewed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Reviewed:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(verification.reviewed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {verification.country && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Country:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {verification.country}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => {
            if (status === 'rejected') {
              window.location.reload();
            } else {
              router.push('/musician/dashboard');
            }
          }}
          className={`w-full bg-gradient-to-r ${config.buttonColor} text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl`}
        >
          {config.buttonText}
        </button>

        {/* Contact Support (for rejected) */}
        {status === 'rejected' && (
          <button
            onClick={() => router.push('/support')}
            className="w-full mt-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm font-medium"
          >
            Contact Support →
          </button>
        )}
      </div>
    </div>
  );
}