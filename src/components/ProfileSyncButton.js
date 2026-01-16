// src/components/ProfileSyncButton.js - FIXED WITH AUTH HEADER
"use client";

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Use this component to let existing OAuth users sync their profile
 * Place it in settings or profile page
 */
export default function ProfileSyncButton({ onSyncComplete }) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setMessage('');

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setMessage('Please log in first');
        setSyncing(false);
        return;
      }

      const response = await fetch('/api/auth/sync-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Profile synced successfully! ✅');
        onSyncComplete?.();
        
        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(`Error: ${data.error || 'Failed to sync profile'}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      setMessage('Failed to sync profile. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : 'Sync Profile from Google'}
      </button>
      
      {message && (
        <p className={`text-sm ${
          message.includes('Error') || message.includes('Failed')
            ? 'text-red-600 dark:text-red-400'
            : 'text-green-600 dark:text-green-400'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}