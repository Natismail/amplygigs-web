// src/app/(app)/musician/settings/notifications/page.js - COMPLETE VERSION
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Heart, 
  Star,
  Megaphone,
  Settings,
  AlertCircle, 
  CheckCircle 
} from "lucide-react";

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [prefs, setPrefs] = useState({
    // Communication Channels
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    
    // Activity Types
    bookings: true,
    payments: true,
    messages: true,
    followers: true,
    reviews: true,
    
    // System
    marketing: false,
    system_updates: true,
  });

  useEffect(() => {
    if (user) {
      fetchNotificationPrefs();
    }
  }, [user]);

  const fetchNotificationPrefs = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPrefs(data.preferences);
      } else {
        const errorData = await response.json();
        console.error('Error fetching preferences:', errorData);
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePref = async (key, value) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Not authenticated');
        setSaving(false);
        setPrefs(prefs);
        return;
      }

      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ preferences: newPrefs }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Preference updated!');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.error || 'Failed to update');
        setPrefs(prefs);
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update');
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  const handleEnableAll = async () => {
    const allOn = Object.keys(prefs).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    
    setPrefs(allOn);
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Not authenticated');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ preferences: allOn }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('All notifications enabled!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to enable all');
        fetchNotificationPrefs();
      }
    } catch (err) {
      console.error('Error enabling all:', err);
      setError('Failed to enable all');
      fetchNotificationPrefs();
    } finally {
      setSaving(false);
    }
  };

  const handleDisableAll = async () => {
    const allOff = Object.keys(prefs).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});
    
    setPrefs(allOff);
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Not authenticated');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ preferences: allOff }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('All notifications disabled!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to disable all');
        fetchNotificationPrefs();
      }
    } catch (err) {
      console.error('Error disabling all:', err);
      setError('Failed to disable all');
      fetchNotificationPrefs();
    } finally {
      setSaving(false);
    }
  };

  const notificationChannels = [
    {
      key: 'email_notifications',
      icon: Mail,
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      color: 'blue',
    },
    {
      key: 'push_notifications',
      icon: Bell,
      title: 'Push Notifications',
      description: 'Get real-time push notifications in browser/app',
      color: 'purple',
    },
    {
      key: 'sms_notifications',
      icon: Smartphone,
      title: 'SMS Notifications',
      description: 'Receive text messages for critical alerts',
      color: 'green',
    },
  ];

  const activityNotifications = [
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
      key: 'reviews',
      icon: Star,
      title: 'Reviews & Ratings',
      description: 'Be notified when you receive reviews',
      color: 'yellow',
    },
  ];

  const systemNotifications = [
    {
      key: 'marketing',
      icon: Megaphone,
      title: 'Marketing & Promotions',
      description: 'Receive tips, updates, and promotional content',
      color: 'orange',
    },
    {
      key: 'system_updates',
      icon: Settings,
      title: 'System Updates',
      description: 'Important platform updates and announcements',
      color: 'gray',
    },
  ];

  const colorClasses = {
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    pink: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    gray: 'bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400',
  };

  const renderNotificationToggle = (notification) => {
    const Icon = notification.icon;
    const isEnabled = prefs[notification.key];
    
    return (
      <div key={notification.key} className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
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
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Notification Settings
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Manage how and when you receive notifications from AmplyGigs
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

      {/* Communication Channels */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Communication Channels
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {notificationChannels.map(renderNotificationToggle)}
        </div>
      </div>

      {/* Activity Notifications */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Activity Notifications
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {activityNotifications.map(renderNotificationToggle)}
        </div>
      </div>

      {/* System Notifications */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          System Notifications
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {systemNotifications.map(renderNotificationToggle)}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleEnableAll}
          disabled={saving}
          className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Enable All'}
        </button>
        <button
          onClick={handleDisableAll}
          disabled={saving}
          className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Disable All'}
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
              Important Security Notifications
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Critical account security notifications will always be sent regardless of your preferences to protect your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}