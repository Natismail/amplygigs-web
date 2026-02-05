// src/app/(app)/admin/finances/page.js - NEW FINANCIAL REPORTS PAGE
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

export default function AdminFinancesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dateRange, setDateRange] = useState('7days');

  useEffect(() => {
    checkAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user) loadFinancialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  async function checkAccess() {
    if (!user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('user_profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single();

    if (!data?.is_admin && data?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    await loadFinancialData();
  }

  async function loadFinancialData() {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      if (dateRange === '7days') startDate.setDate(now.getDate() - 7);
      else if (dateRange === '30days') startDate.setDate(now.getDate() - 30);
      else if (dateRange === '90days') startDate.setDate(now.getDate() - 90);

      // Get escrow data
      const { data: escrow } = await supabase
        .from('escrow_transactions')
        .select('*')
        .gte('created_at', startDate.toISOString());

      // Get withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('*')
        .gte('created_at', startDate.toISOString());

      // Calculate stats
      const totalRevenue = escrow?.reduce((sum, e) => sum + parseFloat(e.gross_amount || 0), 0) || 0;
      const platformFees = escrow?.reduce((sum, e) => sum + parseFloat(e.platform_fee || 0), 0) || 0;
      const heldEscrow = escrow?.filter(e => e.status === 'held')
        .reduce((sum, e) => sum + parseFloat(e.gross_amount || 0), 0) || 0;
      const releasedFunds = escrow?.filter(e => e.status === 'released')
        .reduce((sum, e) => sum + parseFloat(e.gross_amount || 0), 0) || 0;
      
      const completedWithdrawals = withdrawals?.filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0) || 0;
      const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0) || 0;

      setStats({
        totalRevenue,
        platformFees,
        heldEscrow,
        releasedFunds,
        completedWithdrawals,
        pendingWithdrawals,
        netProfit: platformFees - completedWithdrawals
      });

      // Get recent transactions
      const { data: recent } = await supabase
        .from('escrow_transactions')
        .select(`
          *,
          booking:booking_id(
            event_type,
            client:client_id(first_name, last_name),
            musician:musician_id(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      setRecentTransactions(recent || []);

    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <DollarSign className="w-8 h-8" />
            Financial Reports
          </h1>
          <p className="text-green-100">Platform revenue and transaction analytics</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Date Range Filter */}
        <div className="mb-6 flex gap-2">
          {[
            { value: '7days', label: 'Last 7 Days' },
            { value: '30days', label: 'Last 30 Days' },
            { value: '90days', label: 'Last 90 Days' },
            { value: 'all', label: 'All Time' }
          ].map(range => (
            <button
              key={range.value}
              onClick={() => setDateRange(range.value)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                dateRange === range.value
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`₦${stats?.totalRevenue.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="green"
            trend="+12.5%"
          />
          <StatCard
            title="Platform Fees"
            value={`₦${stats?.platformFees.toLocaleString()}`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="blue"
            trend="+8.2%"
          />
          <StatCard
            title="Escrow Held"
            value={`₦${stats?.heldEscrow.toLocaleString()}`}
            icon={<Wallet className="w-6 h-6" />}
            color="orange"
          />
          <StatCard
            title="Net Profit"
            value={`₦${stats?.netProfit.toLocaleString()}`}
            icon={<ArrowUpRight className="w-6 h-6" />}
            color="purple"
            trend="+15.3%"
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            label="Released Funds"
            value={`₦${stats?.releasedFunds.toLocaleString()}`}
            icon={<ArrowUpRight className="w-5 h-5 text-green-600" />}
          />
          <MetricCard
            label="Completed Withdrawals"
            value={`₦${stats?.completedWithdrawals.toLocaleString()}`}
            icon={<ArrowDownRight className="w-5 h-5 text-blue-600" />}
          />
          <MetricCard
            label="Pending Withdrawals"
            value={`₦${stats?.pendingWithdrawals.toLocaleString()}`}
            icon={<Calendar className="w-5 h-5 text-yellow-600" />}
          />
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Transactions
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Musician</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Fee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {tx.booking?.event_type || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {tx.booking?.client?.first_name} {tx.booking?.client?.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {tx.booking?.musician?.first_name} {tx.booking?.musician?.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      ₦{parseFloat(tx.gross_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ₦{parseFloat(tx.platform_fee).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        tx.status === 'held' ? 'bg-yellow-100 text-yellow-800' :
                        tx.status === 'released' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, trend }) {
  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colors[color]} p-3 rounded-lg text-white`}>
          {icon}
        </div>
        {trend && (
          <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {title}
      </p>
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}