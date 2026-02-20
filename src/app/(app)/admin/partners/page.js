"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  Building2,
  Music,
  TrendingUp,
} from "lucide-react";

export default function AdminPartnersPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending, approved, rejected, all
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== "admin") {
      router.push("/");
      return;
    }

    if (user) {
      loadApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadApplications() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/partner-applications");
      const result = await response.json();

      if (result.success) {
        setApplications(result.data || []);
      }
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(applicationId) {
    if (!confirm("Approve this partner application?")) return;

    try {
      const response = await fetch(
        `/api/admin/partner-applications/${applicationId}/approve`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (result.success) {
        alert("Application approved!");
        loadApplications();
        setSelectedApp(null);
      } else {
        alert("Failed to approve: " + result.error);
      }
    } catch (error) {
      console.error("Error approving application:", error);
      alert("Failed to approve application");
    }
  }

  async function handleReject(applicationId, reason) {
    const rejectionReason =
      reason || prompt("Enter rejection reason (optional):");

    try {
      const response = await fetch(
        `/api/admin/partner-applications/${applicationId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      const result = await response.json();

      if (result.success) {
        alert("Application rejected");
        loadApplications();
        setSelectedApp(null);
      } else {
        alert("Failed to reject: " + result.error);
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      alert("Failed to reject application");
    }
  }

  const filteredApplications = applications
    .filter((app) => {
      if (filter !== "all" && app.status !== filter) return false;
      if (
        searchTerm &&
        !app.application_data.company_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const stats = {
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    total: applications.length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Partner Applications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage partnership applications
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-900 dark:text-yellow-300">
                  Pending
                </span>
              </div>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {stats.pending}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-900 dark:text-green-300">
                  Approved
                </span>
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.approved}
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs font-medium text-red-900 dark:text-red-300">
                  Rejected
                </span>
              </div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                {stats.rejected}
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-900 dark:text-purple-300">
                  Total
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats.total}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition capitalize ${
                  filter === f
                    ? "bg-purple-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-12 text-center">
            <Filter className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Applications Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      {app.partner_type === "venue" ? (
                        <Building2 className="w-6 h-6 text-purple-600" />
                      ) : (
                        <Music className="w-6 h-6 text-purple-600" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {app.application_data.company_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {app.partner_type.replace("_", " ")}
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Contact:
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                          {app.application_data.primary_contact_name} (
                          {app.application_data.primary_contact_email})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        app.status === "pending"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                          : app.status === "approved"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {app.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {app.application_data.venue_city && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        City
                      </span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {app.application_data.venue_city}
                      </p>
                    </div>
                  )}

                  {app.application_data.venue_capacity && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Capacity
                      </span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {app.application_data.venue_capacity} people
                      </p>
                    </div>
                  )}

                  {app.application_data.years_in_business && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Experience
                      </span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {app.application_data.years_in_business} years
                      </p>
                    </div>
                  )}

                  {app.application_data.website_url && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Website
                      </span>
                      
                        href={app.application_data.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-purple-600 hover:underline"
                      <a>
                        Visit
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => setSelectedApp(app)}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>

                  {app.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(app.id)}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>

                      <button
                        onClick={() => handleReject(app.id)}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedApp.application_data.company_name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 capitalize">
                  {selectedApp.partner_type.replace("_", " ")} Application
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Company Info */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Company Information
                </h3>
                <div className="space-y-2">
                  {Object.entries(selectedApp.application_data).map(
                    ([key, value]) => {
                      if (!value || typeof value === "object") return null;
                      return (
                        <div key={key} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {value}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </section>

              {/* Actions */}
              {selectedApp.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                  >
                    Approve Application
                  </button>
                  <button
                    onClick={() => handleReject(selectedApp.id)}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                  >
                    Reject Application
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
