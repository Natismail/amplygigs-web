// src/app/(app)/musician/settings/bank-accounts/page.js - COMPLETE FIX
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { CreditCard, Plus, Trash2, Building2, User as UserIcon, Hash, CheckCircle, AlertCircle } from "lucide-react";

export default function BankAccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    bank_name: "",
    account_number: "",
    account_name: "",
  });

  useEffect(() => {
    if (!user) return;
    fetchAccounts();
  }, [user]);

  // ⭐ FIXED: Use correct table name and column
  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("musician_bank_accounts")  // ✅ Changed from bank_accounts
      .select("*")
      .eq("musician_id", user.id)  // ✅ Changed from user_id
      .order("created_at", { ascending: false });
    
    if (!error) {
      setAccounts(data || []);
    } else {
      console.error('Fetch accounts error:', error);
    }
    setLoading(false);
  };

  // ⭐ FIXED: Complete rewrite with proper error handling
  const addAccount = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Validation
      if (!form.bank_name?.trim() || !form.account_number?.trim() || !form.account_name?.trim()) {
        throw new Error('All fields are required');
      }

      if (form.account_number.length < 10) {
        throw new Error('Account number must be at least 10 digits');
      }

      console.log('💾 Adding bank account for user:', user.id);

      // ⭐ FIXED: Use correct table name and include all required fields
      const { data, error: insertError } = await supabase
        .from("musician_bank_accounts")  // ✅ Changed from bank_accounts
        .insert({
          musician_id: user.id,  // ✅ Changed from user_id
          bank_name: form.bank_name.trim(),
          account_number: form.account_number.trim(),
          account_name: form.account_name.trim(),
          country_code: 'NG',  // ✅ Required field
          currency: 'NGN',  // ✅ Required field
          payment_provider: 'manual',  // ✅ Required field
          is_default: accounts.length === 0,  // ✅ First account is default
          is_verified: false,
          status: 'active',
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw new Error(insertError.message || 'Failed to add account');
      }

      console.log('✅ Bank account added:', data);

      setSuccess('Bank account added successfully!');
      setForm({ bank_name: "", account_number: "", account_name: "" });
      setShowForm(false);
      fetchAccounts();
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('❌ Add account error:', err);
      setError(err.message || 'Failed to add bank account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ⭐ FIXED: Use correct table name
  const deleteAccount = async (id) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;
    
    setDeleting(id);
    const { error } = await supabase
      .from("musician_bank_accounts")  // ✅ Changed from bank_accounts
      .delete()
      .eq("id", id);
    
    if (!error) {
      setAccounts(accounts.filter(acc => acc.id !== id));
      setSuccess('Bank account deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      console.error('Delete error:', error);
      setError('Failed to delete account');
    }
    setDeleting(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Bank Accounts
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Manage your payout bank accounts for receiving payments
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Existing Accounts */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : accounts.length === 0 && !showForm ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 sm:p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No bank accounts yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Add a bank account to receive payments from your bookings
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Your First Bank Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Bank Name */}
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                      {acc.bank_name}
                    </h3>
                    {acc.is_default && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                        Default
                      </span>
                    )}
                  </div>

                  {/* Account Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">Account Name:</span>
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {acc.account_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">Account Number:</span>
                      <span className="font-mono font-medium text-gray-900 dark:text-white">
                        ****{acc.account_number.slice(-4)}
                      </span>
                    </div>
                  </div>

                  {/* Added Date */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Added {new Date(acc.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => deleteAccount(acc.id)}
                  disabled={deleting === acc.id}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                  title="Delete account"
                >
                  {deleting === acc.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Add Another Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 rounded-xl text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Bank Account
            </button>
          )}
        </div>
      )}

      {/* Add Account Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-purple-300 dark:border-purple-700 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Add Bank Account
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setForm({ bank_name: "", account_number: "", account_name: "" });
                setError('');
              }}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <form onSubmit={addAccount} className="space-y-4">
            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bank Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g., Opay, Kuda, GTBank"
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Holder Name *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Full name on the account"
                  value={form.account_name}
                  onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Number *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter account number"
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value.replace(/\D/g, '') })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  minLength="10"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Your account number will be encrypted and securely stored
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Account
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm({ bank_name: "", account_number: "", account_name: "" });
                  setError('');
                }}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Secure & Encrypted
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Your bank account information is encrypted and stored securely. We use industry-standard security measures to protect your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}