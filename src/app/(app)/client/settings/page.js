// src/app/(app)/client/settings/page.js
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/context/AuthContext";
import { supabase } from '@/lib/supabaseClient';
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import ProfileSyncButton from "@/components/ProfileSyncButton";
import NotificationPreferences from "@/components/settings/NotificationPreferences";
import { User, Mail, Phone, MapPin, RefreshCw, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Bell } from "lucide-react";

export default function ClientSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [error, setError] = useState(null);

  // Check if user might need OAuth sync
  const needsSync = user?.first_name === 'User' || 
                    !user?.first_name || 
                    !user?.last_name ||
                    (!user?.profile_picture_url && user?.email?.includes('@gmail.com'));

  useEffect(() => {
    if (user && activeTab === 'wallet') {
      fetchWalletData();
      fetchTransactions();
    }
  }, [user, activeTab]);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_client_wallet_balance', { p_client_id: user.id });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setWallet(data[0]);
      } else {
        // Create wallet if doesn't exist
        await supabase.from('client_wallets').insert({ client_id: user.id });
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
  }, [user]);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Account Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your profile, wallet, and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-4 pt-6 px-2 font-medium text-sm border-b-2 transition ${
                  activeTab === 'profile'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`pb-4 pt-6 px-2 font-medium text-sm border-b-2 transition flex items-center gap-2 ${
                  activeTab === 'wallet'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Wallet className="w-4 h-4" />
                Wallet
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`pb-4 pt-6 px-2 font-medium text-sm border-b-2 transition flex items-center gap-2 ${
                  activeTab === 'notifications'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Bell className="w-4 h-4" />
                Notifications
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* OAuth Sync Section */}
                {needsSync && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                          Sync Your Profile
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          It looks like you signed in with Google or Facebook. Click below to sync your 
                          name and profile picture from your account.
                        </p>
                        <ProfileSyncButton 
                          onSyncComplete={() => window.location.reload()}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Picture */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Profile Picture
                  </h2>
                  <ProfilePictureUpload />
                </div>

                {/* Personal Information */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Personal Information
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <User className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Mail className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {user.phone && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <Phone className="w-5 h-5 text-purple-600" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {user.phone}
                          </p>
                        </div>
                      </div>
                    )}

                    {user.location && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {user.location}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Type */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Account Type
                  </h2>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Client Account</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Book musicians for your events
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WALLET TAB */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <>
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
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Recent Transactions
                      </h3>
                      
                      {transactions.length === 0 ? (
                        <div className="p-12 text-center bg-gray-50 dark:bg-gray-900 rounded-xl">
                          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500">No transactions yet</p>
                          <p className="text-sm text-gray-400 mt-1">Add funds to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {transactions.map((txn) => (
                            <div key={txn.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center">
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
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* NOTIFICATIONS TAB - NEW! */}
            {activeTab === 'notifications' && (
              <NotificationPreferences />
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
    </div>
  );
}