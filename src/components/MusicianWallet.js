// src/components/MusicianWallet.js

"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function MusicianWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.role === 'MUSICIAN') {
      fetchWalletData();
      fetchTransactions();
    }
  }, [user]);

  const fetchWalletData = async () => {
    const { data, error } = await supabase
      .from('musician_wallets')
      .select('*')
      .eq('musician_id', user.id)
      .single();

    if (!error && data) {
      setWallet(data);
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, bookings(event)')
      .eq('musician_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setTransactions(data);
    }
  };

  const formatCurrency = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'payment':
        return '💰';
      case 'escrow_release':
        return '✅';
      case 'withdrawal':
        return '🏦';
      default:
        return '📝';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'successful':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Wallet
        </h1>
        <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
          Withdraw Funds
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-100 text-sm font-medium">Available Balance</p>
            <span className="text-2xl">💵</span>
          </div>
          <p className="text-3xl font-bold">
            {formatCurrency(wallet?.available_balance || 0, wallet?.currency)}
          </p>
          <p className="text-green-100 text-xs mt-2">Ready to withdraw</p>
        </div>

        {/* Ledger Balance (Escrow) */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-yellow-100 text-sm font-medium">Ledger Balance</p>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-3xl font-bold">
            {formatCurrency(wallet?.ledger_balance || 0, wallet?.currency)}
          </p>
          <p className="text-yellow-100 text-xs mt-2">Pending event completion</p>
        </div>

        {/* Total Earnings */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-100 text-sm font-medium">Total Earnings</p>
            <span className="text-2xl">🎵</span>
          </div>
          <p className="text-3xl font-bold">
            {formatCurrency(wallet?.total_earnings || 0, wallet?.currency)}
          </p>
          <p className="text-purple-100 text-xs mt-2">All-time earnings</p>
        </div>
      </div>

      {/* Explanation Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              How Your Wallet Works
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>
                <strong>Ledger Balance:</strong> Funds held in escrow until the client confirms event completion
              </li>
              <li>
                <strong>Available Balance:</strong> Funds released and ready for withdrawal to your bank account
              </li>
              <li>
                <strong>Platform Fee:</strong> 10% is deducted from all payments
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 font-medium text-sm border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Recent Transactions
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-4 px-2 font-medium text-sm border-b-2 transition ${
              activeTab === 'pending'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Release
          </button>
        </nav>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{getTransactionIcon(tx.transaction_type)}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {tx.description || tx.transaction_type}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900 dark:text-white">
                      {formatCurrency(tx.net_amount, tx.currency)}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                        tx.payment_status
                      )}`}
                    >
                      {tx.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}