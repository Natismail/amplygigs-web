///app/(app)/live-events/page.js

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  Filter,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";

export default function LiveEventsPage() {
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: "",
    category: "",
    search: "",
  });

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function loadEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.city) params.append("city", filters.city);
      if (filters.category) params.append("category", filters.category);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`/api/musician-events?${params}`);
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

  const getLowestPrice = (tiers) => {
    if (!tiers || tiers.length === 0) return null;
    return Math.min(...tiers.map((t) => t.price));
  };

  const getAvailableTickets = (tiers) => {
    if (!tiers || tiers.length === 0) return 0;
    return tiers.reduce(
      (sum, t) => sum + (t.quantity_available - t.quantity_sold),
      0
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NG", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🎵 Live Music Events
          </h1>
          <p className="text-xl text-purple-100 mb-8">
            Discover amazing live performances happening near you
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400 ml-2" />
            <input
              type="text"
              placeholder="Search events, artists, venues..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="flex-1 px-4 py-3 text-gray-900 focus:outline-none"
            />
            <button className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Cities</option>
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja</option>
              <option value="Port Harcourt">Port Harcourt</option>
              <option value="Ibadan">Ibadan</option>
              <option value="Kano">Kano</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="concert">Concert</option>
              <option value="festival">Festival</option>
              <option value="club_night">Club Night</option>
              <option value="private_show">Private Show</option>
              <option value="corporate">Corporate</option>
            </select>

            <button
              onClick={() => setFilters({ city: "", category: "", search: "" })}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎪</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Events Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Check back soon for upcoming events
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                {events.length} upcoming events
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const lowestPrice = getLowestPrice(event.ticket_tiers);
                const availableTickets = getAvailableTickets(
                  event.ticket_tiers
                );

                return (
                  <div
                    key={event.id}
                    onClick={() => router.push(`/live-events/${event.id}`)}
                    className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                  >
                    {/* Event Image */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-500 to-pink-500">
                      {event.cover_image_url ? (
                        <img
                          src={event.cover_image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-16 h-16 text-white/50" />
                        </div>
                      )}

                      {event.is_featured && (
                        <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Featured
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg">
                        <div className="text-center">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {new Date(event.event_date).toLocaleDateString(
                              "en-US",
                              { month: "short" }
                            )}
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {new Date(event.event_date).getDate()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="p-5">
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium rounded">
                          {event.category?.replace("_", " ").toUpperCase()}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 transition">
                        {event.title}
                      </h3>

                      <div className="flex items-center gap-2 mb-3">
                        {event.organizer?.avatar_url ? (
                          <img
                            src={event.organizer.avatar_url}
                            alt={event.organizer.stage_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-purple-500"></div>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {event.organizer?.stage_name ||
                            event.organizer?.full_name}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {event.venue_name}, {event.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {formatDate(event.event_date)} •{" "}
                            {formatTime(event.event_date)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                        <div>
                          {lowestPrice ? (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                From
                              </div>
                              <div className="text-xl font-bold text-gray-900 dark:text-white">
                                ₦{lowestPrice.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Free Event
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          {availableTickets > 0 ? (
                            <>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {availableTickets} tickets left
                              </div>
                              <button className="mt-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition">
                                Get Tickets
                              </button>
                            </>
                          ) : (
                            <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg">
                              Sold Out
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}