// src/app/(app)/admin/settings/page.js
// CHANGES:
// - VAT section COMMENTED OUT (re-enable for employment/permanent roles)
// - Hardcoded ₦ replaced with currency-aware display
// - handleSave now actually persists to platform_settings table in Supabase
// - Loads real settings on mount

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Settings, Shield, DollarSign, Bell, Users, Save, CheckCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    platformFeePercentage: 10,
    minimumWithdrawal: 1000,
    autoReleaseHours: 24,
    requireKYCForBookings: true,
    requireKYCForWithdrawals: true,
    maintenanceMode: false,
    allowNewRegistrations: true,
    maxCancellationsFree: 3,
    penaltyAfterCancellations: 500,
    defaultCurrency: 'NGN',

    // VAT — DISABLED until employment/permanent role flow is live
    // vatEnabled: false,
    // vatPercentage: 7.5,
    // vatAppliesTo: 'permanent', // 'all' | 'permanent' | 'none'
  });

  useEffect(() => {
    checkAdminAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function checkAdminAccess() {
    if (!user) { router.push('/login'); return; }

    const { data } = await supabase
      .from('user_profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single();

    if (!data?.is_admin && data?.role !== 'ADMIN') {
      alert('Access denied.');
      router.push('/admin/dashboard');
      return;
    }

    await loadSettings();
  }

  async function loadSettings() {
    try {
      // Load from platform_settings table (key-value store)
      // Run this SQL first if table doesn't exist:
      // CREATE TABLE IF NOT EXISTS platform_settings (
      //   key TEXT PRIMARY KEY,
      //   value JSONB,
      //   updated_at TIMESTAMPTZ DEFAULT now()
      // );
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value');

      if (!error && data && data.length > 0) {
        const parsed = {};
        data.forEach(row => { parsed[row.key] = row.value; });
        setSettings(prev => ({ ...prev, ...parsed }));
      }
      // If table doesn't exist yet, just use defaults — no crash
    } catch (error) {
      console.warn('Settings table not found, using defaults:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Upsert each setting as a key-value row
      const rows = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('platform_settings')
        .upsert(rows, { onConflict: 'key' });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert('Failed to save settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  const set = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Platform Settings
          </h1>
          <p className="text-purple-100">Configure platform-wide settings and policies</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Financial Settings */}
        <SettingsSection
          title="Financial Settings"
          description="Platform fees, withdrawal limits, escrow timing"
          icon={<DollarSign className="w-6 h-6" />}
        >
          <SettingItem
            label="Platform Fee Percentage"
            description="Percentage taken from each booking payout (deducted from musician, not added to client)"
            value={settings.platformFeePercentage}
            onChange={(v) => set('platformFeePercentage', parseFloat(v))}
            type="number" suffix="%" min={0} max={50}
          />
          <SettingItem
            label="Minimum Withdrawal Amount"
            description="Minimum balance a musician must have to request withdrawal"
            value={settings.minimumWithdrawal}
            onChange={(v) => set('minimumWithdrawal', parseFloat(v))}
            type="number" suffix={settings.defaultCurrency} min={100}
          />
          <SettingItem
            label="Escrow Auto-Release Time"
            description="Hours after gig completion before funds auto-release to musician"
            value={settings.autoReleaseHours}
            onChange={(v) => set('autoReleaseHours', parseInt(v))}
            type="number" suffix="hours" min={1} max={168}
          />

          {/*
          ╔══════════════════════════════════════════════════════════════╗
          ║  VAT SETTINGS — DISABLED                                     ║
          ║  Re-enable when permanent/employment role flow is introduced  ║
          ║  Current model: contract roles only → no VAT applicable       ║
          ╚══════════════════════════════════════════════════════════════╝

          <ToggleSetting
            label="Enable VAT"
            description="Apply 7.5% VAT on applicable transactions (Nigeria — permanent employment only)"
            checked={settings.vatEnabled}
            onChange={(v) => set('vatEnabled', v)}
          />
          {settings.vatEnabled && (
            <SettingItem
              label="VAT Percentage"
              description="VAT rate to apply"
              value={settings.vatPercentage}
              onChange={(v) => set('vatPercentage', parseFloat(v))}
              type="number" suffix="%" min={0} max={30}
            />
          )}
          */}
        </SettingsSection>

        {/* Verification */}
        <SettingsSection
          title="Verification & Security"
          description="KYC requirements for musicians"
          icon={<Shield className="w-6 h-6" />}
        >
          <ToggleSetting
            label="Require KYC for Bookings"
            description="Musicians must be verified before accepting proposals and bookings"
            checked={settings.requireKYCForBookings}
            onChange={(v) => set('requireKYCForBookings', v)}
          />
          <ToggleSetting
            label="Require KYC for Withdrawals"
            description="Musicians must be verified before withdrawing funds"
            checked={settings.requireKYCForWithdrawals}
            onChange={(v) => set('requireKYCForWithdrawals', v)}
          />
        </SettingsSection>

        {/* Platform Access */}
        <SettingsSection
          title="Platform Access"
          description="Control platform availability"
          icon={<Users className="w-6 h-6" />}
        >
          <ToggleSetting
            label="Maintenance Mode"
            description="Temporarily disable platform access for all non-admin users"
            checked={settings.maintenanceMode}
            onChange={(v) => set('maintenanceMode', v)}
            warning={settings.maintenanceMode}
          />
          <ToggleSetting
            label="Allow New Registrations"
            description="Enable or disable new user signups"
            checked={settings.allowNewRegistrations}
            onChange={(v) => set('allowNewRegistrations', v)}
          />
        </SettingsSection>

        {/* Cancellation Policy */}
        <SettingsSection
          title="Cancellation Policy"
          description="Cancellation rules and penalties"
          icon={<Bell className="w-6 h-6" />}
        >
          <SettingItem
            label="Free Cancellations Per Month"
            description="How many free cancellations each user gets per month"
            value={settings.maxCancellationsFree}
            onChange={(v) => set('maxCancellationsFree', parseInt(v))}
            type="number" min={0} max={10}
          />
          <SettingItem
            label="Cancellation Penalty"
            description="Fee charged after free cancellations are exhausted"
            value={settings.penaltyAfterCancellations}
            onChange={(v) => set('penaltyAfterCancellations', parseFloat(v))}
            type="number" suffix={settings.defaultCurrency} min={0}
          />
        </SettingsSection>

        {/* Save */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
              <CheckCircle className="w-4 h-4" /> Settings saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold disabled:opacity-50 transition"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* VAT note */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
          <strong>💡 VAT / Tax Note:</strong> VAT (7.5%) settings are currently disabled. The platform operates
          on a contract-role model where VAT is not applicable. When permanent employment features are
          introduced, re-enable VAT in <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">AdminSettingsPage</code> and{' '}
          <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">PlatformFeePaymentForm</code>.
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, description, icon, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 flex-shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">{children}</div>
    </div>
  );
}

function SettingItem({ label, description, value, onChange, type = "text", suffix, min, max }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 pr-4">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm">{label}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min} max={max}
          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {suffix && <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[3rem]">{suffix}</span>}
      </div>
    </div>
  );
}

function ToggleSetting({ label, description, checked, onChange, warning }) {
  return (
    <div className={`flex items-center justify-between py-4 ${warning ? 'bg-red-50 dark:bg-red-900/10 -mx-6 px-6 rounded-lg' : ''}`}>
      <div className="flex-1 pr-4">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm">{label}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        {warning && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">
            ⚠️ This affects all users immediately
          </p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`flex-shrink-0 relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          checked ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}