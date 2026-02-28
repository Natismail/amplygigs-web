// src/app/(app)/musician/earnings/page.js
// Earnings display currency follows the musician's rate_currency from their profile.
// Withdrawal form shows the correct bank account type based on that currency.
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import WithdrawalRequest from '@/components/WithdrawalRequest';
import BankAccountManager from '@/components/BankAccountManager';
import { formatCurrency } from "@/components/CurrencySelector";

// ── Currency symbol helper ─────────────────
const CURRENCY_SYMBOLS = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  GHS: '₵',
  KES: 'KSh',
  ZAR: 'R',
};

function getCurrencySymbol(code) {
  return CURRENCY_SYMBOLS[code?.toUpperCase()] || code || '₦';
}

// ── Transaction type labels ────────────────
const TX_ICONS = {
  payment: '💰',
  escrow_release: '✅',
  withdrawal: '🏦',
  refund: '↩️',
  default: '📝',
};

function getTxIcon(type) {
  return TX_ICONS[type] || TX_ICONS.default;
}

function getStatusColor(status) {
  switch (status) {
    case 'completed':
    case 'successful': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'processing':
    case 'pending':    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'failed':     return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:           return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
}

// ── Currency notice banner ─────────────────
function CurrencyNoticeBanner({ rateCurrency, walletCurrency }) {
  if (!rateCurrency || rateCurrency === walletCurrency) return null;

  return (
    <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">💡</span>
        <div>
          <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
            Currency Note
          </p>
          <p className="text-amber-700 dark:text-amber-400 text-sm mt-0.5">
            Your hourly rate is set in <strong>{rateCurrency}</strong> but your wallet balance is stored in <strong>{walletCurrency}</strong>.
            Earnings are displayed in your rate currency. When withdrawing, provide a <strong>{rateCurrency} bank/account</strong> for {rateCurrency} withdrawals.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function MusicianEarningsPage() {
  const { user, loading: authLoading, session } = useAuth();

  const [wallet, setWallet] = useState(null);
  const [profile, setProfile] = useState(null); // musician profile (has rate_currency)
  const [withdrawals, setWithdrawals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // ── Determine display currency ─────────────
  // Priority: profile.rate_currency → wallet.currency → 'NGN'
  const displayCurrency = profile?.rate_currency || wallet?.currency || 'NGN';

  // ── Fetch musician profile (for rate_currency) ──
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('rate_currency, hourly_rate, primary_role, display_name')
        .eq('id', user.id)
        .single();
      setProfile(data || null);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, [user]);

  // ── Fetch wallet ───────────────────────────
  const fetchWalletData = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const response = await fetch('/api/earnings', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setWallet({
        available_balance: data.available || 0,
        ledger_balance: data.ledger || 0,
        total_earnings: data.totalEarnings || 0,
        currency: data.currency || 'NGN',
      });
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    }
  }, [session]);

  // ── Fetch withdrawals ──────────────────────
  const fetchWithdrawals = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*, bank_accounts(*)')
      .eq('musician_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (!error) setWithdrawals(data || []);
  }, [user]);

  // ── Fetch transactions ─────────────────────
  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('musician_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error) setTransactions(data || []);
  }, [user]);

  // ── Initial load ───────────────────────────
  useEffect(() => {
    if (!user || authLoading) return;
    setLoading(true);
    Promise.all([
      fetchProfile(),
      fetchWalletData(),
      fetchWithdrawals(),
      fetchTransactions(),
    ]).finally(() => setLoading(false));
  }, [user, authLoading, fetchProfile, fetchWalletData, fetchWithdrawals, fetchTransactions]);

  const handleRefresh = () => {
    fetchWalletData();
    fetchWithdrawals();
    fetchTransactions();
  };

  // ── Loading / auth guards ──────────────────
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
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

  // ── Render ─────────────────────────────────
  return (
    <div className="container mx-auto p-4 max-w-6xl pb-16">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Earnings</h1>
        {profile?.hourly_rate && (
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Your rate: <span className="font-semibold text-purple-600 dark:text-purple-400">
              {getCurrencySymbol(displayCurrency)}{Number(profile.hourly_rate).toLocaleString()}/hr
            </span>
            {' '}· Displaying in <strong>{displayCurrency}</strong>
          </p>
        )}
      </div>

      {/* Currency mismatch notice */}
      <CurrencyNoticeBanner
        rateCurrency={profile?.rate_currency}
        walletCurrency={wallet?.currency}
      />

      {/* ── Balance cards ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-100 text-sm font-medium">Available Balance</p>
            <span className="text-2xl">💵</span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold">
            {formatCurrency(wallet?.available_balance || 0, displayCurrency)}
          </p>
          <p className="text-green-100 text-xs mt-2">Ready to withdraw</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-yellow-100 text-sm font-medium">Ledger Balance</p>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold">
            {formatCurrency(wallet?.ledger_balance || 0, displayCurrency)}
          </p>
          <p className="text-yellow-100 text-xs mt-2">Pending event completion</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-100 text-sm font-medium">Total Earnings</p>
            <span className="text-2xl">🎵</span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold">
            {formatCurrency(wallet?.total_earnings || 0, displayCurrency)}
          </p>
          <p className="text-purple-100 text-xs mt-2">All-time earnings</p>
        </div>
      </div>

      {/* ── Withdrawal section ───────────────── */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🏦</span>
          <h2 className="font-bold text-gray-900 dark:text-white">Withdraw Funds</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {displayCurrency === 'NGN'
            ? 'Provide a Naira bank account for withdrawal.'
            : displayCurrency === 'USD'
            ? 'Provide a USD / domiciliary account for withdrawal.'
            : displayCurrency === 'GBP'
            ? 'Provide a GBP / UK bank account for withdrawal.'
            : `Provide a ${displayCurrency} account for withdrawal.`}
        </p>
        <WithdrawalRequest
          wallet={{ ...wallet, currency: displayCurrency }}
          preferredCurrency={displayCurrency}
          onWithdrawalSuccess={handleRefresh}
        />
      </div>

      {/* ── Tabs ────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Transactions' },
            { id: 'withdrawals', label: 'Withdrawals' },
            { id: 'banks', label: 'Bank Accounts' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`pb-4 px-2 font-medium text-sm border-b-2 transition ${
                activeTab === id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Transactions Tab ─────────────────── */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.map((tx) => {
                // Show tx currency if available, fall back to displayCurrency
                const txCurrency = tx.currency || displayCurrency;
                const isDebit = tx.transaction_type === 'withdrawal';

                return (
                  <div key={tx.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{getTxIcon(tx.transaction_type)}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {tx.description || tx.transaction_type?.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(tx.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-base ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                          {isDebit ? '-' : '+'}{formatCurrency(tx.net_amount || tx.amount || 0, txCurrency)}
                        </p>
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${getStatusColor(tx.payment_status)}`}>
                          {tx.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Withdrawals Tab ──────────────────── */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {withdrawals.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🏦</p>
              <p className="text-gray-500 dark:text-gray-400">No withdrawals yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {withdrawals.map((wd) => {
                const wdCurrency = wd.currency || displayCurrency;
                return (
                  <div key={wd.id} className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          To {wd.bank_accounts?.bank_name || 'Bank'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {wd.bank_accounts?.account_number} · {wd.bank_accounts?.account_name}
                        </p>
                        {/* Show account type/currency */}
                        {wd.bank_accounts?.currency && (
                          <span className="inline-block mt-1 text-[11px] px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                            {wd.bank_accounts.currency} account
                          </span>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(wd.requested_at || wd.created_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {formatCurrency(wd.net_amount || 0, wdCurrency)}
                        </p>
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${getStatusColor(wd.status)}`}>
                          {wd.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Bank Accounts Tab ────────────────── */}
      {activeTab === 'banks' && (
        <BankAccountManager
          onAccountAdded={fetchWalletData}
          preferredCurrency={displayCurrency}
        />
      )}
    </div>
  );
}


// // app/musician/earnings/page.js
// import MusicianWallet from '@/components/MusicianWallet';

// export default function MusicianEarningsPage() {
//   return <MusicianWallet />;
// }



