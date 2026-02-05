// src/components/kyc/shared/ProgressBar.js
"use client";

import { CheckCircle } from 'lucide-react';

export default function ProgressBar({ currentStep, totalSteps, steps = [] }) {
  const percentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mb-8">
      {/* Progress percentage */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Verification Progress
        </span>
        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
        <div
          className="bg-gradient-to-r from-purple-600 to-purple-700 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step indicators */}
      {steps.length > 0 && (
        <div className="relative">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center flex-1 relative"
              >
                {/* Circle */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all z-10 ${
                  index <= currentStep
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg scale-110'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Label */}
                <span className={`text-xs sm:text-sm mt-2 text-center font-medium transition-colors ${
                  index <= currentStep
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step}
                </span>

                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute top-5 sm:top-6 left-1/2 w-full h-0.5 -z-0 transition-colors ${
                      index < currentStep
                        ? 'bg-purple-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    style={{ width: 'calc(100% - 2.5rem)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}