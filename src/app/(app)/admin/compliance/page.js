"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Flag,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Shield,
} from "lucide-react";

export default function AdminCompliancePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState("pending"); // pending, reviewed, all
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

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
    await loadReports();
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_reports")
        .select(
          `
          *,
          reporter:user_profiles!reporter_id(
            id,
            first_name,
            last_name,
            email
          ),
          reported_user:user_profiles!reported_user_id(
            id,
            first_name,
            last_name,
            email,
            role,
            is_suspended
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReports(data || []);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewReport = async (reportId, action) => {
    try {
      const updates = {
        status: action === "dismiss" ? "dismissed" : "actioned",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      };

      await supabase.from("user_reports").update(updates).eq("id", reportId);

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: `report_${action}`,
        target_type: "user_report",
        target_id: reportId,
        reason: `Report ${action}ed by admin`,
      });

      alert(`Report ${action}ed successfully`);
      loadReports();
      setSelectedReport(null);
    } catch (error) {
      console.error("Error reviewing report:", error);
      alert("Failed to review report");
    }
  };

  const handleSuspendUser = async (userId, reportId) => {
    const reason = prompt("Enter suspension reason:");
    if (!reason) return;

    if (!confirm("Are you sure you want to suspend this user?")) return;

    try {
      // Suspend user
      await supabase
        .from("user_profiles")
        .update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          suspended_by: user.id,
          suspension_reason: reason,
        })
        .eq("id", userId);

      // Update report
      await supabase
        .from("user_reports")
        .update({
          status: "actioned",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "suspend_user",
        target_type: "user_profile",
        target_id: userId,
        reason: reason,
      });

      alert("User suspended successfully");
      loadReports();
      setSelectedReport(null);
    } catch (error) {
      console.error("Error suspending user:", error);
      alert("Failed to suspend user");
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filter === "pending" && report.status !== "pending") return false;
    if (filter === "reviewed" && report.status === "pending") return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        report.reporter?.email?.toLowerCase().includes(search) ||
        report.reported_user?.email?.toLowerCase().includes(search) ||
        report.reason?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const stats = {
    totalReports: reports.length,
    pendingReports: reports.filter((r) => r.status === "pending").length,
    actionedReports: reports.filter((r) => r.status === "actioned").length,
    dismissedReports: reports.filter((r) => r.status === "dismissed").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading compliance data...
          </p>
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
                <Shield className="w-8 h-8 text-purple-600" />
                Compliance & Moderation
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Review reports and manage violations
              </p>
            </div>

            <Link href="/admin/dashboard">
              <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                ← Back to Dashboard
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalReports}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Total Reports
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {stats.pendingReports}
              </div>
              <div className="text-xs text-yellow-700 dark:text-yellow-300">
                Pending Review
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.actionedReports}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                Actioned
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.dismissedReports}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Dismissed
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
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {["all", "pending", "reviewed"].map((f) => (
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

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Reports Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No reports match your current filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Flag className="w-6 h-6 text-red-600" />
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {report.report_type?.replace("_", " ").toUpperCase() ||
                            "General Report"}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-full ${
                            report.status === "pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                              : report.status === "actioned"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {report.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Reporter
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.reporter?.first_name}{" "}
                            {report.reporter?.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {report.reporter?.email}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Reported User
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.reported_user?.first_name}{" "}
                            {report.reported_user?.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {report.reported_user?.email}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Date
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            User Status
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.reported_user?.is_suspended ? (
                              <span className="text-red-600">Suspended</span>
                            ) : (
                              <span className="text-green-600">Active</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Reason: </span>
                          {report.reason || "No reason provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    {report.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleReviewReport(report.id, "dismiss")}
                          className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                          title="Dismiss"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>

                        {isAdmin && !report.reported_user?.is_suspended && (
                          <button
                            onClick={() =>
                              handleSuspendUser(
                                report.reported_user_id,
                                report.id
                              )
                            }
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            title="Suspend User"
                          >
                            <Ban className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Report Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {selectedReport.id.substring(0, 8)}...
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Report Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Report Type
                </h3>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedReport.report_type?.replace("_", " ").toUpperCase() ||
                    "General Report"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Reason
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-900 dark:text-white">
                    {selectedReport.reason || "No reason provided"}
                  </p>
                </div>
              </div>

              {/* Reporter Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Reporter
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedReport.reporter?.first_name}{" "}
                    {selectedReport.reporter?.last_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedReport.reporter?.email}
                  </p>
                </div>
              </div>

              {/* Reported User Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Reported User
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedReport.reported_user?.first_name}{" "}
                        {selectedReport.reported_user?.last_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedReport.reported_user?.email}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        Role: {selectedReport.reported_user?.role}
                      </p>
                    </div>
                    {selectedReport.reported_user?.is_suspended && (
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded-full">
                        SUSPENDED
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedReport.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      handleReviewReport(selectedReport.id, "dismiss");
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
                  >
                    Dismiss Report
                  </button>

                  {isAdmin && !selectedReport.reported_user?.is_suspended && (
                    <button
                      onClick={() =>
                        handleSuspendUser(
                          selectedReport.reported_user_id,
                          selectedReport.id
                        )
                      }
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      Suspend User
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}