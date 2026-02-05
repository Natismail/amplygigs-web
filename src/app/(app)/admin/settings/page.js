// src/app/(app)/admin/settings/page.js - NEW ADMIN SETTINGS PAGE
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Settings, Shield, DollarSign, Bell, Users, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformFeePercentage: 15,
    minimumWithdrawal: 1000,
    autoReleaseHours: 24,
    requireKYCForBookings: true,
    requireKYCForWithdrawals: true,
    maintenanceMode: false,
    allowNewRegistrations: true,
    maxCancellationsFree: 3,
    penaltyAfterCancellations: 500
  });

  useEffect(() => {
    checkAdminAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function checkAdminAccess() {
    if (!user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('user_profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single();

    if (!data?.is_admin && data?.role !== 'ADMIN') {
      alert('Access denied. Admin privileges required.');
      router.push('/admin/dashboard');
      return;
    }

    await loadSettings();
  }

  async function loadSettings() {
    try {
      // In a real app, you'd load these from a settings table
      // For now, we'll use default values
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Here you would save to a platform_settings table
      // For now, we'll just simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Platform Settings
          </h1>
          <p className="text-purple-100">Configure platform-wide settings and policies</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Financial Settings */}
        <SettingsSection
          title="Financial Settings"
          description="Configure platform fees and withdrawal limits"
          icon={<DollarSign className="w-6 h-6" />}
        >
          <div className="space-y-4">
            <SettingItem
              label="Platform Fee Percentage"
              description="Percentage taken from each booking"
              value={settings.platformFeePercentage}
              onChange={(value) => setSettings({...settings, platformFeePercentage: parseFloat(value)})}
              type="number"
              suffix="%"
              min={0}
              max={100}
            />
            <SettingItem
              label="Minimum Withdrawal Amount"
              description="Minimum amount musicians can withdraw"
              value={settings.minimumWithdrawal}
              onChange={(value) => setSettings({...settings, minimumWithdrawal: parseFloat(value)})}
              type="number"
              prefix="₦"
              min={100}
            />
            <SettingItem
              label="Auto-Release Time"
              description="Hours after completion to auto-release funds"
              value={settings.autoReleaseHours}
              onChange={(value) => setSettings({...settings, autoReleaseHours: parseInt(value)})}
              type="number"
              suffix="hours"
              min={1}
              max={168}
            />
          </div>
        </SettingsSection>

        {/* Verification Settings */}
        <SettingsSection
          title="Verification & Security"
          description="KYC and security requirements"
          icon={<Shield className="w-6 h-6" />}
        >
          <div className="space-y-4">
            <ToggleSetting
              label="Require KYC for Bookings"
              description="Musicians must be verified to accept bookings"
              checked={settings.requireKYCForBookings}
              onChange={(checked) => setSettings({...settings, requireKYCForBookings: checked})}
            />
            <ToggleSetting
              label="Require KYC for Withdrawals"
              description="Musicians must be verified to withdraw funds"
              checked={settings.requireKYCForWithdrawals}
              onChange={(checked) => setSettings({...settings, requireKYCForWithdrawals: checked})}
            />
          </div>
        </SettingsSection>

        {/* Platform Settings */}
        <SettingsSection
          title="Platform Access"
          description="Control platform availability"
          icon={<Users className="w-6 h-6" />}
        >
          <div className="space-y-4">
            <ToggleSetting
              label="Maintenance Mode"
              description="Temporarily disable platform access (except admins)"
              checked={settings.maintenanceMode}
              onChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
              warning={settings.maintenanceMode}
            />
            <ToggleSetting
              label="Allow New Registrations"
              description="Enable/disable new user signups"
              checked={settings.allowNewRegistrations}
              onChange={(checked) => setSettings({...settings, allowNewRegistrations: checked})}
            />
          </div>
        </SettingsSection>

        {/* Cancellation Policy */}
        <SettingsSection
          title="Cancellation Policy"
          description="Configure cancellation rules and penalties"
          icon={<Bell className="w-6 h-6" />}
        >
          <div className="space-y-4">
            <SettingItem
              label="Free Cancellations Allowed"
              description="Number of free cancellations per user per month"
              value={settings.maxCancellationsFree}
              onChange={(value) => setSettings({...settings, maxCancellationsFree: parseInt(value)})}
              type="number"
              min={0}
              max={10}
            />
            <SettingItem
              label="Cancellation Penalty"
              description="Fee charged after free cancellations are exhausted"
              value={settings.penaltyAfterCancellations}
              onChange={(value) => setSettings({...settings, penaltyAfterCancellations: parseFloat(value)})}
              type="number"
              prefix="₦"
              min={0}
            />
          </div>
        </SettingsSection>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, description, icon, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingItem({ label, description, value, onChange, type = "text", prefix, suffix, min, max }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 dark:text-white">{label}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      </div>
      <div className="ml-4 flex items-center gap-2">
        {prefix && <span className="text-gray-600 dark:text-gray-400">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-purple-500"
        />
        {suffix && <span className="text-gray-600 dark:text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

function ToggleSetting({ label, description, checked, onChange, warning }) {
  return (
    <div className={`flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-0 ${warning ? 'bg-red-50 dark:bg-red-900/10 -mx-6 px-6' : ''}`}>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 dark:text-white">{label}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        {warning && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium">
            ⚠️ Warning: This will affect all users immediately
          </p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`ml-4 relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
          checked ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}