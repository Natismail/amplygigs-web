// src/app/(app)/musician/my-events/page.js
// FIX: Replaced fetch('/api/musician-events') with direct Supabase query.
//
// ROOT CAUSE of empty data:
//   client.js stores the auth session in localStorage.
//   server.js (used by the API route) looks for the session in cookies.
//   These are different storage locations — the server route never finds
//   the session, runs as an anonymous user, and RLS returns 0 rows.
//
// THE FIX: Query musician_events directly from the browser Supabase client,
// which already has the session in localStorage. No API route needed for
// a private dashboard that only ever shows the logged-in user's own events.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client"; // ✅ browser client
import {
  Calendar, Plus, Eye, Edit, Trash2,
  TrendingUp, DollarSign, Users, BarChart3,
} from "lucide-react";

export default function MyEventsPage() {
  const router        = useRouter();
  const { user }      = useAuth();
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    if (user) loadMyEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ✅ Direct Supabase query — session is in localStorage, always authenticated
  // createClient() is called INSIDE the function, not at component level,
  // to avoid creating multiple GoTrueClient instances on re-renders.
  async function loadMyEvents() {
    setLoading(true);
    try {
      const supabase = createClient(); // ← create once per call, not per render
      const { data, error } = await supabase
        .from("musician_events")
        .select(`
          *,
          ticket_tiers (
            id,
            name,
            description,
            price,
            total_quantity,
            sold_quantity,
            max_per_order
          )
        `)
        .eq("organizer_id", user.id)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(eventId) {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("musician_events")
        .delete()
        .eq("id", eventId)
        .eq("organizer_id", user.id); // safety check

      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event: " + error.message);
    }
  }

  async function handlePublish(eventId) {
    if (!confirm("Publish this event? It will be visible to the public.")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("musician_events")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", eventId)
        .eq("organizer_id", user.id);

      if (error) throw error;
      setEvents(prev =>
        prev.map(e => e.id === eventId ? { ...e, status: "published" } : e)
      );
      alert("Event published successfully!");
    } catch (error) {
      console.error("Error publishing event:", error);
      alert("Failed to publish: " + error.message);
    }
  }

  const filteredEvents = events.filter((event) => {
    if (filter === "all")       return true;
    if (filter === "completed") return new Date(event.event_date) < new Date();
    return event.status === filter;
  });

  // ── ticket helpers ──────────────────────────────────────────────────────────
  // ticket_tiers now uses: sold_quantity, total_quantity, name (not tier_name)
  const getTotalTicketsSold = (event) => {
    if (!event.ticket_tiers?.length) return 0;
    return event.ticket_tiers.reduce((sum, t) => sum + (t.sold_quantity || 0), 0);
  };

  const getTotalSales = (event) => {
    if (!event.ticket_tiers?.length) return 0;
    return event.ticket_tiers.reduce(
      (sum, t) => sum + (t.sold_quantity || 0) * (t.price || 0), 0
    );
  };

  // ── filter counts ───────────────────────────────────────────────────────────
  const countFor = (f) => {
    if (f === "all")       return events.length;
    if (f === "completed") return events.filter(e => new Date(e.event_date) < new Date()).length;
    return events.filter(e => e.status === f).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                🎸 My Live Events
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your shows and ticket sales
              </p>
            </div>
            <button
              onClick={() => router.push("/musician/my-events/create")}
              className="px-4 sm:px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition text-sm sm:text-base"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create Event</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {["all", "draft", "published", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition capitalize whitespace-nowrap ${
                  filter === f
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {f} ({countFor(f)})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {filter === "all" ? "No Events Yet" : `No ${filter} events`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === "all"
                ? "Create your first live event and start selling tickets"
                : `You have no ${filter} events right now`}
            </p>
            {filter === "all" && (
              <button
                onClick={() => router.push("/musician/my-events/create")}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold inline-flex items-center gap-2 transition"
              >
                <Plus className="w-5 h-5" />
                Create Your First Event
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row">

                  {/* Cover image */}
                  <div className="md:w-56 h-44 md:h-auto bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-14 h-14 text-white/50" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-5 sm:p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            event.status === "published"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : event.status === "draft"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          }`}>
                            {event.status.toUpperCase()}
                          </span>
                          {event.category && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {event.category.replace("_", " ")}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(event.event_date).toLocaleDateString("en-NG", {
                              day: "numeric", month: "short", year: "numeric"
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {event.venue_name}
                          </span>
                        </div>
                      </div>

                      {/* Action icons */}
                      <div className="flex gap-1.5 ml-2 flex-shrink-0">
                        <button
                          onClick={() => router.push(`/musician/my-events/${event.id}`)}
                          className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                          title="View Dashboard"
                        >
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => router.push(`/musician/my-events/${event.id}/edit`)}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Sold</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {getTotalTicketsSold(event)}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Revenue</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          ₦{getTotalSales(event).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Remaining</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {event.remaining_capacity ?? "—"}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {event.status === "draft" && (
                        <button
                          onClick={() => handlePublish(event.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition"
                        >
                          Publish Event
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/musician/my-events/${event.id}/analytics`)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-1.5"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </button>
                      {event.status === "published" && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/live-events/${event.id}`
                            );
                            alert("Event link copied!");
                          }}
                          className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-medium text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                        >
                          Copy Link
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


