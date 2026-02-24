// src/app/(app)/musician/gigs/page.js - ENHANCED WITH VIEW TOGGLE (ALL FEATURES PRESERVED)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import ViewToggle from "@/components/ViewToggle"; 
import CarouselView from "@/components/CarouselView"; 
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  TrendingUp,
  Filter,
  Search,
  CheckCircle,
  Loader,
  Eye,
} from "lucide-react";

export default function MusicianGigsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | interested | matched
  const [processingInterest, setProcessingInterest] = useState({});

  // ⭐ NEW: View state
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('musicianGigsView');
      const isMobile = window.innerWidth < 640;
      return saved || (isMobile ? 'carousel' : 'grid');
    }
    return 'grid';
  });

  // ⭐ NEW: Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // ⭐ NEW: Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      
      if (mobile && !localStorage.getItem('musicianGigsView')) {
        setView('carousel');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ⭐ NEW: Save view preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('musicianGigsView', view);
    }
  }, [view]);

  useEffect(() => {
    if (user) {
      fetchAvailableGigs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const fetchAvailableGigs = async () => {
    setLoading(true);
    try {
      // Fetch events with interest status
      const { data: eventsData, error } = await supabase
        .from("events")
        .select(`
          *,
          creator:creator_id(first_name, last_name, profile_picture_url),
          event_interests(id, musician_id)
        `)
        .eq("status", "open")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      if (error) throw error;

      // Mark events where musician has shown interest
      const enrichedEvents = eventsData.map((event) => ({
        ...event,
        hasShownInterest: event.event_interests?.some(
          (interest) => interest.musician_id === user.id
        ),
        interestedCount: event.event_interests?.length || 0,
      }));

      // Apply filters
      let filteredEvents = enrichedEvents;
      if (filter === "interested") {
        filteredEvents = enrichedEvents.filter((e) => e.hasShownInterest);
      } else if (filter === "matched") {
        // Could add genre/role matching logic here
        filteredEvents = enrichedEvents;
      }

      setEvents(filteredEvents);
    } catch (error) {
      console.error("Error fetching gigs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowInterest = async (eventId) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setProcessingInterest({ ...processingInterest, [eventId]: true });

    try {
      const event = events.find((e) => e.id === eventId);

      if (event.hasShownInterest) {
        // Remove interest
        console.log('🗑️ Removing interest...', { eventId, userId: user.id });

        const { error } = await supabase
          .from("event_interests")
          .delete()
          .eq("event_id", eventId)
          .eq("musician_id", user.id);

        if (error) {
          console.error('❌ Delete error:', {
            message: error.message,
            details: error.details,
            code: error.code,
          });
          throw new Error(error.message || 'Failed to remove interest');
        }

        // Update local state
        setEvents(
          events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  hasShownInterest: false,
                  interestedCount: Math.max(0, e.interestedCount - 1),
                }
              : e
          )
        );
        
        console.log('✅ Interest removed');
      } else {
        // Show interest
        console.log('📝 Showing interest...', { eventId, userId: user.id });

        // Check if already interested (prevents duplicate key error)
        const { data: existing, error: checkError } = await supabase
          .from("event_interests")
          .select('id')
          .eq("event_id", eventId)
          .eq("musician_id", user.id)
          .maybeSingle();

        if (checkError) {
          console.error('❌ Check error:', {
            message: checkError.message,
            details: checkError.details,
            code: checkError.code,
          });
          throw new Error(checkError.message || 'Failed to check interest');
        }

        if (existing) {
          console.log('⚠️ Already showed interest');
          alert("You already showed interest in this event");
          
          // Update local state to match database
          setEvents(
            events.map((e) =>
              e.id === eventId
                ? { ...e, hasShownInterest: true }
                : e
            )
          );
          return;
        }

        const { data, error } = await supabase
          .from("event_interests")
          .insert({
            event_id: eventId,
            musician_id: user.id,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Insert error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw new Error(error.message || 'Failed to register interest');
        }

        console.log('✅ Interest registered:', data);

        // Update local state
        setEvents(
          events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  hasShownInterest: true,
                  interestedCount: e.interestedCount + 1,
                }
              : e
          )
        );
      }
    } catch (error) {
      console.error("❌ Error updating interest:", error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      
      // User-friendly error message
      let userMessage = "Failed to update interest. Please try again.";
      
      if (error.message?.includes('duplicate')) {
        userMessage = "You already showed interest in this event";
      } else if (error.message?.includes('permission')) {
        userMessage = "You don't have permission to do this";
      } else if (error.message?.includes('foreign key')) {
        userMessage = "Event not found";
      } else if (error.message) {
        userMessage = error.message;
      }
      
      alert(userMessage);
    } finally {
      setProcessingInterest({ ...processingInterest, [eventId]: false });
    }
  };

  const filteredEvents = events.filter(
    (event) =>
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Available Gigs
            </h1>
            <button
              onClick={() => router.push("/musician/bookings")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
            >
              My Bookings
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filters & View Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {[
                { id: "all", label: "All Events", icon: TrendingUp },
                { id: "interested", label: "My Interests", icon: CheckCircle },
                { id: "matched", label: "Matched", icon: Filter },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                      filter === tab.id
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ⭐ NEW: View Toggle */}
            {filteredEvents.length > 0 && (
              <ViewToggle 
                view={view} 
                onChange={setView}
                isMobile={isMobile}
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
              >
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Events Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === "interested"
                ? "You haven't shown interest in any events yet"
                : "Check back soon for new gig opportunities"}
            </p>
          </div>
        ) : (
          <>
            {/* ⭐ NEW: Carousel View */}
            {view === 'carousel' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Swipe to explore gigs →
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredEvents.length} gigs
                  </p>
                </div>
                <CarouselView
                  items={filteredEvents}
                  itemWidth={320}
                  renderItem={(event) => (
                    <EventCard 
                      event={event} 
                      onShowInterest={handleShowInterest}
                      onViewDetails={() => router.push(`/events/${event.id}`)}
                      processingInterest={processingInterest}
                    />
                  )}
                />
              </div>
            )}

            {/* Grid View */}
            {view === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard 
                    key={event.id}
                    event={event} 
                    onShowInterest={handleShowInterest}
                    onViewDetails={() => router.push(`/events/${event.id}`)}
                    processingInterest={processingInterest}
                  />
                ))}
              </div>
            )}

            {/* ⭐ NEW: List View (Desktop only) */}
            {view === 'list' && !isMobile && (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition flex items-center gap-4"
                  >
                    {/* Event Image/Icon */}
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20">
                      {event.media_url ? (
                        <Image
                          src={event.media_url}
                          alt={event.title}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-purple-300 dark:text-purple-700" />
                        </div>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 mb-1">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {event.event_date && (
                          <span>📅 {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        )}
                        {event.venue && (
                          <span className="line-clamp-1">📍 {event.venue}</span>
                        )}
                        {event.interestedCount > 0 && (
                          <span>👥 {event.interestedCount} interested</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                        {event.description}
                      </p>
                    </div>

                    {/* Budget & Actions */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      {event.proposed_amount && (
                        <div className="text-right">
                          <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
                            ₦{event.proposed_amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/events/${event.id}`)}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleShowInterest(event.id)}
                          disabled={processingInterest[event.id]}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
                            event.hasShownInterest
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : "bg-purple-600 hover:bg-purple-700 text-white"
                          }`}
                        >
                          {processingInterest[event.id] ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : event.hasShownInterest ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span className="hidden sm:inline">Interested</span>
                            </>
                          ) : (
                            <span>Interest</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ⭐ NEW: Event Card Component (Extracted for reuse)
function EventCard({ event, onShowInterest, onViewDetails, processingInterest }) {
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 h-full flex flex-col">
      {/* Event Image */}
      {event.media_url ? (
        <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
          <Image
            src={event.media_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Interest Badge */}
          {event.interestedCount > 0 && (
            <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-gray-900 dark:text-white">
              {event.interestedCount} interested
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
          <Calendar className="w-16 h-16 text-purple-300 dark:text-purple-700" />
        </div>
      )}

      {/* Content */}
      <div className="p-5 space-y-3 flex-1 flex flex-col">
        {/* Title & Type */}
        <div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {event.title}
          </h3>
          {event.event_type && (
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              {event.event_type}
            </p>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {event.description}
        </p>

        {/* Details */}
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
              <span>
                {new Date(event.event_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          {event.duration && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{event.duration} hours</span>
            </div>
          )}

          {event.expected_attendees && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>~{event.expected_attendees} attendees</span>
            </div>
          )}
        </div>

        {/* Budget */}
        {event.proposed_amount && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Budget
            </span>
            <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
              ₦{event.proposed_amount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 mt-auto">
          <button
            onClick={onViewDetails}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">View Details</span>
            <span className="sm:hidden">View</span>
          </button>
          <button
            onClick={() => onShowInterest(event.id)}
            disabled={processingInterest[event.id]}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition ${
              event.hasShownInterest
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            {processingInterest[event.id] ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : event.hasShownInterest ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Interested</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Show Interest</span>
                <span className="sm:hidden">Interest</span>
              </>
            )}
          </button>
        </div>

        {/* Posted by */}
        {event.creator && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <span>Posted by:</span>
            <span className="font-medium">
              {event.creator.first_name} {event.creator.last_name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}