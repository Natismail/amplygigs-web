// src/app/(app)/live-events/page.js
// FIXES:
//   1. ticket_tiers field names: total_quantity/sold_quantity (not total_quantity/sold_quantity)
//   2. Currency display uses formatCurrency from CurrencySelector
//   3. organizer fields: first_name+last_name, profile_picture_url (not full_name/avatar_url)

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/components/CurrencySelector";
import { Calendar, MapPin, Search, Star } from "lucide-react";

export default function LiveEventsPage() {
  const router   = useRouter();
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: "", category: "", search: "" });

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function loadEvents() {
    setLoading(true);
    try {
      // ✅ Direct Supabase query — public published events, no auth needed
      const supabase = createClient();
      let query = supabase
        .from("musician_events")
        .select(`
          id, title, description, category, event_date, doors_open_time,
          venue_name, venue_address, city, state, cover_image_url,
          total_capacity, remaining_capacity, status, is_featured, currency,
          organizer:user_profiles!organizer_id(
            id, first_name, last_name, display_name,
            profile_picture_url, avatar_url
          ),
          ticket_tiers(id, name, price, total_quantity, sold_quantity)
        `)
        .eq("status", "published")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      if (filters.city)     query = query.eq("city", filters.city);
      if (filters.category) query = query.eq("category", filters.category);
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,venue_name.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Fixed field names: total_quantity, sold_quantity
  const getLowestPrice = (tiers) => {
    if (!tiers?.length) return null;
    const prices = tiers.map(t => t.price).filter(Boolean);
    return prices.length ? Math.min(...prices) : null;
  };

  const getAvailableTickets = (tiers) => {
    if (!tiers?.length) return 0;
    return tiers.reduce((sum, t) => sum + ((t.total_quantity || 0) - (t.sold_quantity || 0)), 0);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const formatTime = (d) => new Date(d).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

  // ✅ Organizer display name from correct fields
  const organizerName = (org) =>
    org?.display_name ||
    `${org?.first_name || ""} ${org?.last_name || ""}`.trim() ||
    "Unknown Artist";
  const organizerPhoto = (org) => org?.profile_picture_url || org?.avatar_url;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">🎵 Live Music Events</h1>
          <p className="text-lg sm:text-xl text-purple-100 mb-8">Discover amazing live performances happening near you</p>
          <div className="bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search events, artists, venues..."
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
              className="flex-1 px-4 py-3 text-gray-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-3 items-center">
          <select value={filters.city}
            onChange={e => setFilters(p => ({ ...p, city: e.target.value }))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white text-sm">
            <option value="">All Cities</option>
            {["Lagos","Abuja","Port Harcourt","Ibadan","Kano"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={filters.category}
            onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white text-sm">
            <option value="">All Types</option>
            {[["concert","Concert"],["festival","Festival"],["club_night","Club Night"],["private_show","Private Show"],["corporate","Corporate"]].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          {(filters.city || filters.category || filters.search) && (
            <button onClick={() => setFilters({ city: "", category: "", search: "" })}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 transition text-sm">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Events grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎪</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Events Found</h3>
            <p className="text-gray-600 dark:text-gray-400">Check back soon for upcoming events</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{events.length} upcoming event{events.length !== 1 ? "s" : ""}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => {
                const lowestPrice      = getLowestPrice(event.ticket_tiers);
                const availableTickets = getAvailableTickets(event.ticket_tiers);
                const currency         = event.currency || "NGN";
                const org              = event.organizer;

                return (
                  <div key={event.id}
                    onClick={() => router.push(`/live-events/${event.id}`)}
                    className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer group">

                    {/* Cover */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-500 to-pink-500">
                      {event.cover_image_url ? (
                        <img src={event.cover_image_url} alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-16 h-16 text-white/50" />
                        </div>
                      )}
                      {event.is_featured && (
                        <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />Featured
                        </div>
                      )}
                      {/* Date badge */}
                      <div className="absolute bottom-3 left-3 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg text-center min-w-[48px]">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {new Date(event.event_date).toLocaleDateString("en-US", { month: "short" })}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                          {new Date(event.event_date).getDate()}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium rounded mb-2">
                        {event.category?.replace("_", " ").toUpperCase()}
                      </span>

                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 transition">
                        {event.title}
                      </h3>

                      {/* Organizer */}
                      <div className="flex items-center gap-2 mb-3">
                        {organizerPhoto(org) ? (
                          <img src={organizerPhoto(org)} alt={organizerName(org)}
                            className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-purple-500 flex-shrink-0" />
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {organizerName(org)}
                        </span>
                      </div>

                      <div className="space-y-1.5 mb-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{event.venue_name}, {event.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{formatDate(event.event_date)} · {formatTime(event.event_date)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                        <div>
                          {lowestPrice != null ? (
                            <>
                              <div className="text-xs text-gray-500 dark:text-gray-400">From</div>
                              {/* ✅ Dynamic currency */}
                              <div className="text-xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(lowestPrice, currency)}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">Free Event</div>
                          )}
                        </div>

                        <div className="text-right">
                          {availableTickets > 0 ? (
                            <>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{availableTickets} left</div>
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


