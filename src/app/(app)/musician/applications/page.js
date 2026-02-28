// src/app/(app)/musician/applications/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/components/CurrencySelector";
import Link from "next/link";
import {
  Briefcase, MapPin, DollarSign, Calendar, Clock,
  CheckCircle, XCircle, Star, Loader, Search,
  Building2, ExternalLink, ChevronRight, FileText,
  Mic, Trophy, AlertCircle, ArrowLeft,
} from "lucide-react";

// ── Status config ─────────────────────────────────────────────────────────
const STATUS = {
  pending:     { label: "Under Review",  color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",  dot: "bg-yellow-400", icon: Clock },
  shortlisted: { label: "Shortlisted",   color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",          dot: "bg-blue-400",   icon: Star },
  interviewed: { label: "Interviewed",   color: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",  dot: "bg-purple-400", icon: Mic },
  offered:     { label: "Offered! 🎉",  color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",       dot: "bg-green-400",  icon: Trophy },
  rejected:    { label: "Not Selected",  color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",              dot: "bg-red-400",    icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Application card ──────────────────────────────────────────────────────
function ApplicationCard({ application }) {
  const router = useRouter();
  const job = application.job;
  const isOffer = application.status === "offered";
  const isDeadlinePassed = job?.application_deadline && new Date(job.application_deadline) < new Date();

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition hover:shadow-md cursor-pointer
        ${isOffer
          ? "border-green-300 dark:border-green-700 shadow-green-100 dark:shadow-green-900/20 shadow-md"
          : "border-gray-200 dark:border-gray-700"
        }`}
      onClick={() => router.push(`/jobs/${job?.id}`)}
    >
      {/* Offer banner */}
      {isOffer && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-white text-sm font-bold flex items-center gap-2">
          <Trophy className="w-4 h-4" /> You received an offer for this position!
        </div>
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                job?.job_type === "audition"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              }`}>
                {job?.job_type === "audition" ? "🎤 Audition" : "💼 Job"}
              </span>
              {isDeadlinePassed && application.status === "pending" && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500">
                  Deadline passed
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug truncate">
              {job?.title || "Job Posting"}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{job?.organization_name || "Organization"}</span>
            </div>
          </div>
          <StatusBadge status={application.status} />
        </div>

        {/* Job details */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
          {job?.city && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{job.city}, {job.state}</span>
            </div>
          )}
          {job?.salary_min && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatCurrency(job.salary_min, job.currency || "NGN")}+</span>
            </div>
          )}
          {job?.employment_type && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="capitalize">{job.employment_type.replace("_", " ")}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Applied {new Date(application.applied_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Cover letter preview */}
        {application.cover_letter && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl px-3 py-2.5 mb-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Your cover letter
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
              {application.cover_letter}
            </p>
          </div>
        )}

        {/* Portfolio links count */}
        {application.portfolio_links?.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <ExternalLink className="w-3.5 h-3.5" />
            {application.portfolio_links.length} portfolio {application.portfolio_links.length === 1 ? "link" : "links"} submitted
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-400">
            {application.status === "pending" && "Waiting for employer response"}
            {application.status === "shortlisted" && "🎯 You made the shortlist!"}
            {application.status === "interviewed" && "Interview stage completed"}
            {application.status === "offered" && "🎉 Congratulations!"}
            {application.status === "rejected" && "Position filled by someone else"}
          </div>
          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs font-semibold">
            View job <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────
function StatsBar({ applications }) {
  const counts = {
    total:       applications.length,
    pending:     applications.filter(a => a.status === "pending").length,
    shortlisted: applications.filter(a => a.status === "shortlisted").length,
    offered:     applications.filter(a => a.status === "offered").length,
  };

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {[
        { label: "Total", value: counts.total, color: "text-gray-900 dark:text-white", bg: "bg-white dark:bg-gray-800" },
        { label: "Pending", value: counts.pending, color: "text-yellow-700 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
        { label: "Shortlisted", value: counts.shortlisted, color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
        { label: "Offered", value: counts.offered, color: "text-green-700 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
      ].map((stat) => (
        <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center border border-gray-200 dark:border-gray-700`}>
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function MusicianApplicationsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user) fetchApplications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select(`
          *,
          job:job_postings(
            id,
            title,
            organization_name,
            job_type,
            employment_type,
            city,
            state,
            salary_min,
            salary_max,
            salary_type,
            currency,
            application_deadline,
            status
          )
        `)
        .eq("musician_id", user.id)
        .order("applied_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { id: "all",         label: "All" },
    { id: "pending",     label: "Pending" },
    { id: "shortlisted", label: "Shortlisted" },
    { id: "interviewed", label: "Interviewed" },
    { id: "offered",     label: "Offers" },
    { id: "rejected",    label: "Closed" },
  ];

  const filtered = applications.filter((a) => {
    const matchesStatus = filter === "all" || a.status === filter;
    const matchesSearch =
      !search ||
      a.job?.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.job?.organization_name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const hasOffers = applications.some((a) => a.status === "offered");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Applications</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{applications.length} total submitted</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title or organization..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent rounded-xl focus:border-purple-400 focus:ring-0 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 transition"
            />
          </div>

          {/* Status tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {TABS.map((tab) => {
              const count = tab.id === "all"
                ? applications.length
                : applications.filter(a => a.status === tab.id).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1
                    ${filter === tab.id
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                      ${filter === tab.id ? "bg-white/25" : "bg-gray-200 dark:bg-gray-700"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5">

        {/* Offer alert banner */}
        {hasOffers && filter !== "offered" && (
          <button
            onClick={() => setFilter("offered")}
            className="w-full mb-5 flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition text-left"
          >
            <Trophy className="w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">You have a job offer!</p>
              <p className="text-green-100 text-xs">Tap to view your offer</p>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse border border-gray-200 dark:border-gray-700">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-2/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          // Empty state — no applications at all
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-5">
              <Briefcase className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No applications yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs">
              Browse open positions and start applying to music jobs and auditions.
            </p>
            <Link
              href="/jobs"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition"
            >
              Browse Jobs & Auditions →
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          // Empty state — filter/search has no results
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-900 dark:text-white mb-1">No applications match</p>
            <p className="text-sm text-gray-500 mb-4">
              {search ? `No results for "${search}"` : `No ${filter} applications`}
            </p>
            <button
              onClick={() => { setFilter("all"); setSearch(""); }}
              className="text-sm text-purple-600 font-semibold"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <StatsBar applications={applications} />
            <div className="space-y-4">
              {filtered.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>

            {/* Browse more CTA */}
            <div className="mt-8 text-center">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl font-semibold text-sm transition"
              >
                <Briefcase className="w-4 h-4" />
                Browse more opportunities
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}