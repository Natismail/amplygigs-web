// app/settings/notifications/page.js
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Moon,
  Shield,
  CheckCircle,
  Save,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (user) fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Create default preferences if none exist
      await createDefaultPreferences();
    } else {
      setPrefs(data);
    }
    
    setLoading(false);
  };

  const createDefaultPreferences = async () => {
    const defaultPrefs = {
      user_id: user.id,
      email_enabled: true,
      sms_enabled: false,
      whatsapp_enabled: false,
      push_enabled: true,
      in_app_enabled: true,
      booking_notifications: { email: true, sms: false, whatsapp: true, push: true },
      message_notifications: { email: false, sms: false, whatsapp: true, push: true },
      payment_notifications: { email: true, sms: true, whatsapp: true, push: true },
      job_notifications: { email: true, sms: false, whatsapp: false, push: true },
      marketing_notifications: { email: true, sms: false, whatsapp: false, push: false },
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00:00',
      quiet_hours_end: '08:00:00',
      max_emails_per_day: 10,
      max_sms_per_day: 5,
      max_whatsapp_per_day: 10,
    };

    const { data } = await supabase
      .from('notification_preferences')
      .insert(defaultPrefs)
      .select()
      .single();

    setPrefs(data || defaultPrefs);
  };

  const updatePreference = async (field, value) => {
    const updated = { ...prefs, [field]: value };
    setPrefs(updated);
  };

  const savePreferences = async () => {
    setSaving(true);
    setSaveMessage('');

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        ...prefs,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      setSaveMessage('❌ Failed to save preferences');
      console.error('Save error:', error);
    } else {
      setSaveMessage('✅ Preferences saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    }

    setSaving(false);
  };

  const updateEventPreference = (eventType, channel, value) => {
    const updated = {
      ...prefs,
      [eventType]: {
        ...prefs[eventType],
        [channel]: value,
      },
    };
    setPrefs(updated);
  };

  if (!user) {
    return <div className="p-6">Please log in to manage notification settings</div>;
  }

  if (loading || !prefs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Bell className="w-7 h-7" />
            Notification Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Control how and when you receive notifications
          </p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            saveMessage.includes('✅') 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Notification Channels */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Notification Channels
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose how you want to receive notifications
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Email Notifications
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive updates via email
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.email_enabled}
                  onChange={(e) => updatePreference('email_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    SMS Notifications
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get urgent alerts via text message
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.sms_enabled}
                  onChange={(e) => updatePreference('sms_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    WhatsApp Notifications
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive updates on WhatsApp
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.whatsapp_enabled}
                  onChange={(e) => updatePreference('whatsapp_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Push */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Push Notifications
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get instant alerts in your browser
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.push_enabled}
                  onChange={(e) => updatePreference('push_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Contact Information
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Update your contact details for notifications
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={prefs.email_address || user.email || ''}
                onChange={(e) => updatePreference('email_address', e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number (for SMS)
              </label>
              <input
                type="tel"
                value={prefs.phone_number || ''}
                onChange={(e) => updatePreference('phone_number', e.target.value)}
                placeholder="+234 XXX XXX XXXX"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Required for SMS notifications
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={prefs.whatsapp_number || ''}
                onChange={(e) => updatePreference('whatsapp_number', e.target.value)}
                placeholder="+234 XXX XXX XXXX"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Can be the same as phone number
              </p>
            </div>
          </div>
        </section>

        {/* Event-Specific Preferences */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            What to Notify Me About
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Choose which channels to use for each type of notification
          </p>

          <div className="space-y-6">
            {/* Booking Notifications */}
            <NotificationTypePreference
              title="Booking Notifications"
              description="New bookings, confirmations, cancellations"
              icon="📅"
              preferences={prefs.booking_notifications}
              onChange={(channel, value) => updateEventPreference('booking_notifications', channel, value)}
            />

            {/* Message Notifications */}
            <NotificationTypePreference
              title="Message Notifications"
              description="New messages from clients or musicians"
              icon="💬"
              preferences={prefs.message_notifications}
              onChange={(channel, value) => updateEventPreference('message_notifications', channel, value)}
            />

            {/* Payment Notifications */}
            <NotificationTypePreference
              title="Payment Notifications"
              description="Payment received, released, or refunded"
              icon="💰"
              preferences={prefs.payment_notifications}
              onChange={(channel, value) => updateEventPreference('payment_notifications', channel, value)}
            />

            {/* Job Notifications */}
            <NotificationTypePreference
              title="Job & Audition Notifications"
              description="New job postings, applications, auditions"
              icon="💼"
              preferences={prefs.job_notifications}
              onChange={(channel, value) => updateEventPreference('job_notifications', channel, value)}
            />

            {/* Marketing */}
            <NotificationTypePreference
              title="Marketing & Updates"
              description="News, features, tips, and promotions"
              icon="📢"
              preferences={prefs.marketing_notifications}
              onChange={(channel, value) => updateEventPreference('marketing_notifications', channel, value)}
            />
          </div>
        </section>

        {/* Quiet Hours */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Moon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Quiet Hours
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pause non-urgent notifications during specific hours
              </p>
            </div>
          </div>
          
          <label className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={prefs.quiet_hours_enabled}
              onChange={(e) => updatePreference('quiet_hours_enabled', e.target.checked)}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
            />
            <span className="font-medium text-gray-900 dark:text-white">
              Enable quiet hours
            </span>
          </label>

          {prefs.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={prefs.quiet_hours_start || '22:00'}
                  onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={prefs.quiet_hours_end || '08:00'}
                  onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </section>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-xl transition shadow-lg"
          >
            {saving ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Component
function NotificationTypePreference({ title, description, icon, preferences, onChange }) {
  return (
    <div className="border-l-4 border-purple-500 pl-4 py-2">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 ml-11">
        {['email', 'sms', 'whatsapp', 'push'].map(channel => (
          <label key={channel} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences?.[channel] ?? false}
              onChange={(e) => onChange(channel, e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
              {channel}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}