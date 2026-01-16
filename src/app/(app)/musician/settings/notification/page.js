// src/app/(app)/musician/settings/notifications/page.js - IMPROVED UI
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Bell, Mail, DollarSign, Calendar, MessageSquare, Heart, CheckCircle, AlertCircle } from "lucide-react";

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [prefs, setPrefs] = useState({
    bookings: true,
    payments: true,
    messages: true,
    followers: true,
    marketing: false,
  });

  useEffect(() => {
    if (user) {
      fetchNotificationPrefs();
    }
  }, [user]);

  const fetchNotificationPrefs = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();
    
    if (data?.notification_preferences) {
      setPrefs(data.notification_preferences);
    }
  };

  const updatePref = async (key, value) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    
    setSaving(true);
    setError('');
    
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        notification_preferences: newPrefs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    setSaving(false);
    
    if (updateError) {
      setError('Failed to update notification preferences');
      // Revert on error
      setPrefs(prefs);
    } else {
      setSuccess('Notification preferences updated!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const notifications = [
    {
      key: 'bookings',
      icon: Calendar,
      title: 'Booking Requests',
      description: 'Get notified when clients request to book you',
      color: 'purple',
    },
    {
      key: 'payments',
      icon: DollarSign,
      title: 'Payment Updates',
      description: 'Receive updates about payments and payouts',
      color: 'green',
    },
    {
      key: 'messages',
      icon: MessageSquare,
      title: 'Messages',
      description: 'Get notified when you receive new messages',
      color: 'blue',
    },
    {
      key: 'followers',
      icon: Heart,
      title: 'New Followers',
      description: 'Know when someone follows your profile',
      color: 'pink',
    },
    {
      key: 'marketing',
      icon: Mail,
      title: 'Marketing & Tips',
      description: 'Receive tips, updates, and promotional emails',
      color: 'orange',
    },
  ];

  const colorClasses = {
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    pink: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Notifications
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Manage your email and app notification preferences
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          const isEnabled = prefs[notification.key];
          
          return (
            <div key={notification.key} className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                {/* Icon & Info */}
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[notification.color]}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {notification.description}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => updatePref(notification.key, !isEnabled)}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isEnabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  role="switch"
                  aria-checked={isEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => {
            const allOn = { bookings: true, payments: true, messages: true, followers: true, marketing: true };
            Object.keys(allOn).forEach(key => updatePref(key, true));
          }}
          disabled={saving}
          className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50"
        >
          Enable All
        </button>
        <button
          onClick={() => {
            const allOff = { bookings: false, payments: false, messages: false, followers: false, marketing: false };
            Object.keys(allOff).forEach(key => updatePref(key, false));
          }}
          disabled={saving}
          className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition disabled:opacity-50"
        >
          Disable All
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Important Notifications
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Critical account security notifications will always be sent regardless of your preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}