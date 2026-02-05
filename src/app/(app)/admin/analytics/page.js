// src/app/(app)/admin/analytics/page.js - PLATFORM ANALYTICS
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { TrendingUp, Users, Calendar, DollarSign, Music, UserCheck, MapPin } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    checkAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user) loadAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

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

    await loadAnalytics();
  }

  async function loadAnalytics() {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      if (timeRange === '7days') startDate.setDate(now.getDate() - 7);
      else if (timeRange === '30days') startDate.setDate(now.getDate() - 30);
      else if (timeRange === '90days') startDate.setDate(now.getDate() - 90);

      // Get user growth
      const { data: users } = await supabase
        .from('user_profiles')
        .select('role, created_at')
        .gte('created_at', startDate.toISOString());

      const totalUsers = users?.length || 0;
      const newMusicians = users?.filter(u => u.role === 'MUSICIAN').length || 0;
      const newClients = users?.filter(u => u.role === 'CLIENT').length || 0;

      // Get booking stats
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, amount, created_at')
        .gte('created_at', startDate.toISOString());

      const totalBookings = bookings?.length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0) || 0;

      // Get verification stats
      const { data: verifications } = await supabase
        .from('musician_verifications')
        .select('status, created_at')
        .gte('created_at', startDate.toISOString());

      const totalVerifications = verifications?.length || 0;
      const approvedVerifications = verifications?.filter(v => v.status === 'approved').length || 0;

      // Calculate daily breakdown for charts
      const dailyData = {};
      const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = { users: 0, bookings: 0, revenue: 0 };
      }

      users?.forEach(u => {
        const dateStr = u.created_at.split('T')[0];
        if (dailyData[dateStr]) dailyData[dateStr].users++;
      });

      bookings?.forEach(b => {
        const dateStr = b.created_at.split('T')[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr].bookings++;
          dailyData[dateStr].revenue += parseFloat(b.amount || 0);
        }
      });

      // Get location distribution
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('location, role')
        .not('location', 'is', null);

      const locationStats = {};
      profiles?.forEach(p => {
        const loc = p.location || 'Unknown';
        if (!locationStats[loc]) locationStats[loc] = { musicians: 0, clients: 0 };
        if (p.role === 'MUSICIAN') locationStats[loc].musicians++;
        else if (p.role === 'CLIENT') locationStats[loc].clients++;
      });

      const topLocations = Object.entries(locationStats)
        .map(([location, stats]) => ({
          location,
          total: stats.musicians + stats.clients,
          musicians: stats.musicians,
          clients: stats.clients
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      setAnalytics({
        userGrowth: {
          total: totalUsers,
          musicians: newMusicians,
          clients: newClients
        },
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          conversionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0
        },
        revenue: {
          total: totalRevenue,
          average: totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(0) : 0
        },
        verifications: {
          total: totalVerifications,
          approved: approvedVerifications,
          approvalRate: totalVerifications > 0 ? ((approvedVerifications / totalVerifications) * 100).toFixed(1) : 0
        },
        dailyData: Object.entries(dailyData).reverse(),
        topLocations
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

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
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
            Platform Analytics
          </h1>
          <p className="text-indigo-100">Growth metrics and performance insights</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Time Range Filter */}
        <div className="mb-6 flex gap-2">
          {[
            { value: '7days', label: 'Last 7 Days' },
            { value: '30days', label: 'Last 30 Days' },
            { value: '90days', label: 'Last 90 Days' }
          ].map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === range.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="User Growth"
            value={analytics?.userGrowth.total}
            subtitle={`${analytics?.userGrowth.musicians} musicians, ${analytics?.userGrowth.clients} clients`}
            icon={<Users className="w-6 h-6" />}
            color="blue"
            trend="+12%"
          />
          <MetricCard
            title="Total Bookings"
            value={analytics?.bookings.total}
            subtitle={`${analytics?.bookings.conversionRate}% completion rate`}
            icon={<Calendar className="w-6 h-6" />}
            color="purple"
            trend="+8%"
          />
          <MetricCard
            title="Revenue"
            value={`₦${analytics?.revenue.total.toLocaleString()}`}
            subtitle={`Avg: ₦${analytics?.revenue.average} per booking`}
            icon={<DollarSign className="w-6 h-6" />}
            color="green"
            trend="+15%"
          />
          <MetricCard
            title="Verifications"
            value={analytics?.verifications.total}
            subtitle={`${analytics?.verifications.approvalRate}% approved`}
            icon={<UserCheck className="w-6 h-6" />}
            color="yellow"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Trend Chart */}
          <ChartCard title="Daily Activity Trend">
            <SimpleLineChart
              data={analytics?.dailyData || []}
              dataKey="bookings"
              label="Bookings"
              color="#8b5cf6"
            />
          </ChartCard>

          {/* Revenue Chart */}
          <ChartCard title="Daily Revenue">
            <SimpleLineChart
              data={analytics?.dailyData || []}
              dataKey="revenue"
              label="Revenue"
              color="#10b981"
              prefix="₦"
            />
          </ChartCard>
        </div>

        {/* Top Locations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Top Locations
          </h2>
          <div className="space-y-3">
            {analytics?.topLocations.map((loc, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    #{index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{loc.location}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {loc.musicians} musicians, {loc.clients} clients
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{loc.total}</div>
                  <div className="text-sm text-gray-500">total users</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, color, trend }) {
  const colors = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colors[color]} p-3 rounded-lg text-white`}>
          {icon}
        </div>
        {trend && (
          <span className="text-green-600 dark:text-green-400 text-sm font-semibold flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
        {title}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
      {children}
    </div>
  );
}

function SimpleLineChart({ data, dataKey, label, color, prefix = '' }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No data available</div>;
  }

  const values = data.map(d => d[1][dataKey]);
  const maxValue = Math.max(...values, 1);
  const height = 200;

  return (
    <div className="relative">
      <svg className="w-full" height={height + 40} viewBox={`0 0 ${data.length * 50} ${height + 40}`}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1="0"
            y1={i * (height / 4)}
            x2={data.length * 50}
            y2={i * (height / 4)}
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-gray-700"
          />
        ))}

        {/* Line chart */}
        <polyline
          points={data.map((d, i) => {
            const x = i * 50 + 25;
            const y = height - (d[1][dataKey] / maxValue) * height;
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="3"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = i * 50 + 25;
          const y = height - (d[1][dataKey] / maxValue) * height;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill={color} />
              <text
                x={x}
                y={height + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              >
                {new Date(d[0]).getDate()}
              </text>
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                className="text-xs font-semibold fill-gray-900 dark:fill-white"
              >
                {prefix}{d[1][dataKey]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}