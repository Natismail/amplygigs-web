// src/app/(app)/client/proposals/page.js - NEW
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Music,
  CheckCircle,
  XCircle,
  Loader,
  FileText,
  Trash2,
} from "lucide-react";

export default function ClientProposalsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending | accepted | declined | all
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    if (user) {
      fetchProposals();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("proposals")
        .select(`
          *,
          musician:musician_id(
            first_name,
            last_name,
            display_name,
            primary_role,
            profile_picture_url,
            average_rating
          )
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProposals(data || []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (proposalId) => {
    if (!confirm("Delete this proposal?")) return;

    setDeleting({ ...deleting, [proposalId]: true });

    try {
      const { error } = await supabase
        .from("proposals")
        .delete()
        .eq("id", proposalId);

      if (error) throw error;

      alert("Proposal deleted.");
      fetchProposals();
    } catch (error) {
      console.error("Error deleting proposal:", error);
      alert("Failed to delete proposal. Please try again.");
    } finally {
      setDeleting({ ...deleting, [proposalId]: false });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
        icon: Clock,
        text: "Awaiting Response",
      },
      accepted: {
        color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
        icon: CheckCircle,
        text: "Accepted",
      },
      declined: {
        color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
        icon: XCircle,
        text: "Declined",
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Proposals
            </h1>
            <button
              onClick={() => router.push("/network")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
            >
              Find Musicians
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: "pending", label: "Pending" },
              { id: "accepted", label: "Accepted" },
              { id: "declined", label: "Declined" },
              { id: "all", label: "All" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  filter === tab.id
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Proposals
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {filter === "pending"
                ? "You haven't sent any proposals yet"
                : `No ${filter} proposals found`}
            </p>
            <button
              onClick={() => router.push("/network")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
            >
              Browse Musicians
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => {
              const musician = proposal.musician;
              const displayName =
                musician?.display_name ||
                `${musician?.first_name} ${musician?.last_name}`;

              return (
                <div
                  key={proposal.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1"
                        onClick={() =>
                          router.push(`/musician/${musician?.id}`)
                        }
                      >
                        {/* Musician Avatar */}
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-purple-600 flex-shrink-0">
                          {musician?.profile_picture_url ? (
                            <Image
                              src={musician.profile_picture_url}
                              alt={displayName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold">
                              {displayName?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition">
                            {displayName}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            {musician?.primary_role && (
                              <>
                                <Music className="w-3.5 h-3.5" />
                                <span>{musician.primary_role}</span>
                              </>
                            )}
                            {musician?.average_rating > 0 && (
                              <>
                                <span>•</span>
                                <span>⭐ {musician.average_rating.toFixed(1)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(proposal.status)}
                        {proposal.status === "pending" && (
                          <button
                            onClick={() => handleDelete(proposal.id)}
                            disabled={deleting[proposal.id]}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                            title="Delete proposal"
                          >
                            {deleting[proposal.id] ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sent date */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Sent on{" "}
                      {new Date(proposal.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Event Type */}
                    {proposal.event_type && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {proposal.event_type}
                        </span>
                      </div>
                    )}

                    {/* Message */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Your Message:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                        {proposal.message}
                      </p>
                    </div>

                    {/* Event Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {proposal.event_date && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {new Date(proposal.event_date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </div>
                      )}

                      {proposal.venue && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{proposal.venue}</span>
                        </div>
                      )}

                      {proposal.duration && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          {proposal.duration} hours
                        </div>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-sm">Proposed Budget</span>
                      </div>
                      <span className="font-bold text-2xl text-purple-600 dark:text-purple-400">
                        ₦{proposal.proposed_amount?.toLocaleString() || "0"}
                      </span>
                    </div>

                    {/* Status message */}
                    {proposal.status === "accepted" && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          ✅ This proposal was accepted! A booking has been created.
                          Check your bookings page.
                        </p>
                      </div>
                    )}

                    {proposal.status === "declined" && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          ❌ This proposal was declined by the musician.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}