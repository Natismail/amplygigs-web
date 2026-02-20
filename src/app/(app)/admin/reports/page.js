"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Users,
  Music,
  Ticket,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function AdminReportsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [timeRange, setTimeRange] = useState("30days"); // 7days, 30days, 90days, all
  const [analytics, setAnalytics] = useState({
    revenue: {
      total: 0,
      growth: 0,
      platformFees: 0,
      ticketSales: 0,
    },
    users: {
      total: 0,
      growth: 0,
      musicians: 0,
      clients: 0,
      newThisMonth: 0,
    },
    events: {
      total: 0,
      growth: 0,
      clientGigs: 0,
      liveEvents: 0,
      upcoming: 0,
    },
    tickets: {
      sold: 0,
      growth: 0,
      revenue: 0,
      averagePrice: 0,
    },
    topEvents: [],
    topMusicians: [],
    revenueByMonth: [],
  });

  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, isAdmin]);

  const checkAdminAccess = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("is_admin, is_support, role")
      .eq("id", user.id)
      .single();

    if (error || (!data?.is_admin && !data?.is_support)) {
      alert("Access denied. Admin/Support privileges required.");
      router.push("/");
      return;
    }

    setIsAdmin(data.is_admin || data.role === "ADMIN");
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter(timeRange);

      // Revenue Analytics
      const { data: ticketPurchases } = await supabase
        .from("ticket_purchases")
        .select("total_amount, platform_fee, created_at")
        .eq("payment_status", "completed")
        .gte("created_at", dateFilter);

      const totalRevenue =
        ticketPurchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      const platformFees =
        ticketPurchases?.reduce((sum, p) => sum + (p.platform_fee || 0), 0) || 0;

      // User Analytics
      const { data: allUsers } = await supabase
        .from("user_profiles")
        .select("role, created_at");

      const { data: newUsers } = await supabase
        .from("user_profiles")
        .select("*")
        .gte("created_at", dateFilter);

      const totalUsers = allUsers?.length || 0;
      const musicians = allUsers?.filter((u) => u.role === "MUSICIAN").length || 0;
      const clients = allUsers?.filter((u) => u.role === "CLIENT").length || 0;

      // Event Analytics
      const { data: clientGigs } = await supabase
        .from("events")
        .select("id, created_at, event_date");

      const { data: liveEvents } = await supabase
        .from("musician_events")
        .select("id, created_at, event_date, ticket_tiers(quantity_sold, price)");

      const totalEvents = (clientGigs?.length || 0) + (liveEvents?.length || 0);
      const upcomingEvents = [
        ...(clientGigs || []),
        ...(liveEvents || []),
      ].filter((e) => new Date(e.event_date) > new Date()).length;

      // Ticket Analytics
      const totalTickets =
        liveEvents?.reduce(
          (sum, e) =>
            sum +
            (e.ticket_tiers?.reduce((tSum, t) => tSum + (t.quantity_sold || 0), 0) ||
              0),
          0
        ) || 0;

      const ticketRevenue =
        liveEvents?.reduce(
          (sum, e) =>
            sum +
            (e.ticket_tiers?.reduce(
              (tSum, t) => tSum + (t.quantity_sold || 0) * (t.price || 0),
              0
            ) || 0),
          0
        ) || 0;

      const averageTicketPrice =
        totalTickets > 0 ? ticketRevenue / totalTickets : 0;

      // Top Events (by ticket sales)
      const topEvents = liveEvents
        ?.map((e) => ({
          ...e,
          ticketsSold: e.ticket_tiers?.reduce(
            (sum, t) => sum + (t.quantity_sold || 0),
            0
          ),
        }))
        .sort((a, b) => b.ticketsSold - a.ticketsSold)
        .slice(0, 5);

      // Revenue by Month (last 6 months)
      const revenueByMonth = calculateMonthlyRevenue(ticketPurchases || []);

      setAnalytics({
        revenue: {
          total: totalRevenue,
          growth: 12.5, // Calculate actual growth
          platformFees,
          ticketSales: ticketRevenue,
        },
        users: {
          total: totalUsers,
          growth: ((newUsers?.length || 0) / totalUsers) * 100,
          musicians,
          clients,
          newThisMonth: newUsers?.length || 0,
        },
        events: {
          total: totalEvents,
          growth: 8.3, // Calculate actual growth
          clientGigs: clientGigs?.length || 0,
          liveEvents: liveEvents?.length || 0,
          upcoming: upcomingEvents,
        },
        tickets: {
          sold: totalTickets,
          growth: 15.2, // Calculate actual growth
          revenue: ticketRevenue,
          averagePrice: averageTicketPrice,
        },
        topEvents: topEvents || [],
        revenueByMonth,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilter = (range) => {
    const now = new Date();
    switch (range) {
      case "7days":
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case "30days":
        return new Date(now.setDate(now.getDate() - 30)).toISOString();
      case "90days":
        return new Date(now.setDate(now.getDate() - 90)).toISOString();
      default:
        return new Date("2020-01-01").toISOString();
    }
  };

  const calculateMonthlyRevenue = (purchases) => {
    const monthlyData = {};
    const last6Months = [];

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      monthlyData[monthKey] = 0;
      last6Months.push(monthKey);
    }

    // Calculate revenue per month
    purchases.forEach((purchase) => {
      const date = new Date(purchase.created_at);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey] += purchase.total_amount || 0;
      }
    });

    return last6Months.map((month) => ({
      month,
      revenue: monthlyData[month],
    }));
  };

  const exportReport = () => {
    const csvContent = `
Platform Analytics Report
Generated: ${new Date().toLocaleString()}
Time Range: ${timeRange}

Revenue Metrics:
Total Revenue,₦${analytics.revenue.total.toLocaleString()}
Platform Fees,₦${analytics.revenue.platformFees.toLocaleString()}
Ticket Sales,₦${analytics.revenue.ticketSales.toLocaleString()}

User Metrics:
Total Users,${analytics.users.total}
Musicians,${analytics.users.musicians}
Clients,${analytics.users.clients}
New Users (Period),${analytics.users.newThisMonth}

Event Metrics:
Total Events,${analytics.events.total}
Client Gigs,${analytics.events.clientGigs}
Live Events,${analytics.events.liveEvents}
Upcoming Events,${analytics.events.upcoming}

Ticket Metrics:
Tickets Sold,${analytics.tickets.sold}
Ticket Revenue,₦${analytics.tickets.revenue.toLocaleString()}
Average Ticket Price,₦${analytics.tickets.averagePrice.toLocaleString()}
    `.trim();

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amplygigs-report-${timeRange}-${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                Analytics & Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Platform metrics and insights
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard">
                <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ← Back to Dashboard
                </button>
              </Link>

              <button
                onClick={exportReport}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {["7days", "30days", "90days", "all"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  timeRange === range
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {range === "7days"
                  ? "Last 7 Days"
                  : range === "30days"
                  ? "Last 30 Days"
                  : range === "90days"
                  ? "Last 90 Days"
                  : "All Time"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={`₦${analytics.revenue.total.toLocaleString()}`}
            change={analytics.revenue.growth}
            icon={<DollarSign className="w-6 h-6" />}
            color="green"
          />

          <MetricCard
            title="Total Users"
            value={analytics.users.total.toLocaleString()}
            change={analytics.users.growth}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />

          <MetricCard
            title="Total Events"
            value={analytics.events.total.toLocaleString()}
            change={analytics.events.growth}
            icon={<Calendar className="w-6 h-6" />}
            color="purple"
          />

          <MetricCard
            title="Tickets Sold"
            value={analytics.tickets.sold.toLocaleString()}
            change={analytics.tickets.growth}
            icon={<Ticket className="w-6 h-6" />}
            color="orange"
          />
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Revenue Breakdown
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">
                  Platform Fees
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₦{analytics.revenue.platformFees.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">
                  Ticket Sales
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₦{analytics.revenue.ticketSales.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  Total Revenue
                </span>
                <span className="font-bold text-lg text-purple-600">
                  ₦{analytics.revenue.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              User Distribution
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Musicians
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analytics.users.musicians}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (analytics.users.musicians / analytics.users.total) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Clients
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analytics.users.clients}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (analytics.users.clients / analytics.users.total) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    New This Period
                  </span>
                  <span className="font-semibold text-green-600">
                    +{analytics.users.newThisMonth}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Revenue Trend (Last 6 Months)
          </h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.revenueByMonth.map((data, index) => {
              const maxRevenue = Math.max(
                ...analytics.revenueByMonth.map((d) => d.revenue)
              );
              const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                      ₦{(data.revenue / 1000).toFixed(0)}k
                    </span>
                    <div
                      className="w-full bg-purple-600 rounded-t-lg transition-all hover:bg-purple-700"
                      style={{ height: `${height}%`, minHeight: "20px" }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {new Date(data.month).toLocaleDateString("en", {
                      month: "short",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Events */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Top Events (By Ticket Sales)
          </h2>
          {analytics.topEvents.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No events data available
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.topEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-purple-600">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(event.event_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {event.ticketsSold} tickets
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Event Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {analytics.events.clientGigs}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Client Gigs
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {analytics.events.liveEvents}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                Live Events
              </div>
            </div>

            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {analytics.events.upcoming}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Upcoming
              </div>
            </div>

            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                ₦{analytics.tickets.averagePrice.toLocaleString()}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                Avg Ticket Price
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, change, icon, color }) {
  const colorClasses = {
    green: "bg-green-100 dark:bg-green-900/30 text-green-600",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
    orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colorClasses[color]} p-3 rounded-lg`}>{icon}</div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {change >= 0 ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
    </div>
  );
}