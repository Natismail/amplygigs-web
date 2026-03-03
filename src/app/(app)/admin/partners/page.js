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
  ExternalLink,
  ChevronDown,
  MapPin,
  Users,
  Briefcase,
  Globe,
  Mail,
  User,
} from "lucide-react";

const STATUS_CONFIG = {
  pending:  { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", dot: "bg-yellow-500" },
  approved: { bg: "bg-green-100 dark:bg-green-900/30",  text: "text-green-700 dark:text-green-300",   dot: "bg-green-500"  },
  rejected: { bg: "bg-red-100 dark:bg-red-900/30",      text: "text-red-700 dark:text-red-300",       dot: "bg-red-500"    },
};

const FILTERS = ["all", "pending", "approved", "rejected"];

export default function AdminPartnersPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // holds id of app being actioned

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/");
      return;
    }
    if (user) loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadApplications() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partner-applications");
      const result = await res.json();
      if (result.success) setApplications(result.data || []);
    } catch (err) {
      console.error("Error loading applications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(applicationId) {
    if (!confirm("Approve this partner application?")) return;
    setActionLoading(applicationId);
    try {
      const res = await fetch(`/api/admin/partner-applications/${applicationId}/approve`, {
        method: "POST",
      });
      const result = await res.json();
      if (result.success) {
        await loadApplications();
        setSelectedApp(null);
      } else {
        alert("Failed to approve: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to approve application");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(applicationId) {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return; // user cancelled prompt
    setActionLoading(applicationId);
    try {
      const res = await fetch(`/api/admin/partner-applications/${applicationId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const result = await res.json();
      if (result.success) {
        await loadApplications();
        setSelectedApp(null);
      } else {
        alert("Failed to reject: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to reject application");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = applications
    .filter((app) => {
      if (filter !== "all" && app.status !== filter) return false;
      if (searchTerm) {
        const name = app.application_data?.company_name?.toLowerCase() ?? "";
        const contact = app.application_data?.primary_contact_name?.toLowerCase() ?? "";
        const term = searchTerm.toLowerCase();
        if (!name.includes(term) && !contact.includes(term)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const stats = {
    pending:  applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    total:    applications.length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partner Applications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and manage incoming partnership requests
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {[
              { label: "Pending",  value: stats.pending,  icon: Clock,       color: "yellow" },
              { label: "Approved", value: stats.approved, icon: CheckCircle, color: "green"  },
              { label: "Rejected", value: stats.rejected, icon: XCircle,     color: "red"    },
              { label: "Total",    value: stats.total,    icon: TrendingUp,   color: "purple" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 text-${color}-600`} />
                  <span className={`text-xs font-semibold text-${color}-700 dark:text-${color}-300`}>{label}</span>
                </div>
                <p className={`text-2xl font-bold text-${color}-900 dark:text-${color}-100`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company or contact name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                  filter === f
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {f}
                {f !== "all" && (
                  <span className={`ml-1 ${filter === f ? "opacity-75" : "opacity-50"}`}>
                    ({stats[f] ?? 0})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── List ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-14 text-center">
            <Filter className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No applications match your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                actionLoading={actionLoading}
                onView={() => setSelectedApp(app)}
                onApprove={() => handleApprove(app.id)}
                onReject={() => handleReject(app.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selectedApp && (
        <DetailModal
          app={selectedApp}
          actionLoading={actionLoading}
          onClose={() => setSelectedApp(null)}
          onApprove={() => handleApprove(selectedApp.id)}
          onReject={() => handleReject(selectedApp.id)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Application Card                            */
/* ─────────────────────────────────────────── */
function ApplicationCard({ app, actionLoading, onView, onApprove, onReject }) {
  const d = app.application_data ?? {};
  const sc = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
  const isLoading = actionLoading === app.id;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Icon + info */}
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-11 h-11 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            {app.partner_type === "venue"
              ? <Building2 className="w-5 h-5 text-purple-600" />
              : <Music className="w-5 h-5 text-purple-600" />}
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {d.company_name ?? "Unnamed Company"}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {app.partner_type?.replace("_", " ")}
              </span>
              {d.venue_city && (
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin className="w-3 h-3" />{d.venue_city}
                </span>
              )}
              {d.primary_contact_name && (
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <User className="w-3 h-3" />{d.primary_contact_name}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {new Date(app.created_at).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <span className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
        </span>
      </div>

      {/* Quick metadata */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        {d.venue_capacity && (
          <MetaItem icon={Users} label="Capacity" value={`${Number(d.venue_capacity).toLocaleString()} people`} />
        )}
        {d.years_in_business && (
          <MetaItem icon={Briefcase} label="Experience" value={`${d.years_in_business} yrs`} />
        )}
        {d.primary_contact_email && (
          <MetaItem icon={Mail} label="Email" value={d.primary_contact_email} />
        )}
        {d.website_url && (
          <a
            href={d.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Globe className="w-3.5 h-3.5" />
            Website
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onView}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <Eye className="w-3.5 h-3.5" />
          View Details
        </button>

        {app.status === "pending" && (
          <>
            <button
              onClick={onApprove}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-60"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {isLoading ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={onReject}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-60"
            >
              <XCircle className="w-3.5 h-3.5" />
              {isLoading ? "Processing..." : "Reject"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Detail Modal                                */
/* ─────────────────────────────────────────── */
function DetailModal({ app, actionLoading, onClose, onApprove, onReject }) {
  const d = app.application_data ?? {};
  const sc = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
  const isLoading = actionLoading === app.id;

  const fields = Object.entries(d).filter(
    ([, v]) => v !== null && v !== undefined && v !== "" && typeof v !== "object"
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-start justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {d.company_name ?? "Application Details"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mt-0.5">
              {app.partner_type?.replace("_", " ")} · Applied {new Date(app.created_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric"
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 space-y-5">
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Application Details
            </h3>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {fields.map(([key, value], i) => (
                <div
                  key={key}
                  className={`flex justify-between gap-4 px-4 py-2.5 text-sm ${
                    i % 2 === 0
                      ? "bg-gray-50 dark:bg-gray-800/50"
                      : "bg-white dark:bg-gray-900"
                  }`}
                >
                  <span className="text-gray-500 dark:text-gray-400 capitalize flex-shrink-0">
                    {key.replace(/_/g, " ")}
                  </span>
                  {key === "website_url" ? (
                    <a
                      href={String(value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      {String(value)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="font-medium text-gray-900 dark:text-white text-right">
                      {String(value)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Modal footer */}
        {app.status === "pending" && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex gap-3 rounded-b-2xl">
            <button
              onClick={onApprove}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition disabled:opacity-60"
            >
              <CheckCircle className="w-4 h-4" />
              {isLoading ? "Processing..." : "Approve Application"}
            </button>
            <button
              onClick={onReject}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition disabled:opacity-60"
            >
              <XCircle className="w-4 h-4" />
              {isLoading ? "Processing..." : "Reject Application"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Small helper                                */
/* ─────────────────────────────────────────── */
function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="text-gray-400">{label}:</span>
      <span className="font-medium text-gray-700 dark:text-gray-300">{value}</span>
    </div>
  );
}