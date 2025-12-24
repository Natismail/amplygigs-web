// src/components/LoadingSpinner.js
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
      <Loader className={`${sizes[size]} animate-spin text-purple-600`} />
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

// Skeleton loaders for different components
export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
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
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6" />
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg animate-pulse">
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