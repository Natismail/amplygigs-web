// src/components/ClientWallet.js
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

export default function ClientWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchTransactions();
    }
  }, [user]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_client_wallet_balance', { p_client_id: user.id });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setWallet(data[0]);
      } else {
        // Create wallet if doesn't exist
        await supabase
          .from('client_wallets')
          .insert({ client_id: user.id })
          .select()
          .single();
        
        // Fetch again
        const { data: newData } = await supabase
          .rpc('get_client_wallet_balance', { p_client_id: user.id });
        if (newData && newData.length > 0) {
          setWallet(newData[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('client_wallet_transactions')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error) {
      setTransactions(data || []);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    
    if (!amount || amount < 100) {
      setError('Minimum deposit is ₦100');
      return;
    }

    if (amount > 1000000) {
      setError('Maximum deposit is ₦1,000,000');
      return;
    }

    setDepositing(true);
    setError(null);

    try {
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          email: user.email,
          clientId: user.id,
          countryCode: user.country_code || 'NG'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Redirect to payment page
        window.location.href = result.paymentLink;
      } else {
        setError(result.error || 'Failed to initialize payment');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Deposit error:', err);
    } finally {
      setDepositing(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'payment':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      case 'refund':
        return <RefreshCw className="w-5 h-5 text-blue-600" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-600" />;
    }
  };

  const currencySymbol = wallet?.currency === 'NGN' ? '₦' : '$';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-purple-100 text-sm">Wallet Balance</p>
              <p className="text-3xl font-bold">
                {currencySymbol}{wallet?.balance?.toLocaleString() || '0.00'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDepositModal(true)}
            className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Funds
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-purple-400/30">
          <div>
            <p className="text-purple-100 text-xs mb-1">Total Funded</p>
            <p className="font-semibold">{currencySymbol}{wallet?.total_funded?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-purple-100 text-xs mb-1">Total Spent</p>
            <p className="font-semibold">{currencySymbol}{wallet?.total_spent?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-purple-100 text-xs mb-1">In Escrow</p>
            <p className="font-semibold">{currencySymbol}{wallet?.pending_payments?.toLocaleString() || '0'}</p>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              About Your Wallet
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Fund your wallet to pay for musician bookings instantly</li>
              <li>• Refunds from cancelled bookings return to your wallet</li>
              <li>• Use wallet balance for future bookings</li>
              <li>• Secure and instant payments</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-1">Add funds to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((txn) => (
              <div key={txn.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      {getTransactionIcon(txn.transaction_type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {txn.transaction_type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(txn.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      txn.transaction_type === 'payment' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {txn.transaction_type === 'payment' ? '-' : '+'}
                      {currencySymbol}{txn.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Balance: {currencySymbol}{txn.balance_after.toLocaleString()}
                    </p>
                  </div>
                </div>
                {txn.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-13">
                    {txn.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add Funds to Wallet
              </h2>
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  setDepositAmount('');
                  setError(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Current Balance */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {currencySymbol}{wallet?.balance?.toLocaleString() || '0.00'}
                </p>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount to Add
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="100"
                    max="1000000"
                    className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Min: {currencySymbol}100</span>
                  <span>Max: {currencySymbol}1,000,000</span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[1000, 5000, 10000, 20000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDepositAmount(amount.toString())}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition"
                  >
                    {currencySymbol}{(amount / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Payment Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium mb-1">💳 Payment Methods:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Debit/Credit Card</li>
                  <li>• Bank Transfer</li>
                  <li>• USSD</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDepositModal(false);
                    setDepositAmount('');
                    setError(null);
                  }}
                  disabled={depositing}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={depositing || !depositAmount}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {depositing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Processing...
                    </span>
                  ) : (
                    'Continue to Payment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}