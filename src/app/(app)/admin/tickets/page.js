"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Ticket,
  Search,
  Filter,
  RefreshCw,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";

export default function AdminTicketsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState("all"); // all, completed, pending, refunded
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    await loadPurchases();
  };

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ticket_purchases")
        .select(
          `
          *,
          event:musician_events(
            id,
            title,
            event_date,
            venue_name
          ),
          buyer:user_profiles!buyer_id(
            id,
            first_name,
            last_name,
            email
          ),
          tickets:musician_event_tickets(
            id,
            ticket_code,
            checked_in
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPurchases(data || []);
    } catch (error) {
      console.error("Error loading purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (purchaseId) => {
    const reason = prompt("Enter refund reason:");
    if (!reason) return;

    if (!confirm("Are you sure you want to process this refund?")) return;

    try {
      // Update purchase status
      await supabase
        .from("ticket_purchases")
        .update({
          payment_status: "refunded",
          refund_reason: reason,
          refunded_at: new Date().toISOString(),
          refunded_by: user.id,
        })
        .eq("id", purchaseId);

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "refund_ticket",
        target_type: "ticket_purchase",
        target_id: purchaseId,
        reason: reason,
      });

      alert("Refund processed successfully");
      loadPurchases();
      setSelectedPurchase(null);
    } catch (error) {
      console.error("Error processing refund:", error);
      alert("Failed to process refund");
    }
  };

  const filteredPurchases = purchases.filter((purchase) => {
    if (filter === "completed" && purchase.payment_status !== "completed")
      return false;
    if (filter === "pending" && purchase.payment_status !== "pending")
      return false;
    if (filter === "refunded" && purchase.payment_status !== "refunded")
      return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        purchase.event?.title?.toLowerCase().includes(search) ||
        purchase.guest_email?.toLowerCase().includes(search) ||
        purchase.buyer?.email?.toLowerCase().includes(search) ||
        purchase.id.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const stats = {
    totalPurchases: purchases.length,
    completedPurchases: purchases.filter((p) => p.payment_status === "completed")
      .length,
    pendingPurchases: purchases.filter((p) => p.payment_status === "pending")
      .length,
    refundedPurchases: purchases.filter((p) => p.payment_status === "refunded")
      .length,
    totalRevenue: purchases
      .filter((p) => p.payment_status === "completed")
      .reduce((sum, p) => sum + (p.total_amount || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading tickets...</p>
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
                <Ticket className="w-8 h-8 text-purple-600" />
                Ticket Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View sales, handle refunds, and resolve disputes
              </p>
            </div>

            <Link href="/admin/dashboard">
              <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                ← Back to Dashboard
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.totalPurchases}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Total Orders
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.completedPurchases}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                Completed
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {stats.pendingPurchases}
              </div>
              <div className="text-xs text-yellow-700 dark:text-yellow-300">
                Pending
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                {stats.refundedPurchases}
              </div>
              <div className="text-xs text-red-700 dark:text-red-300">
                Refunded
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                ₦{stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300">
                Total Revenue
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, email, or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {["all", "completed", "pending", "refunded"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition capitalize ${
                    filter === f
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Purchases List */}
        {filteredPurchases.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <Filter className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Purchases Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Order ID
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Event
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Buyer
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Tickets
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <td className="py-3 px-4 text-sm">
                        <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                          {purchase.id.substring(0, 8)}...
                        </span>
                      </td>

                      <td className="py-3 px-4 text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {purchase.event?.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(
                            purchase.event?.event_date
                          ).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {purchase.guest_full_name || "User"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {purchase.guest_email || purchase.buyer?.email}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {purchase.tickets?.length || 0}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-sm">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ₦{purchase.total_amount?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Fee: ₦{purchase.platform_fee?.toLocaleString()}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-sm">
                        {purchase.payment_status === "completed" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Completed
                          </span>
                        ) : purchase.payment_status === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                            <XCircle className="w-3 h-3" />
                            Refunded
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedPurchase(purchase)}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {purchase.payment_status === "completed" && isAdmin && (
                            <button
                              onClick={() => handleRefund(purchase.id)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                              title="Process Refund"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Purchase Detail Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Purchase Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {selectedPurchase.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Event Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Event
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedPurchase.event?.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(
                      selectedPurchase.event?.event_date
                    ).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedPurchase.event?.venue_name}
                  </p>
                </div>
              </div>

              {/* Buyer Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Buyer Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Name
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedPurchase.guest_full_name || "User"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Email
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedPurchase.guest_email ||
                        selectedPurchase.buyer?.email}
                    </span>
                  </div>
                  {selectedPurchase.guest_phone && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Phone
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedPurchase.guest_phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tickets */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Tickets ({selectedPurchase.tickets?.length})
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                  {selectedPurchase.tickets?.map((ticket, index) => (
                    <div
                      key={ticket.id}
                      className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Ticket #{index + 1}
                        </p>
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          {ticket.ticket_code}
                        </p>
                      </div>
                      {ticket.checked_in ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Checked In
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Not Used
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Payment Details
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ₦
                      {(
                        selectedPurchase.total_amount -
                        selectedPurchase.platform_fee
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Platform Fee
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ₦{selectedPurchase.platform_fee?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      Total
                    </span>
                    <span className="text-base font-bold text-gray-900 dark:text-white">
                      ₦{selectedPurchase.total_amount?.toLocaleString()}
                    </span>
                  </div>
                  {selectedPurchase.payment_reference && (
                    <div className="flex justify-between pt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Payment Reference
                      </span>
                      <span className="text-xs font-mono text-gray-900 dark:text-white">
                        {selectedPurchase.payment_reference}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedPurchase.payment_status === "completed" && isAdmin && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      handleRefund(selectedPurchase.id);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Process Refund
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}