// src/app/(app)/musician/events/page.js - COMPLETE WITH EXTERNAL EVENTS
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  Loader,
  Eye,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

export default function MusicianEventsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [amplygigEvents, setAmplygigEvents] = useState([]);
  const [externalEvents, setExternalEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [externalLoading, setExternalLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | interested
  const [processingInterest, setProcessingInterest] = useState({});

  useEffect(() => {
    if (user) {
      fetchAmplygigEvents();
      fetchExternalEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAmplygigEvents = async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching AmplyGigs events for user:", user?.id);

      // FIXED: Removed date filter to show ALL events (past and future)
      const { data: eventsData, error } = await supabase
        .from("events")
        .select(`
          *,
          creator:creator_id(first_name, last_name, profile_picture_url),
          event_interests(id, musician_id)
        `)
        .eq("status", "open")
        .order("event_date", { ascending: false }); // Show newest first

      if (error) {
        console.error("Error fetching events:", error);
        throw error;
      }

      console.log("✅ Fetched AmplyGigs events:", eventsData?.length);

      // Mark events where musician has shown interest
      const enrichedEvents = (eventsData || []).map((event) => ({
        ...event,
        hasShownInterest: event.event_interests?.some(
          (interest) => interest.musician_id === user.id
        ),
        interestedCount: event.event_interests?.length || 0,
      }));

      setAmplygigEvents(enrichedEvents);
    } catch (error) {
      console.error("Error fetching AmplyGigs events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExternalEvents = async () => {
    setExternalLoading(true);
    try {
      console.log("🌍 Fetching external events...");

      // Fetch from external_events table (from your scraper/API)
      const { data: externalData, error } = await supabase
        .from("external_events")
        .select("*")
        .order("date", { ascending: true })
        .limit(20);

      if (error) {
        console.error("Error fetching external events:", error);
        // Don't throw - external events are optional
      } else {
        console.log("✅ Fetched external events:", externalData?.length);
        setExternalEvents(externalData || []);
      }
    } catch (error) {
      console.error("Error fetching external events:", error);
    } finally {
      setExternalLoading(false);
    }
  };

  // REPLACE handleShowInterest in src/app/(app)/musician/events/page.js

const handleShowInterest = async (eventId) => {
  if (!user) {
    alert("Please log in to express interest.");
    return;
  }

  setProcessingInterest({ ...processingInterest, [eventId]: true });

  try {
    const event = amplygigEvents.find((e) => e.id === eventId);

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
      setAmplygigEvents(
        amplygigEvents.map((e) =>
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
      alert("Interest removed");
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
        setAmplygigEvents(
          amplygigEvents.map((e) =>
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
      setAmplygigEvents(
        amplygigEvents.map((e) =>
          e.id === eventId
            ? {
                ...e,
                hasShownInterest: true,
                interestedCount: e.interestedCount + 1,
              }
            : e
        )
      );
      
      alert("Interest expressed successfully!");
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


  const filteredAmplygigEvents =
    filter === "interested"
      ? amplygigEvents.filter((e) => e.hasShownInterest)
      : amplygigEvents;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🎵 Available Events
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Browse client events and public gigs
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  fetchAmplygigEvents();
                  fetchExternalEvents();
                }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push("/musician/bookings")}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition text-sm"
              >
                My Bookings
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                filter === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              All Events ({amplygigEvents.length})
            </button>
            <button
              onClick={() => setFilter("interested")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                filter === "interested"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              My Interests ({amplygigEvents.filter((e) => e.hasShownInterest).length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-12">
        {/* AmplyGigs Events Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🎸 AmplyGigs Events
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Posted by clients on AmplyGigs
              </p>
            </div>
          </div>

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
          ) : filteredAmplygigEvents.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {filter === "interested"
                  ? "No Interested Events"
                  : "No Events Available"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === "interested"
                  ? "You haven't shown interest in any events yet"
                  : "Check back soon for new gig opportunities"}
              </p>
              {filter === "interested" && (
                <button
                  onClick={() => setFilter("all")}
                  className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                >
                  Browse All Events
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAmplygigEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onShowInterest={handleShowInterest}
                  processing={processingInterest[event.id]}
                  router={router}
                />
              ))}
            </div>
          )}
        </section>

        {/* External Events Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🌍 Public Events
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Music events from around the web
              </p>
            </div>
          </div>

          {externalLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
                >
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : externalEvents.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <ExternalLink className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No External Events Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                External events will appear here when available
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {externalEvents.map((event) => (
                <ExternalEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// AmplyGigs Event Card Component
function EventCard({ event, onShowInterest, processing, router }) {
  const isPastEvent = new Date(event.event_date) < new Date();

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300">
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
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {event.interestedCount > 0 && (
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                <Users className="w-3 h-3" />
                {event.interestedCount}
              </div>
            )}
            {isPastEvent && (
              <div className="bg-red-500/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-white">
                Past Event
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
          <Calendar className="w-16 h-16 text-purple-300 dark:text-purple-700" />
        </div>
      )}

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Title & Type */}
        <div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {event.title}
          </h3>
          {event.event_type && (
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mt-1">
              {event.event_type}
            </p>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {event.description}
        </p>

        {/* Details */}
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
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => router.push(`/events/${event.id}`)}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>

          {!isPastEvent && (
            <button
              onClick={() => onShowInterest(event.id)}
              disabled={processing}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition ${
                event.hasShownInterest
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              {processing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : event.hasShownInterest ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Interested</span>
                </>
              ) : (
                "Show Interest"
              )}
            </button>
          )}
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

// External Event Card Component
function ExternalEventCard({ event }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition">
      {/* Event Image */}
      {event.image && (
        <div className="relative h-40 bg-gray-200 dark:bg-gray-700">
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            External
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-1 text-sm">
          {event.venue && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{event.venue}</span>
            </div>
          )}

          {event.date && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {new Date(event.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* External Link Button */}
        {event.link && (
          <a
            href={event.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium text-center transition"
          >
            View Event Details →
          </a>
        )}
      </div>
    </div>
  );
}





