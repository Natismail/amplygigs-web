//app/(app)/musician/my-events/[id]/analytics/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Download,
  ChevronLeft,
  BarChart3,
} from "lucide-react";

export default function EventAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    platformFees: 0,
    netRevenue: 0,
    ticketsSold: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && params.id) {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      // Load event
      const eventResponse = await fetch(`/api/musician-events/${params.id}`);
      const eventResult = await eventResponse.json();

      if (eventResult.success) {
        setEvent(eventResult.data);
      }

      // Load purchases
      const purchasesResponse = await fetch(
        `/api/ticket-purchases?event_id=${params.id}`
      );
      const purchasesResult = await purchasesResponse.json();

      if (purchasesResult.success) {
        const completedPurchases = purchasesResult.data.filter(
          (p) => p.payment_status === "completed"
        );
        setPurchases(completedPurchases);

        // Calculate analytics
        const totalRevenue = completedPurchases.reduce(
          (sum, p) => sum + p.total_amount,
          0
        );
        const platformFees = completedPurchases.reduce(
          (sum, p) => sum + p.platform_fee,
          0
        );
        const ticketsSold = completedPurchases.reduce(
          (sum, p) =>
            sum +
            (p.metadata?.selected_tiers?.reduce(
              (tSum, t) => tSum + t.quantity,
              0
            ) || 1),
          0
        );

        setAnalytics({
          totalRevenue,
          platformFees,
          netRevenue: totalRevenue - platformFees,
          ticketsSold,
          totalOrders: completedPurchases.length,
          averageOrderValue:
            completedPurchases.length > 0
              ? totalRevenue / completedPurchases.length
              : 0,
          conversionRate: 0, // Would need page view data
        });
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  const exportData = () => {
    // Create CSV
    const headers = [
      "Order Date",
      "Buyer Name",
      "Email",
      "Tickets",
      "Amount",
      "Status",
    ];
    const rows = purchases.map((p) => [
      new Date(p.created_at).toLocaleDateString(),
      p.guest_full_name || "User",
      p.guest_email || p.buyer?.email || "",
      p.metadata?.selected_tiers?.reduce((sum, t) => sum + t.quantity, 0) || 1,
      `₦${p.total_amount.toLocaleString()}`,
      p.payment_status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.title || "event"}-sales-report.csv`;
    a.click();
  };

  const getSalesByDay = () => {
    const salesByDay = {};
    purchases.forEach((p) => {
      const date = new Date(p.created_at).toLocaleDateString();
      salesByDay[date] = (salesByDay[date] || 0) + p.total_amount;
    });
    return Object.entries(salesByDay).map(([date, amount]) => ({
      date,
      amount,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Event Not Found
          </h2>
          <button
            onClick={() => router.push("/musician/my-events")}
            className="text-purple-600 hover:underline"
          >
            Back to My Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => router.push(`/musician/my-events/${params.id}`)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                Sales Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {event.title}
              </p>
            </div>

            <button
              onClick={exportData}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Revenue
              </span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              ₦{analytics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Gross sales
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Net Revenue
              </span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              ₦{analytics.netRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              After ₦{analytics.platformFees.toLocaleString()} platform fees
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tickets Sold
              </span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics.ticketsSold}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Across {analytics.totalOrders} orders
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Order Value
              </span>
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              ₦{Math.round(analytics.averageOrderValue).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Per transaction
            </p>
          </div>
        </div>

        {/* Sales by Tier */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Sales by Ticket Tier
          </h2>

          <div className="space-y-4">
            {event.ticket_tiers?.map((tier) => {
              const revenue = tier.quantity_sold * tier.price;
              const percentage =
                (tier.quantity_sold / tier.quantity_available) * 100;

              return (
                <div key={tier.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {tier.tier_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {tier.quantity_sold} / {tier.quantity_available} sold
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-white">
                        ₦{revenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {percentage.toFixed(0)}% capacity
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales Timeline */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Sales Over Time
          </h2>

          {getSalesByDay().length > 0 ? (
            <div className="space-y-3">
              {getSalesByDay()
                .reverse()
                .map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {day.date}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      ₦{day.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No sales data yet
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Recent Orders
          </h2>

          {purchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Buyer
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Tickets
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Revenue
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.slice(0, 20).map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {purchase.guest_full_name || "User"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {purchase.guest_email || purchase.buyer?.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {purchase.metadata?.selected_tiers?.reduce(
                          (sum, t) => sum + t.quantity,
                          0
                        ) || 1}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        ₦{purchase.total_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600 dark:text-green-400">
                        ₦
                        {(
                          purchase.total_amount - purchase.platform_fee
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No orders yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}