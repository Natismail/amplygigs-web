// src/components/kyc/steps/RightToWork.js
"use client";

import { ExternalLink, CheckCircle2, Info } from 'lucide-react';

export default function RightToWork({ 
  shareCode, 
  onShareCodeChange,
  dateOfBirth,
  onDateOfBirthChange,
  error 
}) {
  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              UK Right to Work Verification
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              You need to get a share code from the UK Home Office to prove your right to work in the UK.
            </p>
            <a
              href="https://www.gov.uk/prove-right-to-work"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 underline"
            >
              Get your share code from gov.uk
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Share Code Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Share Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={shareCode}
          onChange={(e) => onShareCodeChange(e.target.value.toUpperCase())}
          placeholder="ABC123XYZ"
          maxLength={9}
          className={`w-full p-3.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase font-mono text-center text-lg tracking-wider ${
            error 
              ? 'border-red-500' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          Enter the 9-character share code (e.g., ABC123XYZ)
        </p>
      </div>

      {/* Date of Birth */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Date of Birth <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => onDateOfBirthChange(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          This must match the date of birth on your ID document
        </p>
      </div>

      {/* How to get share code */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          How to Get Your Share Code
        </h4>
        <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>
              Visit <a href="https://www.gov.uk/prove-right-to-work" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">gov.uk/prove-right-to-work</a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>Sign in to your UK Visas and Immigration account</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>Generate a new share code (valid for 90 days)</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              4
            </span>
            <span>Copy the 9-character code and paste it above</span>
          </li>
        </ol>
      </div>

      {/* Verification Notice */}
      <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-green-800 dark:text-green-200">
          We will verify your right to work with the UK Home Office using this share code. 
          Your data will be handled securely and in accordance with GDPR.
        </p>
      </div>
    </div>
  );
}