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
  
  const [formData, setFormData] = useState({
    account_number: '',
    bank_code: '',
    bank_name: '',
  });
  const [resolvedName, setResolvedName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBankAccounts();
    fetchNigerianBanks();
  }, [user]);

  const fetchBankAccounts = async () => {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('musician_id', user?.id)
      .order('is_primary', { ascending: false });

    if (!error) {
      setAccounts(data || []);
    }
  };

  const fetchNigerianBanks = async () => {
    try {
      const response = await fetch('/api/banks');
      const data = await response.json();
      setBanks(data.banks || []);
    } catch (err) {
      console.error('Failed to fetch banks:', err);
    }
  };

  const verifyAccountNumber = async () => {
    if (!formData.account_number || !formData.bank_code) {
      setError('Please enter account number and select a bank');
      return;
    }

    setVerifying(true);
    setError(null);
    setResolvedName('');

    try {
      const response = await fetch('/api/verify-account', {
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
        .from('bank_accounts')
        .insert({
          musician_id: user.id,
          account_number: formData.account_number,
          account_name: resolvedName,
          bank_name: selectedBank?.name || formData.bank_name,
          bank_code: formData.bank_code,
          is_primary: accounts.length === 0,
          is_verified: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setAccounts([...accounts, data]);
      setShowAddForm(false);
      setFormData({ account_number: '', bank_code: '', bank_name: '' });
      setResolvedName('');
      
      if (onAccountAdded) onAccountAdded(data);
    } catch (err) {
      setError(err.message || 'Failed to add bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (accountId) => {
    const { error } = await supabase
      .from('bank_accounts')
      .update({ is_primary: true })
      .eq('id', accountId);

    if (!error) {
      fetchBankAccounts();
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;

    const { error } = await supabase
      .from('bank_accounts')
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Bank
              </label>
              <select
                value={formData.bank_code}
                onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
              >
                <option value="">-- Select Bank --</option>
                {banks.map(bank => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => {
                    setFormData({ ...formData, account_number: e.target.value });
                    setResolvedName('');
                  }}
                  maxLength={10}
                  placeholder="0123456789"
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                />
                <button
                  onClick={verifyAccountNumber}
                  disabled={verifying || !formData.account_number || !formData.bank_code}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>

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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ account_number: '', bank_code: '', bank_name: '' });
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
                {loading ? 'Adding...' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                account.is_primary ? 'border-2 border-purple-500' : 'border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {account.bank_name}
                    </h3>
                    {account.is_primary && (
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                        Primary
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
                  {!account.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(account.id)}
                      className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                    >
                      Set as Primary
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