// src/app/(app)/client/home/page.js - ENHANCED WITH VIEW TOGGLE (ALL FEATURES PRESERVED)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import MusicianCard from "@/components/MusicianCard";
import PostEventForm from "@/components/PostEventForm";
import PostJobForm from "@/components/jobs/PostJobForm";
import SearchFilterBar from "@/components/SearchFilterBar";
import ViewToggle from "@/components/ViewToggle"; // ⭐ NEW
import CarouselView from "@/components/CarouselView"; // ⭐ NEW
import { Plus, Calendar, Users, TrendingUp, Eye, Trash2, RefreshCw, MapPin, Briefcase } from "lucide-react";
import LoadingSpinner, { 
  LogoSpinner, 
  FullScreenLoading,
  SkeletonMusicianCard,
  SkeletonEventCard,
  ProgressBar,
  PulseDots,
  SkeletonCard
} from '@/components/LoadingSpinner';
import EmptyState from "@/components/EmptyState";
import PullToRefresh from '@/components/PullToRefresh';
//import StreamingToggle from '@/components/streaming/StreamingToggle';

export default function ClientHome() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("find");
  const [musicians, setMusicians] = useState([]);
  const [clientEvents, setClientEvents] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postingType, setPostingType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  // ⭐ NEW: View state for musicians
  const [musicianView, setMusicianView] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('clientMusicianView');
      const isMobile = window.innerWidth < 640;
      return saved || (isMobile ? 'carousel' : 'grid');
    }
    return 'grid';
  });

  // ⭐ NEW: View state for events
  const [eventView, setEventView] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('clientEventView');
      const isMobile = window.innerWidth < 640;
      return saved || (isMobile ? 'carousel' : 'grid');
    }
    return 'grid';
  });

  // ⭐ NEW: Mobile detection
  const [isMobile, setIsMobile] = useState(false);

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

  // ⭐ NEW: Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      
      // Auto-switch to carousel on mobile if no saved preference
      if (mobile && !localStorage.getItem('clientMusicianView')) {
        setMusicianView('carousel');
      }
      if (mobile && !localStorage.getItem('clientEventView')) {
        setEventView('carousel');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ⭐ NEW: Save view preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clientMusicianView', musicianView);
    }
  }, [musicianView]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clientEventView', eventView);
    }
  }, [eventView]);

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
        .eq("profile_visible", true) // Only show visible profiles
        .order("is_featured", { ascending: false })
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

  const handlePostClick = () => {
    setShowPostForm(true);
    setPostingType(null);
  };

  const handlePostTypeSelect = (type) => {
    setPostingType(type);
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

    if (filters.availability === "available" && !m.available) {
      return false;
    }
    if (filters.availability === "busy" && m.available) {
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

  const handleRefresh = async () => {
    console.log('🔄 Refreshing profile...');
    await fetchClientEvents();
    await fetchMusicians();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome Back! 👋
              </h1>
              <div className="flex items-center gap-3">
                {/* <StreamingToggle /> */}
                <button
                  onClick={handlePostClick}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Post New</span>
                </button>
              </div>
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

              {/* Feed */}
              {/* <button
                onClick={() => router.push("/feed")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <TrendingUp className="w-4 h-4" />
                Social Feed
              </button> */}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Find Musicians Tab */}
          {activeTab === "find" && (
            <div className="space-y-6">
              {/* Search & View Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <SearchFilterBar
                    filters={filters}
                    setFilters={setFilters}
                    resultsCount={filteredMusicians.length}
                  />
                </div>
                
                {/* ⭐ NEW: View Toggle */}
                <ViewToggle 
                  view={musicianView} 
                  onChange={setMusicianView}
                  isMobile={isMobile}
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
                <>
                  {/* ⭐ NEW: Carousel View (Netflix-style) */}
                  {musicianView === 'carousel' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          Swipe to explore musicians →
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {filteredMusicians.length} musicians
                        </p>
                      </div>
                      <CarouselView
                        items={filteredMusicians}
                        itemWidth={280}
                        renderItem={(musician) => (
                          <div onClick={() => router.push(`/musician/${musician.id}`)}>
                            <MusicianCard musician={musician} />
                          </div>
                        )}
                      />
                    </div>
                  )}

                  {/* Grid View */}
                  {musicianView === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredMusicians.map((musician) => (
                        <MusicianCard key={musician.id} musician={musician} />
                      ))}
                    </div>
                  )}

                  {/* ⭐ NEW: List View (Desktop only) */}
                  {musicianView === 'list' && !isMobile && (
                    <div className="space-y-4">
                      {filteredMusicians.map((musician) => (
                        <div
                          key={musician.id}
                          onClick={() => router.push(`/musician/${musician.id}`)}
                          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition cursor-pointer flex items-center gap-4"
                        >
                          <img
                            src={musician.profile_picture_url || '/default-avatar.png'}
                            alt={musician.display_name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                              {musician.display_name || `${musician.first_name} ${musician.last_name}`}
                            </h3>
                            <p className="text-sm text-purple-600 dark:text-purple-400">
                              {musician.primary_role || musician.professional_title}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>⭐ {musician.average_rating?.toFixed(1) || 'New'}</span>
                              <span>🔥 {musician.total_bookings || 0} gigs</span>
                              <span>📍 {musician.city || musician.location}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
                              ₦{musician.hourly_rate?.toLocaleString() || 'TBD'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">per hour</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* My Events Tab */}
          {activeTab === "myEvents" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    My Posted Events
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {clientEvents.length === 0 ? 'No events yet' : `${clientEvents.length} event${clientEvents.length === 1 ? '' : 's'}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* ⭐ NEW: View Toggle for Events */}
                  {clientEvents.length > 0 && (
                    <ViewToggle 
                      view={eventView} 
                      onChange={setEventView}
                      isMobile={isMobile}
                    />
                  )}
                  <button
                    onClick={fetchClientEvents}
                    disabled={eventsLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${eventsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
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
                <>
                  {/* ⭐ NEW: Carousel View for Events */}
                  {eventView === 'carousel' && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                        Swipe to view your events →
                      </h3>
                      <CarouselView
                        items={clientEvents}
                        itemWidth={300}
                        renderItem={(event) => (
                          <EventCard 
                            event={event} 
                            onDelete={handleDeleteEvent} 
                            onView={() => router.push(`/events/${event.id}`)} 
                          />
                        )}
                      />
                    </div>
                  )}

                  {/* Grid View for Events */}
                  {eventView === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {clientEvents.map((event) => (
                        <EventCard 
                          key={event.id} 
                          event={event} 
                          onDelete={handleDeleteEvent} 
                          onView={() => router.push(`/events/${event.id}`)} 
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Post Modal with Type Selection - ALL EXISTING CODE PRESERVED */}
        {showPostForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            {!postingType ? (
              // Type Selection Screen
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full p-8 my-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    What would you like to post?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose the type of opportunity you're offering
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quick Gig Card */}
                  <button
                    onClick={() => handlePostTypeSelect('event')}
                    className="group relative p-8 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-2xl hover:border-purple-500 hover:shadow-2xl transition text-left"
                  >
                    <div className="absolute top-6 right-6">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                        <Calendar className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Quick Gig / Event
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      One-time performance or event
                    </p>
                    
                    <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-6">
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Single event (wedding, party, corporate)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Musicians send you price proposals</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Pay per event through platform</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Best for: Parties, weddings, one-off shows</span>
                      </li>
                    </ul>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        FREE TO POST →
                      </span>
                    </div>
                  </button>

                  {/* Job/Audition Card */}
                  <button
                    onClick={() => handlePostTypeSelect('job')}
                    className="group relative p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-2xl hover:border-purple-500 hover:shadow-2xl transition text-left"
                  >
                    <div className="absolute top-6 right-6">
                      <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                        <Briefcase className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Job / Audition
                      </h3>
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                        NEW
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Long-term position or recurring work
                    </p>
                    
                    <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-6">
                      <li className="flex items-start gap-3">
                        <span className="text-purple-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Monthly/permanent employment</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Musicians apply with portfolio/CV</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Hold auditions, interview candidates</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Best for: Church positions, venue residents</span>
                      </li>
                    </ul>
                    
                    <div className="pt-4 border-t border-purple-200 dark:border-purple-800">
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        ₦10,000 POSTING FEE →
                      </span>
                    </div>
                  </button>
                </div>

                {/* Cancel Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowPostForm(false)}
                    className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : postingType === 'event' ? (
              // Show Event Form
              <PostEventForm
                onSuccess={(eventData) => {
                  console.log("✅ Event posted:", eventData);
                  setShowPostForm(false);
                  setPostingType(null);
                  fetchClientEvents();
                  alert("✅ Event posted successfully!");
                  setActiveTab("myEvents");
                }}
                onCancel={() => {
                  setShowPostForm(false);
                  setPostingType(null);
                }}
              />
            ) : (
              // Show Job Form
              <PostJobForm
                onSuccess={() => {
                  setShowPostForm(false);
                  setPostingType(null);
                  // Redirect handled by PostJobForm to payment page
                }}
                onCancel={() => {
                  setShowPostForm(false);
                  setPostingType(null);
                }}
              />
            )}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}

// ⭐ NEW: Event Card Component (Extracted for reuse in carousel and grid)
function EventCard({ event, onDelete, onView }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition h-full flex flex-col">
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

      <div className="p-4 space-y-3 flex-1 flex flex-col">
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

        <div className="space-y-2 text-sm flex-1">
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

        <div className="flex gap-2 pt-2 mt-auto">
          <button
            onClick={onView}
            className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            title="Delete event"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}