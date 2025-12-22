// src/app/admin/payments/page.js
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, CreditCard, Calendar } from 'lucide-react';

export default function PaymentsManagement() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    checkAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user) fetchPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const checkAccess = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_admin, is_support')
      .eq('id', user.id)
      .single();

    if (error || (!data?.is_admin && !data?.is_support)) {
      alert('Access denied. Admin/Support privileges required.');
      router.push('/');
      return;
    }

    fetchPayments();
    fetchStats();
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('amount, status');

      if (!error && data) {
        const totalRevenue = data.reduce((sum, p) => sum + (p.amount || 0), 0);
        const paidRevenue = data
          .filter(p => p.status === 'PAID')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        const pendingRevenue = data
          .filter(p => p.status === 'PENDING')
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        setStats({
          totalRevenue,
          paidRevenue,
          pendingRevenue,
          totalTransactions: data.length,
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          booking:booking_id(
            event_type,
            event_date,
            client:client_id(first_name, last_name, email),
            musician:musician_id(first_name, last_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (!error && data) {
        setPayments(data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">💰 Payments Management</h1>
          <p className="text-green-100">Track and manage all platform transactions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Revenue Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
              <DollarSign className="w-8 h-8 mb-2" />
              <div className="text-2xl font-bold mb-1">
                ₦{stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm opacity-90">Total Revenue</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
              <TrendingUp className="w-8 h-8 mb-2" />
              <div className="text-2xl font-bold mb-1">
                ₦{stats.paidRevenue.toLocaleString()}
              </div>
              <div className="text-sm opacity-90">Paid Out</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-6 shadow-lg">
              <CreditCard className="w-8 h-8 mb-2" />
              <div className="text-2xl font-bold mb-1">
                ₦{stats.pendingRevenue.toLocaleString()}
              </div>
              <div className="text-sm opacity-90">Pending</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
              <Calendar className="w-8 h-8 mb-2" />
              <div className="text-2xl font-bold mb-1">
                {stats.totalTransactions}
              </div>
              <div className="text-sm opacity-90">Transactions</div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['ALL', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                statusFilter === status
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Payments List */}
        {payments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">No payments found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter === 'ALL' ? 'No payment transactions yet' : `No ${statusFilter.toLowerCase()} payments`}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Transaction
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Musician
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {payment.booking?.event_type || 'Unknown Event'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {payment.payment_method || 'N/A'}
                          </div>
                          {payment.reference && (
                            <div className="text-xs text-gray-400">
                              Ref: {payment.reference}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-900 dark:text-white">
                          {payment.booking?.client?.first_name} {payment.booking?.client?.last_name}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {payment.booking?.client?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-900 dark:text-white">
                          {payment.booking?.musician?.first_name} {payment.booking?.musician?.last_name}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {payment.booking?.musician?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-green-600 dark:text-green-400">
                          ₦{payment.amount?.toLocaleString()}
                        </div>
                        {payment.platform_fee && (
                          <div className="text-xs text-gray-500">
                            Fee: ₦{payment.platform_fee.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(payment.created_at).toLocaleDateString()}
                        <div className="text-xs">
                          {new Date(payment.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    REFUNDED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}


