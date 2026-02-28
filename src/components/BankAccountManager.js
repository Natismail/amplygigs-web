// src/components/BankAccountManager.js
// Added: preferredCurrency prop — pre-selects the correct country based on musician's rate currency
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { getBankRequirements, validateBankAccount } from '@/lib/internationalBankConfig';
import { Building2, Globe, Info } from 'lucide-react';

// Map rate currency → default country code
const CURRENCY_TO_COUNTRY = {
  NGN: 'NG',
  USD: 'US',
  GBP: 'GB',
  EUR: 'DE',
  GHS: 'GH',
  KES: 'KE',
  ZAR: 'ZA',
  INR: 'IN',
  AUD: 'AU',
};

export default function BankAccountManager({ onAccountAdded, preferredCurrency }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // Pre-select country from preferredCurrency prop, fallback to user country or NG
  const defaultCountry =
    (preferredCurrency && CURRENCY_TO_COUNTRY[preferredCurrency?.toUpperCase()]) ||
    user?.country_code ||
    'NG';

  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [requirements, setRequirements] = useState(getBankRequirements(defaultCountry));

  const [formData, setFormData] = useState({
    account_number: '',
    bank_code: '',
    bank_name: '',
    account_name: '',
  });
  const [resolvedName, setResolvedName] = useState('');
  const [error, setError] = useState(null);

  // Re-sync if preferredCurrency changes after mount (e.g. profile loads late)
  useEffect(() => {
    if (preferredCurrency) {
      const mapped = CURRENCY_TO_COUNTRY[preferredCurrency?.toUpperCase()];
      if (mapped) setSelectedCountry(mapped);
    }
  }, [preferredCurrency]);

  useEffect(() => {
    fetchBankAccounts();
    if (selectedCountry === 'NG') fetchNigerianBanks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedCountry]);

  useEffect(() => {
    setRequirements(getBankRequirements(selectedCountry));
    setFormData({ account_number: '', bank_code: '', bank_name: '', account_name: '' });
    setResolvedName('');
    setError(null);
  }, [selectedCountry]);

  const fetchBankAccounts = async () => {
    const { data, error } = await supabase
      .from('musician_bank_accounts')
      .select('*')
      .eq('musician_id', user?.id)
      .order('is_default', { ascending: false });
    if (!error) setAccounts(data || []);
  };

  const fetchNigerianBanks = async () => {
    setLoadingBanks(true);
    try {
      const response = await fetch('/api/banks');
      const data = await response.json();
      if (data.success) setBanks(data.banks || []);
    } catch (err) {
      console.error('Failed to fetch banks:', err);
      setError('Failed to load banks. Please refresh.');
    } finally {
      setLoadingBanks(false);
    }
  };

  const verifyAccountNumber = async () => {
    if (!formData.account_number || !formData.bank_code) {
      setError('Please enter account number and select a bank');
      return;
    }
    if (formData.account_number.length !== 10) {
      setError('Account number must be exactly 10 digits');
      return;
    }
    setVerifying(true);
    setError(null);
    setResolvedName('');
    try {
      const response = await fetch('/api/banks/verify-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: formData.account_number,
          bank_code: formData.bank_code,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setResolvedName(result.account_name);
        setFormData(prev => ({ ...prev, account_name: result.account_name }));
      } else {
        setError(result.error || 'Account verification failed');
      }
    } catch {
      setError('Failed to verify account. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleAddAccount = async () => {
    const validation = validateBankAccount(selectedCountry, formData);
    if (!validation.isValid) {
      setError(Object.values(validation.errors)[0]);
      return;
    }
    if (selectedCountry === 'NG' && !resolvedName) {
      setError('Please verify your account number first');
      return;
    }
    if (selectedCountry !== 'NG' && !formData.account_name) {
      setError('Please enter account holder name');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const selectedBank = banks.find(b => b.code === formData.bank_code);
      const { data, error: insertError } = await supabase
        .from('musician_bank_accounts')
        .insert({
          musician_id: user.id,
          account_number: formData.account_number,
          account_name: resolvedName || formData.account_name,
          bank_name: selectedBank?.name || formData.bank_name,
          bank_code: formData.bank_code || null,
          country_code: selectedCountry,
          currency: requirements.currency,
          payment_provider: selectedCountry === 'NG' ? 'paystack' : 'stripe',
          is_default: accounts.length === 0,
          is_verified: selectedCountry === 'NG',
          verified_at: selectedCountry === 'NG' ? new Date().toISOString() : null,
          verification_method: selectedCountry === 'NG' ? 'paystack' : 'manual',
          status: 'active',
          sort_code: formData.sort_code || null,
          routing_number: formData.routing_number || null,
          iban: formData.iban || null,
          swift_code: formData.swift_code || null,
          bsb_number: formData.bsb_number || null,
          ifsc_code: formData.ifsc_code || null,
          branch_code: formData.branch_code || null,
          account_type: formData.account_type || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setAccounts(prev => [...prev, data]);
      setShowAddForm(false);
      setFormData({ account_number: '', bank_code: '', bank_name: '', account_name: '' });
      setResolvedName('');
      if (onAccountAdded) onAccountAdded(data);
    } catch (err) {
      setError(err.message || 'Failed to add bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (accountId) => {
    await supabase.from('musician_bank_accounts').update({ is_default: false }).eq('musician_id', user.id);
    const { error } = await supabase.from('musician_bank_accounts').update({ is_default: true }).eq('id', accountId);
    if (!error) fetchBankAccounts();
  };

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;
    const { error } = await supabase.from('musician_bank_accounts').delete().eq('id', accountId);
    if (!error) setAccounts(prev => prev.filter(a => a.id !== accountId));
  };

  const renderField = (field) => {
    if (field.type === 'select') {
      if (field.name === 'bank_code' && selectedCountry === 'NG') {
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.label} *
            </label>
            {loadingBanks ? (
              <div className="flex items-center justify-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full mr-2" />
                <span className="text-sm">Loading banks...</span>
              </div>
            ) : (
              <select
                value={formData.bank_code}
                onChange={(e) => {
                  const selectedBank = banks.find(b => b.code === e.target.value);
                  setFormData({ ...formData, bank_code: e.target.value, bank_name: selectedBank?.name || '' });
                  setResolvedName('');
                }}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
              >
                <option value="">-- Select Your Bank --</option>
                {banks.map((bank, idx) => (
                  <option key={`${bank.code}-${idx}`} value={bank.code}>{bank.name}</option>
                ))}
              </select>
            )}
          </div>
        );
      }
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {field.label} {field.required && '*'}
          </label>
          <select
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    return (
      <div key={field.name}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {field.label} {field.required && '*'}
        </label>
        <input
          type="text"
          value={formData[field.name] || ''}
          onChange={(e) => {
            let value = e.target.value;
            if (field.format) value = field.format(value);
            if (field.maxLength && value.length > field.maxLength) value = value.slice(0, field.maxLength);
            setFormData({ ...formData, [field.name]: value });
            if (field.name === 'account_number') setResolvedName('');
          }}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 font-mono"
        />
        {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      </div>
    );
  };

  const flagEmoji = { NG: '🇳🇬', GB: '🇬🇧', US: '🇺🇸', GH: '🇬🇭', KE: '🇰🇪', ZA: '🇿🇦', DE: '🇩🇪', FR: '🇫🇷', IN: '🇮🇳', AU: '🇦🇺' };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bank Accounts</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            + Add Account
          </button>
        )}
      </div>

      {/* Currency hint banner */}
      {preferredCurrency && (
        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Your rate currency is <strong>{preferredCurrency}</strong>. Add a{' '}
            <strong>{requirements.name}</strong> account to withdraw in {preferredCurrency}.
            You can also add accounts in other currencies.
          </p>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-purple-200 dark:border-purple-800">
          {/* Country selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Country / Region *
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
              >
                <option value="NG">🇳🇬 Nigeria (NGN)</option>
                <option value="GB">🇬🇧 United Kingdom (GBP)</option>
                <option value="US">🇺🇸 United States (USD)</option>
                <option value="GH">🇬🇭 Ghana (GHS)</option>
                <option value="KE">🇰🇪 Kenya (KES)</option>
                <option value="ZA">🇿🇦 South Africa (ZAR)</option>
                <option value="DE">🇩🇪 Germany / EU (EUR)</option>
                <option value="FR">🇫🇷 France / EU (EUR)</option>
                <option value="IN">🇮🇳 India (INR)</option>
                <option value="AU">🇦🇺 Australia (AUD)</option>
                <option value="DEFAULT">🌍 Other</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {requirements.name} · {requirements.currency}
            </p>
          </div>

          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Building2 className="w-5 h-5" />
            {requirements.name} Account Details
          </h3>

          <div className="space-y-4">
            {requirements.fields.map(renderField)}

            {/* Account name (non-Nigeria) */}
            {selectedCountry !== 'NG' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="Full name as it appears on account"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                />
              </div>
            )}

            {/* Nigeria verify button */}
            {selectedCountry === 'NG' && formData.account_number && formData.bank_code && (
              <button
                onClick={verifyAccountNumber}
                disabled={verifying || formData.account_number.length !== 10}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Verifying...
                  </span>
                ) : 'Verify Account'}
              </button>
            )}

            {/* Verified name */}
            {resolvedName && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <div>
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">Account Verified</p>
                    <p className="text-lg font-semibold text-green-900 dark:text-green-100">{resolvedName}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ account_number: '', bank_code: '', bank_name: '', account_name: '' });
                  setResolvedName('');
                  setError(null);
                }}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                disabled={loading || (selectedCountry === 'NG' && !resolvedName)}
                className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Adding...
                  </span>
                ) : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account list */}
      <div className="space-y-3">
        {accounts.length === 0 && !showAddForm ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No bank accounts added yet</p>
            <p className="text-sm text-gray-400 mt-1">Add an account to withdraw your funds</p>
          </div>
        ) : (
          accounts.map(account => (
            <div
              key={account.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 ${
                account.is_default
                  ? 'border-2 border-purple-500'
                  : 'border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span>{flagEmoji[account.country_code] || '🌍'}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {account.bank_name}
                    </h3>
                    {account.is_default && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                        Default
                      </span>
                    )}
                    {account.is_verified && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                        ✓ Verified
                      </span>
                    )}
                    {account.currency && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                        {account.currency}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{account.account_name}</p>
                  <p className="text-sm font-mono text-gray-500">****{account.account_number.slice(-4)}</p>
                  {account.sort_code && <p className="text-xs text-gray-400 mt-0.5">Sort: {account.sort_code}</p>}
                  {account.iban && <p className="text-xs text-gray-400 mt-0.5">IBAN: {account.iban.slice(0, 10)}…</p>}
                </div>

                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {!account.is_default && (
                    <button
                      onClick={() => handleSetDefault(account.id)}
                      className="px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg font-medium transition"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}