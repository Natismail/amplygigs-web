// src/app/(app)/admin/dashboard/page.js - OPTIMIZED VERSION
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, Calendar, DollarSign, TrendingUp, 
  CheckCircle, Clock, AlertCircle, Wallet,
  Music, UserCheck, Crown
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupport, setIsSupport] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    checkAdminAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_admin, is_support, role')
      .eq('id', user.id)
      .single();

    if (error || (!data?.is_admin && !data?.is_support)) {
      alert('Access denied. Admin/Support privileges required.');
      router.push('/');
      return;
    }

    setIsAdmin(data.is_admin || data.role === 'ADMIN');
    setIsSupport(data.is_support);
    await Promise.all([fetchStats(), fetchRecentActivity()]);
  };

  const fetchStats = async () => {
    try {
      // Users
      const { data: users } = await supabase
        .from('user_profiles')
        .select('role');

      const totalUsers = users?.length || 0;
      const totalMusicians = users?.filter(u => u.role === 'MUSICIAN').length || 0;
      const totalClients = users?.filter(u => u.role === 'CLIENT').length || 0;
      const totalAdmins = users?.filter(u => u.role === 'ADMIN' || u.is_admin).length || 0;

      // Bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, amount');

      const totalBookings = bookings?.length || 0;
      const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
      const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;

      // Financials
      const { data: escrow } = await supabase
        .from('escrow_transactions')
        .select('gross_amount, platform_fee, status');

      const totalRevenue = escrow?.reduce((sum, e) => sum + parseFloat(e.gross_amount || 0), 0) || 0;
      const heldEscrow = escrow
        ?.filter(e => e.status === 'held')
        ?.reduce((sum, e) => sum + parseFloat(e.gross_amount || 0), 0) || 0;
      const platformFees = escrow?.reduce((sum, e) => sum + parseFloat(e.platform_fee || 0), 0) || 0;

      // Withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount, status');

      const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending').length || 0;
      const pendingWithdrawalAmount = withdrawals
        ?.filter(w => w.status === 'pending')
        ?.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0) || 0;

      // Verifications
      const { data: verifications } = await supabase
        .from('musician_verifications')
        .select('status')
        .in('status', ['pending', 'under_review']);

      const pendingVerifications = verifications?.length || 0;

      setStats({
        totalUsers,
        totalMusicians,
        totalClients,
        totalAdmins,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        totalRevenue,
        heldEscrow,
        platformFees,
        pendingWithdrawals,
        pendingWithdrawalAmount,
        pendingVerifications
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from('admin_actions')
        .select(`
          *,
          admin:admin_id(first_name, last_name),
          target_user:target_user_id(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            {isAdmin ? <Crown className="w-8 h-8" /> : <UserCheck className="w-8 h-8" />}
            <h1 className="text-3xl font-bold">
              {isAdmin ? 'Admin Dashboard' : 'Support Dashboard'}
            </h1>
          </div>
          <p className="text-purple-100">
            {isAdmin 
              ? 'Full system management and oversight' 
              : 'Support ticket and verification management'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Main Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              subtitle={`${stats.totalMusicians} musicians, ${stats.totalClients} clients`}
              icon={<Users className="w-6 h-6" />}
              color="blue"
              href="/admin/users"
            />

            <StatCard
              title="Pending Verifications"
              value={stats.pendingVerifications}
              subtitle="Requires review"
              icon={<CheckCircle className="w-6 h-6" />}
              color="yellow"
              href="/admin/verifications"
              badge={stats.pendingVerifications > 0}
            />

            <StatCard
              title="Total Bookings"
              value={stats.totalBookings}
              subtitle={`${stats.pendingBookings} pending`}
              icon={<Calendar className="w-6 h-6" />}
              color="purple"
              href="/admin/bookings"
            />

            <StatCard
              title="Total Revenue"
              value={`₦${stats.totalRevenue.toLocaleString()}`}
              subtitle={`₦${stats.platformFees.toLocaleString()} in fees`}
              icon={<DollarSign className="w-6 h-6" />}
              color="green"
              href="/admin/payments"
            />

            <StatCard
              title="Escrow Held"
              value={`₦${stats.heldEscrow.toLocaleString()}`}
              subtitle="In escrow protection"
              icon={<Wallet className="w-6 h-6" />}
              color="orange"
            />

            <StatCard
              title="Pending Withdrawals"
              value={stats.pendingWithdrawals}
              subtitle={`₦${stats.pendingWithdrawalAmount.toLocaleString()}`}
              icon={<Clock className="w-6 h-6" />}
              color="red"
              badge={stats.pendingWithdrawals > 0}
            />

            <StatCard
              title="Confirmed Bookings"
              value={stats.confirmedBookings}
              subtitle="Active bookings"
              icon={<TrendingUp className="w-6 h-6" />}
              color="indigo"
            />

            <StatCard
              title="Completed Gigs"
              value={stats.completedBookings}
              subtitle="Successful events"
              icon={<CheckCircle className="w-6 h-6" />}
              color="green"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <ActionCard
            title="Manage Users"
            description="View and manage all platform users"
            icon="👥"
            href="/admin/users"
            color="blue"
          />

          <ActionCard
            title="Verifications"
            description="Review KYC submissions"
            icon="✅"
            href="/admin/verifications"
            color="purple"
            badge={stats?.pendingVerifications}
          />

          <ActionCard
            title="Bookings"
            description="Monitor all bookings"
            icon="📅"
            href="/admin/bookings"
            color="green"
          />

          <ActionCard
            title="Payments"
            description="Financial transactions"
            icon="💰"
            href="/admin/payments"
            color="yellow"
          />

          <ActionCard
            title="Support Tickets"
            description="Handle user issues"
            icon="🎫"
            href="/admin/tickets"
            color="red"
          />

          {isAdmin && (
            <ActionCard
              title="Platform Settings"
              description="System configuration"
              icon="⚙️"
              href="/admin/settings"
              color="gray"
            />
          )}
        </div>

        {/* Recent Admin Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Admin Actions
          </h2>
          
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 10).map((action) => (
                <div 
                  key={action.id}
                  className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.admin?.first_name} {action.admin?.last_name}
                      <span className="text-gray-500 dark:text-gray-400 mx-2">•</span>
                      <span className="text-purple-600 dark:text-purple-400">
                        {action.action_type.replace(/_/g, ' ')}
                      </span>
                    </p>
                    {action.target_user && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Target: {action.target_user.first_name} {action.target_user.last_name}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(action.created_at).toLocaleString()}
                    </p>
                  </div>
                  <ActionTypeBadge type={action.action_type} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Components
function StatCard({ title, value, subtitle, icon, color, href, badge }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    indigo: 'bg-indigo-500'
  };

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className={`${colorClasses[color]} p-3 rounded-lg text-white`}>
          {icon}
        </div>
        {badge && (
          <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
            !
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {subtitle}
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer">
          {content}
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {content}
    </div>
  );
}

function ActionCard({ title, description, icon, href, color, badge }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
    gray: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
  };

  return (
    <Link href={href}>
      <div className={`relative bg-gradient-to-r ${colorClasses[color]} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer`}>
        {badge > 0 && (
          <span className="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
            {badge}
          </span>
        )}
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </Link>
  );
}

function ActionTypeBadge({ type }) {
  const getColor = (type) => {
    if (type.includes('approve') || type.includes('grant')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (type.includes('reject') || type.includes('revoke') || type.includes('suspend') || type.includes('ban')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    if (type.includes('cancel')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColor(type)}`}>
      {type.replace(/_/g, ' ')}
    </span>
  );
}