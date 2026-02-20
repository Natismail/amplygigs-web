//app/(app)/musician/my-events/[id]/page.js

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Edit,
  Share2,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
} from "lucide-react";

export default function EventDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && params.id) {
      loadEventData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id]);

  async function loadEventData() {
    setLoading(true);
    try {
      // Load event details
      const eventResponse = await fetch(`/api/musician-events/${params.id}`);
      const eventResult = await eventResponse.json();

      if (eventResult.success) {
        setEvent(eventResult.data);
      }

      // Load ticket purchases
      const purchasesResponse = await fetch(
        `/api/ticket-purchases?event_id=${params.id}`
      );
      const purchasesResult = await purchasesResponse.json();

      if (purchasesResult.success) {
        setPurchases(purchasesResult.data || []);
      }
    } catch (error) {
      console.error("Error loading event data:", error);
    } finally {
      setLoading(false);
    }
  }

  const getTotalRevenue = () => {
    return purchases
      .filter((p) => p.payment_status === "completed")
      .reduce((sum, p) => sum + (p.total_amount - p.platform_fee), 0);
  };

  const getTotalTicketsSold = () => {
    if (!event?.ticket_tiers) return 0;
    return event.ticket_tiers.reduce((sum, tier) => sum + tier.quantity_sold, 0);
  };

  const getCompletedPurchases = () => {
    return purchases.filter((p) => p.payment_status === "completed").length;
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
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => router.push("/musician/my-events")}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                >
                  ← Back
                </button>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    event.status === "published"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                  }`}
                >
                  {event.status.toUpperCase()}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.event_date).toLocaleDateString("en-NG", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {event.venue_name}, {event.city}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {event.status === "published" && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/live-events/${event.id}`
                    );
                    alert("Event link copied!");
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Event
                </button>
              )}
              <button
                onClick={() => router.push(`/musician/my-events/${event.id}/edit`)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => window.open(`/live-events/${event.id}`, "_blank")}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Revenue
              </span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              ₦{getTotalRevenue().toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              After platform fees
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tickets Sold
              </span>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {getTotalTicketsSold()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {event.remaining_capacity} remaining
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Orders
              </span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {getCompletedPurchases()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Completed purchases
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Capacity
              </span>
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {Math.round(
                (getTotalTicketsSold() / (event.total_capacity || 1)) * 100
              )}
              %
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Venue capacity filled
            </p>
          </div>
        </div>

        {/* Ticket Tiers */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Ticket Tiers Performance
          </h2>
          <div className="space-y-4">
            {event.ticket_tiers?.map((tier) => {
              const soldPercentage =
                (tier.quantity_sold / tier.quantity_available) * 100;
              const revenue = tier.quantity_sold * tier.price;

              return (
                <div
                  key={tier.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {tier.tier_name}
                      </h3>
                      {tier.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {tier.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-white">
                        ₦{tier.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        per ticket
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Sold
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {tier.quantity_sold} / {tier.quantity_available}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Revenue
                      </div>
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        ₦{revenue.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Progress
                      </div>
                      <div className="font-semibold text-purple-600 dark:text-purple-400">
                        {soldPercentage.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${soldPercentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Purchases
            </h2>
            <button
              onClick={() => router.push(`/musician/my-events/${event.id}/analytics`)}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              View All Analytics →
            </button>
          </div>

          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Purchases Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Purchases will appear here when people buy tickets
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Buyer
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Tickets
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.slice(0, 10).map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {purchase.guest_full_name || "User"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {purchase.guest_email || purchase.buyer?.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {purchase.metadata?.selected_tiers?.reduce(
                          (sum, t) => sum + t.quantity,
                          0
                        ) || 1}{" "}
                        ticket(s)
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        ₦{purchase.total_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {purchase.payment_status === "completed" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Completed
                          </span>
                        ) : purchase.payment_status === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                            <XCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}