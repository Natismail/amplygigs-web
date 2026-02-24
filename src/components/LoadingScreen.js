// src/components/LoadingScreen.jsx
"use client";

import { useEffect, useState } from 'react';

export default function LoadingScreen({ message = "Loading..." }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          {/* Pulsing Background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-purple-200 dark:bg-purple-900/30 rounded-full animate-ping opacity-20"></div>
          </div>
          
          {/* Logo with Rotation Animation */}
          <div className="relative animate-bounce-slow">
            <svg
              className="w-24 h-24 mx-auto"
              viewBox="0 0 120 120"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Chat Bubble */}
              <path
                d="M18 30C18 22 25 15 33 15H87C95 15 102 22 102 30V72C102 80 95 87 87 87H62L90 104V87H33C25 87 18 80 18 72V30Z"
                fill="url(#purpleGradient)"
              />
              
              {/* Guitar Headstock */}
              <g fill="white" transform="rotate(58 60 50)">
                <rect x="50" y="15" width="35" height="50" rx="8" />
                <circle cx="45" cy="30" r="4" />
                <circle cx="90" cy="30" r="4" />
                <circle cx="45" cy="43" r="4" />
                <circle cx="90" cy="43" r="4" />
                <circle cx="45" cy="55" r="4" />
                <circle cx="90" cy="55" r="4" />
                <rect x="58" y="63" width="20" height="40" rx="2" />
              </g>
              
              {/* Gradient */}
              <defs>
                <linearGradient
                  id="purpleGradient"
                  x1="0"
                  y1="0"
                  x2="120"
                  y2="120"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#9333EA" />
                  <stop offset="100%" stopColor="#6B21A8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            AmplyGigs
          </span>
        </h1>

        {/* Loading Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}{dots}
        </p>

        {/* Progress Bar */}
        <div className="max-w-xs mx-auto">
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 animate-progress"></div>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-6">
          Connecting musicians with opportunities
        </p>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Loading Spinner (for inline use)
export function LoadingSpinner({ size = 'md', message = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin`}></div>
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
}

// Skeleton Loader
export function SkeletonLoader({ className = '' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  );
}