// src/components/InactivityWarning.jsx
"use client";

import { useAuth } from "@/context/AuthContext";

export default function InactivityWarning() {
  const { showInactivityWarning, stayLoggedIn, signOut } = useAuth();

  if (!showInactivityWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">⏱️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Still there?
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          You've been inactive for a while. For your security, you'll be 
          logged out in <span className="font-semibold text-red-500">1 minute</span>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={stayLoggedIn}
            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 
                       text-white font-semibold rounded-xl transition"
          >
            Stay Logged In
          </button>
          <button
            onClick={() => signOut()}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 
                       dark:bg-gray-700 dark:hover:bg-gray-600
                       text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}