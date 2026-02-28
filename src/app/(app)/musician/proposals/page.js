// src/app/(app)/musician/proposals/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, getCurrencyByCode } from "@/components/CurrencySelector";
import VerificationGate, { VerificationBanner } from "@/components/VerificationGate";
import {
  Calendar, MapPin, Clock, User, CheckCircle, XCircle,
  Loader, FileText, Mail, MessageSquare, X, AlertTriangle,
} from "lucide-react";

// ── Decline Modal (replaces browser prompt()) ──────────────────────────────
function DeclineModal({ proposal, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");

  if (!proposal) return null;

  const clientName = `${proposal.client?.first_name || ""} ${proposal.client?.last_name || ""}`.trim() || "this client";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">Decline Proposal</h3>
          <button
            onPointerUp={onCancel}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">
              You're declining <strong>{clientName}'s</strong> proposal.
              They will be notified. This action cannot be undone.
            </p>
          </div>

          {/* Reason (optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Reason <span className="font-normal text-gray-400">(optional — helps clients improve)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. I'm unavailable on that date, the budget doesn't match my rate..."
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
          </div>

          {/* Preset reasons */}
          <div className="flex flex-wrap gap-2">
            {[
              "Not available on this date",
              "Budget too low",
              "Outside my service area",
              "Already booked",
            ].map((preset) => (
              <button
                key={preset}
                onPointerUp={() => setReason(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
                  ${reason === preset
                    ? "bg-red-600 text-white border-red-600"
                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-400 hover:text-red-600"
                  }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onPointerUp={onCancel}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Keep Pending
            </button>
            <button
              onPointerUp={() => onConfirm(reason || null)}
              disabled={loading}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader className="w-4 h-4 animate-spin" /> Declining...</>
              ) : (
                <><XCircle className="w-4 h-4" /> Decline</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:  { color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200", icon: Clock,         text: "Pending" },
    accepted: { color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",   icon: CheckCircle,    text: "Accepted" },
    declined: { color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",            icon: XCircle,        text: "Declined" },
  };
  const cfg = map[status] || map.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.text}
    </span>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function MusicianProposalsPage() {
  const router = useRouter();
  const { user, session } = useAuth();

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [processing, setProcessing] = useState({});
  const [declineTarget, setDeclineTarget] = useState(null); // proposal to decline

  useEffect(() => {
    if (user) fetchProposals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("proposals")
        .select(`
          *,
          client:client_id(
            id,
            first_name,
            last_name,
            email,
            phone,
            profile_picture_url,
            country_code
          )
        `)
        .eq("musician_id", user.id)
        .order("created_at", { ascending: false });

      if (filter !== "all") query = query.eq("status", filter);

      const { data, error } = await query;
      if (error) throw error;
      setProposals(data || []);
    } catch (err) {
      console.error("Error fetching proposals:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Send notification via API route (avoids RLS issues) ─────────────────
  const sendNotification = async (userId, payload) => {
    if (!session?.access_token) return;
    try {
      await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId, ...payload }),
      });
    } catch (err) {
      console.error("Notification send failed:", err);
      // Non-blocking — don't throw
    }
  };

  // ── Accept proposal ──────────────────────────────────────────────────────
  const handleAccept = async (proposalId) => {
    setProcessing((prev) => ({ ...prev, [proposalId]: "accepting" }));
    try {
      const proposal = proposals.find((p) => p.id === proposalId);
      if (!proposal) throw new Error("Proposal not found");

      // 1. Update proposal status
      const { error: propErr } = await supabase
        .from("proposals")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", proposalId);
      if (propErr) throw propErr;

      // 2. Create booking
      const { data: booking, error: bookErr } = await supabase
        .from("bookings")
        .insert({
          client_id: proposal.client_id,
          musician_id: user.id,
          event_date: proposal.event_date,
          event_location: proposal.venue,
          amount: proposal.proposed_amount,
          currency: proposal.currency || "NGN",      // ← carry currency through
          event_duration: proposal.duration,
          notes: proposal.message,
          status: "pending",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (bookErr) throw bookErr;

      // 3. Notify client via API (service-role, bypasses RLS)
      const musicianName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "The musician";
      await sendNotification(proposal.client_id, {
        title: "🎉 Proposal Accepted!",
        message: `${musicianName} accepted your booking proposal. A booking has been created.`,
        type: "booking_confirmed",
        action_url: `/client/bookings/${booking.id}`,
        data: { booking_id: booking.id, musician_id: user.id, proposal_id: proposalId },
      });

      await fetchProposals();
      router.push(`/musician/bookings?id=${booking.id}`);
    } catch (err) {
      console.error("Error accepting proposal:", err);
      alert(`Failed to accept proposal: ${err.message}`);
    } finally {
      setProcessing((prev) => ({ ...prev, [proposalId]: null }));
    }
  };

  // ── Decline proposal ─────────────────────────────────────────────────────
  const handleDeclineConfirm = async (reason) => {
    const proposal = declineTarget;
    if (!proposal) return;

    setProcessing((prev) => ({ ...prev, [proposal.id]: "declining" }));
    try {
      const { error } = await supabase
        .from("proposals")
        .update({
          status: "declined",
          updated_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq("id", proposal.id);
      if (error) throw error;

      const musicianName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "The musician";
      await sendNotification(proposal.client_id, {
        title: "Proposal Declined",
        message: `${musicianName} declined your booking proposal.${reason ? ` Reason: ${reason}` : ""}`,
        type: "booking_cancelled",
        action_url: "/client/proposals",
        data: { musician_id: user.id, proposal_id: proposal.id, reason },
      });

      setDeclineTarget(null);
      await fetchProposals();
    } catch (err) {
      console.error("Error declining proposal:", err);
      alert(`Failed to decline: ${err.message}`);
    } finally {
      setProcessing((prev) => ({ ...prev, [proposal.id]: null }));
    }
  };

  // ── Currency display for a proposal ─────────────────────────────────────
  const formatAmount = (proposal) => {
    const currency = proposal.currency || proposal.client?.country_code
      ? getCurrencyByCode(
          // Try to derive currency from client's country if not stored
          proposal.currency || "NGN"
        )?.code || "NGN"
      : "NGN";
    return formatCurrency(proposal.proposed_amount || 0, proposal.currency || "NGN");
  };

  const TABS = [
    { id: "pending",  label: "Pending" },
    { id: "accepted", label: "Accepted" },
    { id: "declined", label: "Declined" },
    { id: "all",      label: "All" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sticky header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Proposals</h1>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap text-sm transition ${
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
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        {/* Verification banner — shows only if unverified */}
        <VerificationBanner />

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-1/2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <Mail className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Proposals</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === "pending" ? "No pending proposals right now." : `No ${filter} proposals found.`}
            </p>
          </div>
        ) : (
          proposals.map((proposal) => {
            const clientName = `${proposal.client?.first_name || ""} ${proposal.client?.last_name || ""}`.trim() || "Client";
            const initials = `${proposal.client?.first_name?.[0] || ""}${proposal.client?.last_name?.[0] || ""}`.toUpperCase() || "?";
            const isProcessing = !!processing[proposal.id];

            return (
              <div
                key={proposal.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Card header */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      {proposal.client?.profile_picture_url ? (
                        <img
                          src={proposal.client.profile_picture_url}
                          alt={clientName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-base flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{clientName}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(proposal.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={proposal.status} />
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 space-y-4">
                  {/* Event type */}
                  {proposal.event_type && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {proposal.event_type}
                      </span>
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl leading-relaxed">
                      {proposal.message || "No message provided."}
                    </p>
                  </div>

                  {/* Event details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                    {proposal.event_date && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        {new Date(proposal.event_date).toLocaleDateString("en-US", {
                          weekday: "short", month: "long", day: "numeric", year: "numeric",
                        })}
                      </div>
                    )}
                    {proposal.venue && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{proposal.venue}</span>
                      </div>
                    )}
                    {proposal.duration && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        {proposal.duration} {proposal.duration === 1 ? "hour" : "hours"}
                      </div>
                    )}
                    {proposal.client?.phone && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <a href={`tel:${proposal.client.phone}`} className="text-blue-600 hover:underline">
                          {proposal.client.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Amount row */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <span className="text-base">💰</span> Proposed Amount
                    </span>
                    <span className="font-bold text-2xl text-purple-600 dark:text-purple-400">
                      {formatAmount(proposal)}
                    </span>
                  </div>

                  {/* Decline reason (if declined) */}
                  {proposal.status === "declined" && proposal.rejection_reason && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        <strong>Decline reason:</strong> {proposal.rejection_reason}
                      </p>
                    </div>
                  )}

                  {/* Action buttons — only for pending */}
                  {proposal.status === "pending" && (
                    <div className="flex gap-3 pt-2">
                      {/* Accept — gated by verification */}
                      <VerificationGate actionLabel="accept proposals">
                        <button
                          onClick={() => handleAccept(proposal.id)}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50"
                        >
                          {processing[proposal.id] === "accepting" ? (
                            <><Loader className="w-4 h-4 animate-spin" /> Accepting...</>
                          ) : (
                            <><CheckCircle className="w-4 h-4" /> Accept & Book</>
                          )}
                        </button>
                      </VerificationGate>

                      {/* Decline — no verification needed */}
                      <button
                        onClick={() => setDeclineTarget(proposal)}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 px-5 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl font-semibold text-sm transition disabled:opacity-50"
                      >
                        {processing[proposal.id] === "declining" ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <><XCircle className="w-4 h-4" /> Decline</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decline modal */}
      {declineTarget && (
        <DeclineModal
          proposal={declineTarget}
          onConfirm={handleDeclineConfirm}
          onCancel={() => setDeclineTarget(null)}
          loading={processing[declineTarget?.id] === "declining"}
        />
      )}
    </div>
  );
}