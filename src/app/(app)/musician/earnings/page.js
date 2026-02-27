//src/app/(app)/musician/earnings/page.js

"use client"

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import WithdrawalRequest from '@/components/WithdrawalRequest';
import BankAccountManager from '@/components/BankAccountManager';
import { formatCurrency, getCurrencyByCode } from "@/components/CurrencySelector";




export default function MusicianEarningsPage() {
  const { user, loading: authLoading, session } = useAuth();

  const [wallet, setWallet] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  /* =======================
     FETCH WALLET
  ======================= */
  const fetchWalletData = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch("/api/earnings", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      setWallet({
        available_balance: data.available || 0,
        ledger_balance: data.ledger || 0,
        total_earnings: data.totalEarnings || 0,
        currency: data.currency || "NGN",
      });
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    }
  }, [session]);

  /* =======================
     FETCH WITHDRAWALS
  ======================= */
  const fetchWithdrawals = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("withdrawals")
      .select("*, bank_accounts(*)")
      .eq("musician_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error) setWithdrawals(data || []);
  }, [user]);

  /* =======================
     FETCH TRANSACTIONS
  ======================= */
  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("musician_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error) setTransactions(data || []);
  }, [user]);

  /* =======================
     INITIAL LOAD
  ======================= */
  useEffect(() => {
    if (!user || authLoading) return;

    setLoading(true);

    Promise.all([
      fetchWalletData(),
      fetchWithdrawals(),
      fetchTransactions(),
    ]).finally(() => setLoading(false));
  }, [
    user,
    authLoading,
    fetchWalletData,
    fetchWithdrawals,
    fetchTransactions,
  ]);


  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'successful':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-lg">Please log in to view your earnings.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">My Earnings</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-100 text-sm font-medium">Available Balance</p>
            <span className="text-2xl">💵</span>
          </div>
          <p className="text-4xl font-bold">{formatCurrency(wallet?.available_balance || 0, wallet?.currency || 'NGN')}</p>
          <p className="text-green-100 text-xs mt-2">Ready to withdraw</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-yellow-100 text-sm font-medium">Ledger Balance</p>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-4xl font-bold">{formatCurrency(wallet?.ledger_balance || 0, wallet?.currency || 'NGN')}</p>
          <p className="text-yellow-100 text-xs mt-2">Pending event completion</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-100 text-sm font-medium">Total Earnings</p>
            <span className="text-2xl">🎵</span>
          </div>
          <p className="text-4xl font-bold">{formatCurrency(wallet?.total_earnings || 0, wallet?.currency || 'NGN')}</p>
          <p className="text-purple-100 text-xs mt-2">All-time earnings</p>
        </div>
      </div>

      {/* Withdraw Button */}
      <div className="mb-8">
        <WithdrawalRequest 
          wallet={wallet} 
          onWithdrawalSuccess={() => {
            fetchWalletData();
            fetchWithdrawals();
            fetchTransactions();
          }}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 font-medium text-sm border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`pb-4 px-2 font-medium text-sm border-b-2 transition ${
              activeTab === 'withdrawals'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Withdrawals
          </button>
          <button
            onClick={() => setActiveTab('banks')}
            className={`pb-4 px-2 font-medium text-sm border-b-2 transition ${
              activeTab === 'banks'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Bank Accounts
          </button>
        </nav>
      </div>

      {/* Transactions Tab */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">
                        {tx.transaction_type === 'payment' ? '💰' : 
                         tx.transaction_type === 'escrow_release' ? '✅' :
                         tx.transaction_type === 'withdrawal' ? '🏦' : '📝'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {tx.description || tx.transaction_type}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        tx.transaction_type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
                      }`}>
{tx.transaction_type === 'withdrawal' ? '-' : '+'}
{formatCurrency(tx.net_amount, wallet?.currency || 'NGN')}                      </p>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(tx.payment_status)}`}>
                        {tx.payment_status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No withdrawals yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {withdrawals.map((wd) => (
                <div key={wd.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Withdrawal to {wd.bank_accounts?.bank_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {wd.bank_accounts?.account_number} - {wd.bank_accounts?.account_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(wd.requested_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900 dark:text-white">
                        {/* ₦{wd.net_amount.toLocaleString()} */}
                        {formatCurrency(wd.net_amount || 0, wd?.currency || 'NGN')}

                      </p>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(wd.status)}`}>
                        {wd.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bank Accounts Tab */}
      {activeTab === 'banks' && (
        <BankAccountManager onAccountAdded={fetchWalletData} />
      )}
    </div>
  );
}


// // app/musician/earnings/page.js
// import MusicianWallet from '@/components/MusicianWallet';

// export default function MusicianEarningsPage() {
//   return <MusicianWallet />;
// }



