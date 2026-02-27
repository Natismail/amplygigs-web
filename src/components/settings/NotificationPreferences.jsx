// src/components/settings/NotificationPreferences.jsx
// FIXED - Independent event preferences
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { 
  Bell, Mail, Smartphone, MessageSquare, Moon, 
  Save, CheckCircle, AlertCircle, Calendar, DollarSign,
  Heart, Star, Megaphone, Settings as SettingsIcon
} from 'lucide-react';

export default function NotificationPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [prefs, setPrefs] = useState({
    // Channels
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    push_enabled: true,
    in_app_enabled: true,
    
    // Contact info
    email_address: '',
    phone_number: '',
    whatsapp_number: '',
    
    // Event types (JSONB) - DEFAULT VALUES
    booking_notifications: { email: true, sms: false, whatsapp: true, push: true },
    message_notifications: { email: false, sms: false, whatsapp: true, push: true },
    payment_notifications: { email: true, sms: true, whatsapp: true, push: true },
    job_notifications: { email: true, sms: false, whatsapp: false, push: true },
    marketing_notifications: { email: true, sms: false, whatsapp: false, push: false },
    
    // Quiet hours
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00:00',
    quiet_hours_end: '08:00:00',
  });

  useEffect(() => {
    if (user) fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
      }

      if (data) {
        console.log('✅ Loaded preferences from DB:', data);
        
        // ⭐ CRITICAL FIX: Deep clone JSONB fields to prevent reference issues
        setPrefs({
          ...data,
          email_address: data.email_address || user.email || '',
          // Parse and clone JSONB fields
          booking_notifications: data.booking_notifications 
            ? JSON.parse(JSON.stringify(data.booking_notifications))
            : { email: true, sms: false, whatsapp: true, push: true },
          message_notifications: data.message_notifications
            ? JSON.parse(JSON.stringify(data.message_notifications))
            : { email: false, sms: false, whatsapp: true, push: true },
          payment_notifications: data.payment_notifications
            ? JSON.parse(JSON.stringify(data.payment_notifications))
            : { email: true, sms: true, whatsapp: true, push: true },
          job_notifications: data.job_notifications
            ? JSON.parse(JSON.stringify(data.job_notifications))
            : { email: true, sms: false, whatsapp: false, push: true },
          marketing_notifications: data.marketing_notifications
            ? JSON.parse(JSON.stringify(data.marketing_notifications))
            : { email: true, sms: false, whatsapp: false, push: false },
        });
      } else {
        console.log('⚠️ No preferences found, creating defaults...');
        await createDefaultPreferences();
      }
    } catch (err) {
      console.error('Error:', err);
      showMessage('error', 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    const defaultPrefs = {
      user_id: user.id,
      email_address: user.email,
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
    };

    console.log('📝 Creating default preferences:', defaultPrefs);

    const { data, error } = await supabase
      .from('notification_preferences')
      .insert(defaultPrefs)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating defaults:', error);
    } else {
      console.log('✅ Created default preferences:', data);
      setPrefs({
        ...defaultPrefs,
        // Deep clone JSONB fields
        booking_notifications: JSON.parse(JSON.stringify(defaultPrefs.booking_notifications)),
        message_notifications: JSON.parse(JSON.stringify(defaultPrefs.message_notifications)),
        payment_notifications: JSON.parse(JSON.stringify(defaultPrefs.payment_notifications)),
        job_notifications: JSON.parse(JSON.stringify(defaultPrefs.job_notifications)),
        marketing_notifications: JSON.parse(JSON.stringify(defaultPrefs.marketing_notifications)),
      });
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    // Prepare data for saving (remove React-specific fields)
    const dataToSave = {
      user_id: user.id,
      email_enabled: prefs.email_enabled,
      sms_enabled: prefs.sms_enabled,
      whatsapp_enabled: prefs.whatsapp_enabled,
      push_enabled: prefs.push_enabled,
      in_app_enabled: prefs.in_app_enabled,
      email_address: prefs.email_address,
      phone_number: prefs.phone_number,
      whatsapp_number: prefs.whatsapp_number,
      booking_notifications: prefs.booking_notifications,
      message_notifications: prefs.message_notifications,
      payment_notifications: prefs.payment_notifications,
      job_notifications: prefs.job_notifications,
      marketing_notifications: prefs.marketing_notifications,
      quiet_hours_enabled: prefs.quiet_hours_enabled,
      quiet_hours_start: prefs.quiet_hours_start,
      quiet_hours_end: prefs.quiet_hours_end,
      updated_at: new Date().toISOString(),
    };

    console.log('💾 Saving preferences:', dataToSave);

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(dataToSave, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Save error:', error);
        throw error;
      }

      console.log('✅ Saved successfully:', data);
      showMessage('success', 'Preferences saved successfully!');
      
      // Verify by reading back
      const { data: verifyData } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      console.log('🔍 Verification - DB contains:', verifyData);
    } catch (err) {
      console.error('Save error:', err);
      showMessage('error', 'Failed to save preferences: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const updateChannelPref = (key, value) => {
    console.log(`📝 Updating ${key}:`, value);
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  // ⭐ CRITICAL FIX: Proper immutable state update
  const updateEventPref = (eventType, channel, value) => {
    console.log(`📝 Updating ${eventType}.${channel}:`, value);
    
    setPrefs(prev => ({
      ...prev,
      [eventType]: {
        ...prev[eventType], // Copy existing values
        [channel]: value,   // Update only this channel
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      {message.text && (
        <div className={`flex items-center gap-2 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Debug Info - Remove in production */}
      {/* {process.env.NODE_ENV === 'development' && (
        <details className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
          <summary className="cursor-pointer font-mono text-xs">Debug Info (Dev Only)</summary>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify({
              booking_notifications: prefs.booking_notifications,
              message_notifications: prefs.message_notifications,
              payment_notifications: prefs.payment_notifications,
            }, null, 2)}
          </pre>
        </details>
      )} */}

      {/* Notification Channels */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
          <ChannelToggle
            icon={Mail}
            title="Email Notifications"
            description="Receive updates via email"
            checked={prefs.email_enabled}
            onChange={(checked) => updateChannelPref('email_enabled', checked)}
            color="blue"
          />

          <ChannelToggle
            icon={Smartphone}
            title="SMS Notifications"
            description="Get urgent alerts via text message"
            checked={prefs.sms_enabled}
            onChange={(checked) => updateChannelPref('sms_enabled', checked)}
            color="green"
          />

          <ChannelToggle
            icon={MessageSquare}
            title="WhatsApp Notifications"
            description="Receive updates on WhatsApp"
            checked={prefs.whatsapp_enabled}
            onChange={(checked) => updateChannelPref('whatsapp_enabled', checked)}
            color="green"
          />

          <ChannelToggle
            icon={Bell}
            title="Push Notifications"
            description="Get instant alerts in your browser"
            checked={prefs.push_enabled}
            onChange={(checked) => updateChannelPref('push_enabled', checked)}
            color="purple"
          />
        </div>
      </section>

      {/* Contact Information */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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
              value={prefs.email_address}
              onChange={(e) => updateChannelPref('email_address', e.target.value)}
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
              onChange={(e) => updateChannelPref('phone_number', e.target.value)}
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
              onChange={(e) => updateChannelPref('whatsapp_number', e.target.value)}
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
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          What to Notify Me About
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Choose which channels to use for each type of notification
        </p>

        <div className="space-y-6">
          <EventTypePreference
            icon={Calendar}
            title="Booking Notifications"
            description="New bookings, confirmations, cancellations"
            preferences={prefs.booking_notifications}
            onChange={(channel, value) => updateEventPref('booking_notifications', channel, value)}
          />

          <EventTypePreference
            icon={MessageSquare}
            title="Message Notifications"
            description="New messages from clients or musicians"
            preferences={prefs.message_notifications}
            onChange={(channel, value) => updateEventPref('message_notifications', channel, value)}
          />

          <EventTypePreference
            icon={DollarSign}
            title="Payment Notifications"
            description="Payment received, released, or refunded"
            preferences={prefs.payment_notifications}
            onChange={(channel, value) => updateEventPref('payment_notifications', channel, value)}
          />

          <EventTypePreference
            icon={Star}
            title="Job & Audition Notifications"
            description="New job postings, applications, auditions"
            preferences={prefs.job_notifications}
            onChange={(channel, value) => updateEventPref('job_notifications', channel, value)}
          />

          <EventTypePreference
            icon={Megaphone}
            title="Marketing & Updates"
            description="News, features, tips, and promotions"
            preferences={prefs.marketing_notifications}
            onChange={(channel, value) => updateEventPref('marketing_notifications', channel, value)}
          />
        </div>
      </section>

      {/* Quiet Hours */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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
            onChange={(e) => updateChannelPref('quiet_hours_enabled', e.target.checked)}
            className="w-5 h-5 rounded cursor-pointer
        border-gray-300 dark:border-gray-600
        text-green-600 focus:ring-purple-500
        checked:bg-green-600 checked:border-green-600"
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
                value={prefs.quiet_hours_start ? prefs.quiet_hours_start.substring(0, 5) : '22:00'}
                onChange={(e) => updateChannelPref('quiet_hours_start', e.target.value + ':00')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={prefs.quiet_hours_end ? prefs.quiet_hours_end.substring(0, 5) : '08:00'}
                onChange={(e) => updateChannelPref('quiet_hours_end', e.target.value + ':00')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-xl transition shadow-lg"
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
  );
}

// Helper Components
function ChannelToggle({ icon: Icon, title, description, checked, onChange, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
          checked ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// Improved EventTypePreference Component
// Add this to replace the existing one in NotificationPreferences.jsx

function EventTypePreference({ icon: Icon, title, description, preferences, onChange }) {
  return (
    <div className="border-l-4 border-purple-500 pl-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-r-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 ml-2">
        {['email', 'sms', 'whatsapp', 'push'].map((channel) => {
          const isChecked = preferences?.[channel] ?? false;
          
          return (
            <label 
              key={channel} 
              className={`
                flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all
                ${isChecked 
                  ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500 shadow-sm' 
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                }
              `}
            >
              {/* Custom Checkbox */}
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onChange(channel, e.target.checked)}
                  className="sr-only" // Hide default checkbox
                />
                
                {/* Custom checkbox visual */}
                <div className={`
                  w-5 h-5 rounded flex items-center justify-center transition-all
                  ${isChecked
                    ? 'bg-purple-600 border-2 border-purple-600'
                    : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                  }
                `}>
                  {/* Checkmark */}
                  {isChecked && (
                    <svg 
                      className="w-3.5 h-3.5 text-white" 
                      fill="none" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="3" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
              </div>

              {/* Label with icon */}
              <div className="flex items-center gap-1.5">
                {channel === 'email' && <span className="text-base">📧</span>}
                {channel === 'sms' && <span className="text-base">📱</span>}
                {channel === 'whatsapp' && <span className="text-base">💬</span>}
                {channel === 'push' && <span className="text-base">🔔</span>}
                <span className={`text-sm font-medium capitalize ${
                  isChecked 
                    ? 'text-purple-700 dark:text-purple-300' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {channel}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}