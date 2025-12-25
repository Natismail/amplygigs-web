// src/app/(app)/client/home/page.js - FIXED EMPTY EVENTS HANDLING
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import MusicianCard from "@/components/MusicianCard";
import PostEventForm from "@/components/PostEventForm";
import SearchFilterBar from "@/components/SearchFilterBar";
import { Plus, Calendar, Users, TrendingUp, Eye, Trash2, RefreshCw, MapPin } from "lucide-react";
import LoadingSpinner, { SkeletonCard } from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

export default function ClientHome() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("find");
  const [musicians, setMusicians] = useState([]);
  const [clientEvents, setClientEvents] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    genres: [],
    location: "",
    roles: [],
    availability: "",
    rating: 0,
    priceMin: "",
    priceMax: "",
  });

  // Fetch musicians
  useEffect(() => {
    if (!user) return;
    fetchMusicians(); 
  }, [user]);

  // Fetch client's events
  useEffect(() => {
    if (!user) return;
    fetchClientEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMusicians = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("role", "MUSICIAN")
        .order("average_rating", { ascending: false });

      if (error) throw error;
      setMusicians(data || []);
    } catch (error) {
      console.error("Error fetching musicians:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientEvents = async () => {
    if (!user?.id) {
      console.log('⚠️ No user ID, skipping fetch');
      return;
    }

    setEventsLoading(true);
    setEventsError(null);
    
    try {
      console.log("🔍 Fetching events for user:", user.id);

      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          event_interests(id, musician_id)
        `)
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching events:", error);
        
        // Handle "no rows" gracefully - this is OK for new users
        if (error.code === 'PGRST116' || error.message?.includes('no rows')) {
          console.log('✅ No events yet (new user)');
          setClientEvents([]);
          return;
        }
        
        throw error;
      }

      console.log("✅ Fetched events:", data);
      
      // Add interested count to each event
      const eventsWithCount = (data || []).map(event => ({
        ...event,
        interested_count: event.event_interests?.length || 0
      }));
      
      console.log("📊 Events with count:", eventsWithCount);
      setClientEvents(eventsWithCount);
    } catch (error) {
      console.error("❌ Error fetching events:", error);
      setEventsError(error.message || 'Failed to fetch events');
      // Don't show alert for new users with no events
      if (!error.message?.includes('no rows')) {
        console.log('Non-critical error, continuing...');
      }
    } finally {
      setEventsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("creator_id", user.id);

      if (error) throw error;

      alert("Event deleted successfully");
      fetchClientEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  // Apply filters
  const filteredMusicians = musicians.filter((m) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matches =
        m.first_name?.toLowerCase().includes(searchLower) ||
        m.last_name?.toLowerCase().includes(searchLower) ||
        m.primary_role?.toLowerCase().includes(searchLower) ||
        m.display_name?.toLowerCase().includes(searchLower);
      if (!matches) return false;
    }

    if (filters.roles?.length > 0 && !filters.roles.includes(m.primary_role)) {
      return false;
    }

    if (
      filters.genres?.length > 0 &&
      !filters.genres.some((g) => m.genres?.includes(g))
    ) {
      return false;
    }

    if (
      filters.location &&
      !m.location?.toLowerCase().includes(filters.location.toLowerCase())
    ) {
      return false;
    }

    if (filters.availability === "available" && !m.is_available) {
      return false;
    }
    if (filters.availability === "busy" && m.is_available) {
      return false;
    }

    if (filters.rating && (m.average_rating || 0) < filters.rating) {
      return false;
    }

    if (filters.priceMin && (m.hourly_rate || 0) < Number(filters.priceMin)) {
      return false;
    }
    if (filters.priceMax && (m.hourly_rate || 0) > Number(filters.priceMax)) {
      return false;
    }

    return true;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome Back! 👋
            </h1>

            <button
              onClick={() => setShowPostForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Post Event</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveTab("find")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                activeTab === "find"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Users className="w-4 h-4" />
              Find Musicians
            </button>

            <button
              onClick={() => setActiveTab("myEvents")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                activeTab === "myEvents"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Calendar className="w-4 h-4" />
              My Events
              {clientEvents.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {clientEvents.length}
                </span>
              )}
            </button>

            <button
              onClick={() => router.push("/feed")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <TrendingUp className="w-4 h-4" />
              Feed
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Find Musicians Tab */}
        {activeTab === "find" && (
          <div className="space-y-6">
            <div className="sticky top-[140px] z-10">
              <SearchFilterBar
                filters={filters}
                setFilters={setFilters}
                resultsCount={filteredMusicians.length}
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredMusicians.length === 0 ? (
              <EmptyState
                icon="users"
                title="No Musicians Found"
                description={
                  musicians.length === 0
                    ? "No musicians available at the moment. Check back later!"
                    : "No musicians match your filters. Try adjusting your search criteria."
                }
                action={() => setFilters({
                  search: "",
                  genres: [],
                  location: "",
                  roles: [],
                  availability: "",
                  rating: 0,
                  priceMin: "",
                  priceMax: "",
                })}
                actionLabel="Clear Filters"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMusicians.map((musician) => (
                  <MusicianCard key={musician.id} musician={musician} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Events Tab */}
        {activeTab === "myEvents" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  My Posted Events
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {clientEvents.length === 0 ? 'No events yet' : `${clientEvents.length} event${clientEvents.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <button
                onClick={fetchClientEvents}
                disabled={eventsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${eventsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Error State */}
            {eventsError && clientEvents.length === 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  ⚠️ Error Loading Events
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  {eventsError}
                </p>
                <button
                  onClick={fetchClientEvents}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            )}

            {eventsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : clientEvents.length === 0 && !eventsError ? (
              <EmptyState
                icon="events"
                title="No Events Posted Yet"
                description="Post your first event to start finding talented musicians for your gigs"
                action={() => setShowPostForm(true)}
                actionLabel="Post Your First Event"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition"
                  >
                    {event.media_url && (
                      <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                        <Image
                          src={event.media_url}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
                            {event.title}
                          </h3>
                          {event.event_type && (
                            <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                              {event.event_type}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {event.description}
                      </p>

                      <div className="space-y-2 text-sm">
                        {event.venue && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="line-clamp-1">{event.venue}</span>
                          </div>
                        )}

                        {event.event_date && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            {new Date(event.event_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                            <Eye className="w-4 h-4" />
                            <span className="font-medium text-sm">
                              {event.interested_count} interested
                            </span>
                          </div>

                          {event.proposed_amount && (
                            <span className="font-semibold text-gray-900 dark:text-white">
                              ₦{event.proposed_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => router.push(`/events/${event.id}`)}
                          className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          title="Delete event"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Event Modal */}
      {showPostForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <PostEventForm
            onSuccess={(eventData) => {
              console.log("✅ Event posted:", eventData);
              setShowPostForm(false);
              fetchClientEvents();
              alert("✅ Event posted successfully!");
              setActiveTab("myEvents");
            }}
            onCancel={() => setShowPostForm(false)}
          />
        </div>
      )}
    </div>
  );
}


