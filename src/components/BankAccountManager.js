// src/components/BankAccountManager.js - COMPLETE WITH BANK LIST
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function BankAccountManager({ onAccountAdded }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  
  const [formData, setFormData] = useState({
    account_number: '',
    bank_code: '',
    bank_name: '',
    account_name: '',
  });
  const [resolvedName, setResolvedName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBankAccounts();
    fetchNigerianBanks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchBankAccounts = async () => {
    const { data, error } = await supabase
      .from('musician_bank_accounts')
      .select('*')
      .eq('musician_id', user?.id)
      .order('is_default', { ascending: false });

    if (!error) {
      setAccounts(data || []);
    }
  };

  const fetchNigerianBanks = async () => {
    setLoadingBanks(true);
    try {
      const response = await fetch('/api/banks');
      const data = await response.json();
      
      if (data.success) {
        setBanks(data.banks || []);
      } else {
        console.error('Failed to fetch banks:', data.error);
        setError('Failed to load banks. Please refresh the page.');
      }
    } catch (err) {
      console.error('Failed to fetch banks:', err);
      setError('Failed to load banks. Please refresh the page.');
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
    } catch (err) {
      setError('Failed to verify account. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleAddAccount = async () => {
    if (!resolvedName) {
      setError('Please verify your account number first');
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
          account_name: resolvedName,
          bank_name: selectedBank?.name || formData.bank_name,
          bank_code: formData.bank_code,
          country_code: 'NG',
          currency: 'NGN',
          payment_provider: 'paystack',
          is_default: accounts.length === 0,
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_method: 'paystack',
          status: 'active',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setAccounts([...accounts, data]);
      setShowAddForm(false);
      setFormData({ account_number: '', bank_code: '', bank_name: '', account_name: '' });
      setResolvedName('');
      
      if (onAccountAdded) onAccountAdded(data);
    } catch (err) {
      setError(err.message || 'Failed to add bank account');
      console.error('Add account error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (accountId) => {
    try {
      // Remove default from all accounts
      await supabase
        .from('musician_bank_accounts')
        .update({ is_default: false })
        .eq('musician_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('musician_bank_accounts')
        .update({ is_default: true })
        .eq('id', accountId);

      if (!error) {
        fetchBankAccounts();
      }
    } catch (err) {
      console.error('Set default error:', err);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;

    const { error } = await supabase
      .from('musician_bank_accounts')
      .delete()
      .eq('id', accountId);

    if (!error) {
      setAccounts(accounts.filter(a => a.id !== accountId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bank Accounts</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            + Add Bank Account
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-purple-200 dark:border-purple-800">
          <h3 className="text-xl font-semibold mb-4">Add New Bank Account</h3>
          
          <div className="space-y-4">
            {/* Bank Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Bank *
              </label>
              {loadingBanks ? (
                <div className="flex items-center justify-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">Loading banks...</span>
                </div>
              ) : (
                <select
                  value={formData.bank_code}
                  onChange={(e) => {
                    const selectedBank = banks.find(b => b.code === e.target.value);
                    setFormData({ 
                      ...formData, 
                      bank_code: e.target.value,
                      bank_name: selectedBank?.name || ''
                    });
                    setResolvedName(''); // Reset verification
                  }}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                  disabled={loadingBanks}
                >
                  <option value="">-- Select Your Bank --</option>
                  {banks.map(bank => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              )}
              {banks.length === 0 && !loadingBanks && (
                <p className="text-xs text-red-600 mt-1">
                  Failed to load banks. Please refresh the page.
                </p>
              )}
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Number *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, account_number: value });
                    setResolvedName(''); // Reset verification when number changes
                  }}
                  maxLength={10}
                  placeholder="0123456789"
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 font-mono"
                />
                <button
                  onClick={verifyAccountNumber}
                  disabled={verifying || !formData.account_number || !formData.bank_code || formData.account_number.length !== 10}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {verifying ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Verifying...
                    </span>
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter your 10-digit account number
              </p>
            </div>

            {/* Verified Account Name */}
            {resolvedName && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <div>
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                      Account Verified
                    </p>
                    <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                      {resolvedName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ account_number: '', bank_code: '', bank_name: '', account_name: '' });
                  setResolvedName('');
                  setError(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                disabled={loading || !resolvedName}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Adding...
                  </span>
                ) : (
                  'Add Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account List */}
      <div className="space-y-3">
        {accounts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500">No bank accounts added yet</p>
            <p className="text-sm text-gray-400 mt-2">Add a bank account to withdraw your funds</p>
          </div>
        ) : (
          accounts.map(account => (
            <div
              key={account.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${
                account.is_default ? 'border-2 border-purple-500' : 'border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {account.bank_name}
                    </h3>
                    {account.is_default && (
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                        Default
                      </span>
                    )}
                    {account.is_verified && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded flex items-center gap-1">
                        <span>✓</span> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {account.account_name}
                  </p>
                  <p className="text-sm font-mono text-gray-500">
                    {account.account_number}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {!account.is_default && (
                    <button
                      onClick={() => handleSetDefault(account.id)}
                      className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
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


