import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function WithdrawalRequest({ wallet, onWithdrawalSuccess }) {
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const WITHDRAWAL_FEE = 50; // ₦50 flat fee
  const MIN_WITHDRAWAL = 1000; // Minimum ₦1,000

  useEffect(() => {
    fetchBankAccounts();
  }, [user]);

  const fetchBankAccounts = async () => {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('musician_id', user?.id)
      .order('is_primary', { ascending: false });

    if (!error && data) {
      setBankAccounts(data);
      // Auto-select primary account
      const primary = data.find(acc => acc.is_primary);
      if (primary) setSelectedAccount(primary.id);
    }
  };

  const calculateNetAmount = () => {
    const amountNum = parseFloat(amount) || 0;
    return Math.max(0, amountNum - WITHDRAWAL_FEE);
  };

  const handleWithdrawal = async () => {
    setLoading(true);
    setError(null);

    const amountNum = parseFloat(amount);

    // Validation
    if (!selectedAccount) {
      setError('Please select a bank account');
      setLoading(false);
      return;
    }

    if (amountNum < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is ₦${MIN_WITHDRAWAL.toLocaleString()}`);
      setLoading(false);
      return;
    }

    if (amountNum > wallet.available_balance) {
      setError('Insufficient available balance');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          bank_account_id: selectedAccount,
          musician_id: user.id,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowModal(false);
        setAmount('');
        if (onWithdrawalSuccess) onWithdrawalSuccess(result.data);
      } else {
        setError(result.error || 'Withdrawal failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Withdrawal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedBankAccount = bankAccounts.find(acc => acc.id === selectedAccount);

  if (bankAccounts.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              No Bank Account Added
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
              Please add a bank account before you can withdraw funds.
            </p>
            <button
              onClick={() => window.location.href = '/musician/settings/bank-accounts'}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm"
            >
              Add Bank Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={wallet.available_balance < MIN_WITHDRAWAL}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        💰 Withdraw Funds
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Withdraw Funds
            </h2>

            <div className="space-y-4">
              {/* Available Balance */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200 mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  ₦{wallet.available_balance.toLocaleString()}
                </p>
              </div>

              {/* Bank Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Withdraw to:
                </label>
                <select
                  value={selectedAccount || ''}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700"
                >
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} - {account.account_number} ({account.account_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount to Withdraw
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min={MIN_WITHDRAWAL}
                    max={wallet.available_balance}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700"
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Min: ₦{MIN_WITHDRAWAL.toLocaleString()}</span>
                  <button
                    onClick={() => setAmount(wallet.available_balance.toString())}
                    className="text-green-600 hover:underline"
                  >
                    Max: ₦{wallet.available_balance.toLocaleString()}
                  </button>
                </div>
              </div>

              {/* Fee Breakdown */}
              {amount && parseFloat(amount) >= MIN_WITHDRAWAL && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Withdrawal Amount:</span>
                    <span className="font-medium">₦{parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Processing Fee:</span>
                    <span className="font-medium text-red-600">-₦{WITHDRAWAL_FEE}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">You'll Receive:</span>
                      <span className="font-bold text-green-600">₦{calculateNetAmount().toLocaleString()}</span>
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

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  ℹ️ Withdrawals are typically processed within 24 hours on business days.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setAmount('');
                    setError(null);
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdrawal}
                  disabled={loading || !amount || parseFloat(amount) < MIN_WITHDRAWAL}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Processing...
                    </span>
                  ) : (
                    'Confirm Withdrawal'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}