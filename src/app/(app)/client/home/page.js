// src/app/(app)/client/home/page.js - IMPROVED VERSION
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import MusicianCard from "@/components/MusicianCard";
import PostEventForm from "@/components/PostEventForm";
import SearchFilterBar from "@/components/SearchFilterBar";
import { Plus, Calendar, Users, TrendingUp, Eye } from "lucide-react";
import LoadingSpinner, { SkeletonCard } from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

export default function ClientHome() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("find"); // find | myEvents | feed
  const [musicians, setMusicians] = useState([]);
  const [clientEvents, setClientEvents] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [loading, setLoading] = useState(true);

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
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          event_interests(musician_id)
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClientEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // Apply filters
  const filteredMusicians = musicians.filter((m) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matches =
        m.first_name?.toLowerCase().includes(searchLower) ||
        m.last_name?.toLowerCase().includes(searchLower) ||
        m.primary_role?.toLowerCase().includes(searchLower) ||
        m.display_name?.toLowerCase().includes(searchLower);
      if (!matches) return false;
    }

    // Roles filter
    if (filters.roles?.length > 0 && !filters.roles.includes(m.primary_role)) {
      return false;
    }

    // Genres filter
    if (
      filters.genres?.length > 0 &&
      !filters.genres.some((g) => m.genres?.includes(g))
    ) {
      return false;
    }

    // Location filter
    if (
      filters.location &&
      !m.location?.toLowerCase().includes(filters.location.toLowerCase())
    ) {
      return false;
    }

    // Availability filter
    if (filters.availability === "available" && !m.is_available) {
      return false;
    }
    if (filters.availability === "busy" && m.is_available) {
      return false;
    }

    // Rating filter
    if (filters.rating && (m.average_rating || 0) < filters.rating) {
      return false;
    }

    // Price filter
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

            {/* Post Event Button */}
            <button
              onClick={() => setShowPostForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Post Event</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
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
            {/* Search & Filters - Sticky */}
            <div className="sticky top-[140px] z-10">
              <SearchFilterBar
                filters={filters}
                setFilters={setFilters}
                resultsCount={filteredMusicians.length}
              />
            </div>

            {/* Musicians Grid */}
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
            {clientEvents.length === 0 ? (
              <EmptyState
                icon="events"
                title="No Events Posted"
                description="Post your first event to start finding talented musicians for your gigs"
                action={() => setShowPostForm(true)}
                actionLabel="Post Event"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition cursor-pointer"
                    onClick={() => router.push(`/events/${event.id}`)}
                  >
                    {/* Event Image */}
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

                    {/* Event Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-1">
                        {event.title}
                      </h3>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {event.description}
                      </p>

                      <div className="space-y-2 text-sm">
                        {event.location && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {event.location}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                            <Eye className="w-4 h-4" />
                            <span className="font-medium">
                              {event.event_interests?.length || 0} interested
                            </span>
                          </div>

                          {event.proposed_amount && (
                            <span className="font-semibold text-gray-900 dark:text-white">
                              ₦{event.proposed_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
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
          <div className="relative w-full max-w-2xl">
            <PostEventForm
              onSuccess={() => {
                setShowPostForm(false);
                fetchClientEvents();
              }}
              onCancel={() => setShowPostForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}