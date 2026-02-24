// src/components/LoadingSpinner.js - ENHANCED VERSION
"use client";

import { Loader } from "lucide-react";

export default function LoadingSpinner({ 
  size = "md", 
  fullScreen = false, 
  message = "Loading..." 
}) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const Spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader className={`${sizes[size]} animate-spin text-purple-600 dark:text-purple-400`} />
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50">
        {Spinner}
      </div>
    );
  }

  return Spinner;
}

// Logo-based Loading Spinner (Matches your brand!)
export function LogoSpinner({ size = "md", message = "" }) {
  const sizes = {
    sm: { icon: "w-12 h-12", text: "text-sm" },
    md: { icon: "w-16 h-16", text: "text-base" },
    lg: { icon: "w-24 h-24", text: "text-lg" },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Animated Logo */}
      <div className="relative">
        {/* Pulsing Ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${currentSize.icon} bg-purple-200 dark:bg-purple-900/30 rounded-full animate-ping opacity-20`}></div>
        </div>
        
        {/* Rotating Logo */}
        <div className="relative animate-spin-slow">
          <svg
            className={currentSize.icon}
            viewBox="0 0 120 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Chat Bubble */}
            <path
              d="M18 30C18 22 25 15 33 15H87C95 15 102 22 102 30V72C102 80 95 87 87 87H62L90 104V87H33C25 87 18 80 18 72V30Z"
              fill="url(#purpleGradient)"
            />
            
            {/* Guitar Headstock */}
            <g fill="white" transform="rotate(59 60 50)">
              <rect x="50" y="15" width="35" height="50" rx="8" />
              <circle cx="45" cy="29" r="4" />
              <circle cx="90" cy="29" r="4" />
              <circle cx="45" cy="41" r="4" />
              <circle cx="90" cy="41" r="4" />
              <circle cx="45" cy="53" r="4" />
              <circle cx="90" cy="53" r="4" />
              <rect x="58" y="60" width="20" height="40" rx="3" />
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

      {message && (
        <p className={`${currentSize.text} font-medium text-gray-600 dark:text-gray-400`}>
          {message}
        </p>
      )}

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

// Full Screen Logo Loading
export function FullScreenLoading({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 flex items-center justify-center z-50">
      <LogoSpinner size="lg" message={message} />
    </div>
  );
}

// Skeleton loaders with dark mode support
export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6 border border-gray-200 dark:border-gray-700" />
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg animate-pulse border border-gray-200 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton for Musician Cards
export function SkeletonMusicianCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg animate-pulse border border-gray-200 dark:border-gray-700">
      <div className="h-48 bg-gray-200 dark:bg-gray-700" />
      <div className="p-6 space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mt-4" />
      </div>
    </div>
  );
}

// Skeleton for Event Cards
export function SkeletonEventCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg animate-pulse border border-gray-200 dark:border-gray-700">
      <div className="h-48 bg-gray-200 dark:bg-gray-700" />
      <div className="p-6 space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mt-4" />
      </div>
    </div>
  );
}

// Progress Bar Loading
export function ProgressBar({ progress = 0, message = "" }) {
  return (
    <div className="w-full">
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{message}</p>
      )}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

// Pulse Dots Loading (like typing indicator)
export function PulseDots({ size = "sm" }) {
  const dotSizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const currentSize = dotSizes[size] || dotSizes.sm;

  return (
    <div className="flex gap-1.5">
      <div className={`${currentSize} bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse`} style={{ animationDelay: '0s' }} />
      <div className={`${currentSize} bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }} />
      <div className={`${currentSize} bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }} />
    </div>
  );
}