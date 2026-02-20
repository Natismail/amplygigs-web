"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Eye,
  Flag,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Music,
  Building2,
} from "lucide-react";

export default function AdminEventsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [musicianEvents, setMusicianEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState("all"); // all, client_gigs, musician_events, flagged
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

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
    await loadEvents();
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Load client-posted gigs
      const { data: clientGigs } = await supabase
        .from("events")
        .select(
          `
          *,
          organizer:user_profiles!events_client_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `
        )
        .order("event_date", { ascending: false });

      // Load musician live events
      const { data: liveEvents } = await supabase
        .from("musician_events")
        .select(
          `
          *,
          organizer:user_profiles!organizer_id(
            id,
            first_name,
            last_name,
            stage_name,
            email
          ),
          ticket_tiers(*)
        `
        )
        .order("event_date", { ascending: false });

      setEvents(clientGigs || []);
      setMusicianEvents(liveEvents || []);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlagEvent = async (eventId, eventType) => {
    const reason = prompt("Enter reason for flagging this event:");
    if (!reason) return;

    try {
      const table = eventType === "client" ? "events" : "musician_events";

      await supabase.from(table).update({ is_flagged: true }).eq("id", eventId);

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "flag_event",
        target_type: table,
        target_id: eventId,
        reason: reason,
      });

      alert("Event flagged successfully");
      loadEvents();
    } catch (error) {
      console.error("Error flagging event:", error);
      alert("Failed to flag event");
    }
  };

  const handleDeleteEvent = async (eventId, eventType) => {
    if (!confirm("Are you sure you want to delete this event? This cannot be undone."))
      return;

    try {
      const table = eventType === "client" ? "events" : "musician_events";

      await supabase.from(table).delete().eq("id", eventId);

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "delete_event",
        target_type: table,
        target_id: eventId,
        reason: "Admin deleted event",
      });

      alert("Event deleted successfully");
      loadEvents();
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const allEvents = [
    ...events.map((e) => ({ ...e, type: "client" })),
    ...musicianEvents.map((e) => ({ ...e, type: "musician" })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filteredEvents = allEvents.filter((event) => {
    if (filter === "client_gigs" && event.type !== "client") return false;
    if (filter === "musician_events" && event.type !== "musician") return false;
    if (filter === "flagged" && !event.is_flagged) return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        event.title?.toLowerCase().includes(search) ||
        event.organizer?.first_name?.toLowerCase().includes(search) ||
        event.organizer?.last_name?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const stats = {
    totalClientGigs: events.length,
    totalMusicianEvents: musicianEvents.length,
    totalEvents: allEvents.length,
    flaggedEvents: allEvents.filter((e) => e.is_flagged).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
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
                <Calendar className="w-8 h-8 text-purple-600" />
                Event Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Monitor and manage all platform events
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
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.totalEvents}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Total Events
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats.totalClientGigs}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300">
                Client Gigs
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.totalMusicianEvents}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                Live Events
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                {stats.flaggedEvents}
              </div>
              <div className="text-xs text-red-700 dark:text-red-300">
                Flagged
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
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {["all", "client_gigs", "musician_events", "flagged"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition capitalize ${
                    filter === f
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <Filter className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Events Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={`${event.type}-${event.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        event.type === "client"
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : "bg-purple-100 dark:bg-purple-900/30"
                      }`}
                    >
                      {event.type === "client" ? (
                        <Calendar className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Music className="w-6 h-6 text-purple-600" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {event.title}
                        </h3>
                        {event.is_flagged && (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded-full">
                            FLAGGED
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            event.type === "client"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          }`}
                        >
                          {event.type === "client" ? "Client Gig" : "Live Event"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Organizer
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {event.organizer?.first_name}{" "}
                            {event.organizer?.last_name ||
                              event.organizer?.stage_name}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Date
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(event.event_date).toLocaleDateString()}
                          </p>
                        </div>

                        {event.type === "client" ? (
                          <>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Budget
                              </span>
                              <p className="font-medium text-gray-900 dark:text-white">
                                ₦{event.budget?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Status
                              </span>
                              <p className="font-medium text-gray-900 dark:text-white capitalize">
                                {event.status}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Tickets Sold
                              </span>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {event.ticket_tiers?.reduce(
                                  (sum, t) => sum + (t.quantity_sold || 0),
                                  0
                                ) || 0}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Status
                              </span>
                              <p className="font-medium text-gray-900 dark:text-white capitalize">
                                {event.status}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    {!event.is_flagged && (
                      <button
                        onClick={() => handleFlagEvent(event.id, event.type)}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition"
                        title="Flag Event"
                      >
                        <Flag className="w-5 h-5" />
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteEvent(event.id, event.type)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Delete Event"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedEvent.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedEvent.type === "client" ? "Client Gig" : "Live Event"}
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {selectedEvent.description || "No description provided"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Organizer
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {selectedEvent.organizer?.first_name}{" "}
                    {selectedEvent.organizer?.last_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedEvent.organizer?.email}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Event Date
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedEvent.event_date).toLocaleString()}
                  </p>
                </div>

                {selectedEvent.type === "client" ? (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Budget
                      </h3>
                      <p className="text-gray-900 dark:text-white">
                        ₦{selectedEvent.budget?.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Duration
                      </h3>
                      <p className="text-gray-900 dark:text-white">
                        {selectedEvent.duration_hours} hours
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Venue
                      </h3>
                      <p className="text-gray-900 dark:text-white">
                        {selectedEvent.venue_name}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Capacity
                      </h3>
                      <p className="text-gray-900 dark:text-white">
                        {selectedEvent.total_capacity} people
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {!selectedEvent.is_flagged && (
                  <button
                    onClick={() => {
                      handleFlagEvent(selectedEvent.id, selectedEvent.type);
                      setSelectedEvent(null);
                    }}
                    className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition"
                  >
                    Flag Event
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() =>
                      handleDeleteEvent(selectedEvent.id, selectedEvent.type)
                    }
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                  >
                    Delete Event
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}