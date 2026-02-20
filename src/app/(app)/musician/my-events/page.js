//app/(app)/musician/my-events/page.js

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  Plus,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";

export default function MyEventsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, draft, published, completed

  useEffect(() => {
    if (user) {
      loadMyEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadMyEvents() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/musician-events?organizer_id=${user.id}&status=all`
      );
      const result = await response.json();

      if (result.success) {
        setEvents(result.data || []);
      }
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(eventId) {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`/api/musician-events/${eventId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        alert("Event deleted successfully");
        loadMyEvents();
      } else {
        alert("Failed to delete event: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  }

  async function handlePublish(eventId) {
    if (!confirm("Publish this event? It will be visible to the public."))
      return;

    try {
      const response = await fetch(`/api/musician-events/${eventId}/publish`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        alert("Event published successfully!");
        loadMyEvents();
      } else {
        alert("Failed to publish: " + result.error);
      }
    } catch (error) {
      console.error("Error publishing event:", error);
      alert("Failed to publish event");
    }
  }

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true;
    if (filter === "draft") return event.status === "draft";
    if (filter === "published") return event.status === "published";
    if (filter === "completed")
      return new Date(event.event_date) < new Date();
    return true;
  });

  const getTotalSales = (event) => {
    if (!event.ticket_tiers) return 0;
    return event.ticket_tiers.reduce(
      (sum, tier) => sum + tier.quantity_sold * tier.price,
      0
    );
  };

  const getTotalTicketsSold = (event) => {
    if (!event.ticket_tiers) return 0;
    return event.ticket_tiers.reduce((sum, tier) => sum + tier.quantity_sold, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🎸 My Live Events
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your shows and ticket sales
              </p>
            </div>
            <button
              onClick={() => router.push("/musician/my-events/create")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {["all", "draft", "published", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition capitalize ${
                  filter === f
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {f} ({events.filter((e) => {
                  if (f === "all") return true;
                  if (f === "completed") return new Date(e.event_date) < new Date();
                  return e.status === f;
                }).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Events Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first live event and start selling tickets
            </p>
            <button
              onClick={() => router.push("/musician/my-events/create")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold inline-flex items-center gap-2 transition"
            >
              <Plus className="w-5 h-5" />
              Create Your First Event
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Event Image */}
                  <div className="md:w-64 h-48 md:h-auto bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-white/50" />
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              event.status === "published"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : event.status === "draft"
                                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {event.status.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {event.category?.replace("_", " ")}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.event_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {event.venue_name}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            router.push(`/musician/my-events/${event.id}`)
                          }
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                          title="View Dashboard"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            router.push(`/musician/my-events/${event.id}/edit`)
                          }
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                          Tickets Sold
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {getTotalTicketsSold(event)}
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                          Total Sales
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          ₦{getTotalSales(event).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                          Remaining
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {event.remaining_capacity}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {event.status === "draft" && (
                        <button
                          onClick={() => handlePublish(event.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition"
                        >
                          Publish Event
                        </button>
                      )}
                      <button
                        onClick={() =>
                          router.push(`/musician/my-events/${event.id}/analytics`)
                        }
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        View Analytics
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