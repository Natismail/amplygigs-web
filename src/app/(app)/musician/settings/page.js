// src/app/(app)/musician/settings/page.js - WITH OAUTH SYNC
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Paintbrush,
  Shield,
  Bell,
  CreditCard,
  RefreshCw,
  X,
} from "lucide-react";

const settings = [
  {
    title: "Profile",
    description: "Update your profile, media & public info",
    href: "/musician/settings/profile",
    icon: User,
  },
  {
    title: "Customization",
    description: "Customize your public musician page",
    href: "/musician/settings/customization",
    icon: Paintbrush,
  },
  {
    title: "Security",
    description: "Password, sessions & account safety",
    href: "/musician/settings/security",
    icon: Shield,
  },
  {
    title: "Notifications",
    description: "Email & app notifications",
    href: "/musician/settings/notification",
    icon: Bell,
  },
  {
    title: "Bank Accounts",
    description: "Manage payout bank accounts",
    href: "/musician/settings/bank-accounts",
    icon: CreditCard,
  },
];

export default function MusicianSettingsPage() {
  const { user } = useAuth();
  const [showSyncBanner, setShowSyncBanner] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    // Check if user might need OAuth sync
    if (user) {
      const needsSync = user.first_name === 'User' || 
                       !user.first_name || 
                       !user.last_name ||
                       (!user.profile_picture_url && user.email?.includes('@gmail.com'));
      setShowSyncBanner(needsSync);
    }
  }, [user]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');

    try {
      const response = await fetch('/api/auth/sync-profile', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setSyncMessage('✅ Profile synced successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setSyncMessage(`❌ Error: ${data.error || 'Failed to sync profile'}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncMessage('❌ Failed to sync profile. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {/* OAuth Sync Banner */}
      {showSyncBanner && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 sm:p-6 border border-purple-200 dark:border-purple-800 relative">
          <button
            onClick={() => setShowSyncBanner(false)}
            className="absolute top-3 right-3 p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded-full transition"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Sync Your Profile
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                It looks like you signed in with Google or Facebook. Click below to sync your 
                name and profile picture from your account.
              </p>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Profile from Google'}
              </button>
              {syncMessage && (
                <p className={`text-sm mt-2 ${
                  syncMessage.includes('❌')
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {syncMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="p-4 rounded-xl border bg-white dark:bg-gray-900 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Icon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}