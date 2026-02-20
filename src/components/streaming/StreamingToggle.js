// src/components/streaming/StreamingToggle.js
"use client";

import { Music2, Briefcase } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function StreamingToggle() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if we're in streaming mode
  const isStreamingMode = pathname.includes('/streaming');

  const toggleMode = () => {
    if (isStreamingMode) {
      // Go back to main dashboard based on user role
      if (pathname.includes('/musician')) {
        router.push('/musician/dashboard');
      } else if (pathname.includes('/client')) {
        router.push('/client/home');
      } else if (pathname.includes('/admin')) {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } else {
      // Go to streaming mode
      router.push('/streaming');
    }
  };

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm">
      <button
        onClick={() => !isStreamingMode && toggleMode()}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
          !isStreamingMode 
            ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600 dark:text-purple-400' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        <Briefcase className="w-4 h-4" />
        <span className="text-sm">Gigs</span>
      </button>
      
      <button
        onClick={() => isStreamingMode || toggleMode()}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
          isStreamingMode 
            ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600 dark:text-purple-400' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        <Music2 className="w-4 h-4" />
        <span className="text-sm">Music</span>
      </button>
    </div>
  );
}