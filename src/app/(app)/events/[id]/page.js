// src/app/(app)/events/[id]/page.js - WITH CURRENCY & CATEGORIES
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/components/CurrencySelector"; // ⭐ NEW
import MusicianCard from "@/components/MusicianCard";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  TrendingUp,
  Music, // ⭐ NEW
  Star, // ⭐ NEW
} from "lucide-react";

export default function EventDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [interestedMusicians, setInterestedMusicians] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user?.id === event?.creator_id;

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      if (isOwner) {
        fetchExistingBookings();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isOwner]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          creator:creator_id(first_name, last_name, profile_picture_url),
          event_interests (
            id,
            musician_id,
            created_at,
            user_profiles (
              id,
              first_name,
              last_name,
              display_name,
              primary_role,
              profile_picture_url,
              bio,
              average_rating,
              hourly_rate,
              genres,
              location,
              available
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      setEvent(data);
      setInterestedMusicians(
        data.event_interests?.map((interest) => ({
          ...interest.user_profiles,
          interest_id: interest.id,
          interested_at: interest.created_at,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching event details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingBookings = async () => {
    if (!user?.id || !id) return;
    
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("musician_id, status")
        .eq("event_id", id)
        .eq("client_id", user.id)
        .in("status", ["pending", "confirmed", "completed"]);

      if (error) throw error;

      setExistingBookings(data || []);
      console.log('📋 Existing bookings for this event:', data);
    } catch (error) {
      console.error("Error fetching existing bookings:", error);
    }
  };

  const hasExistingBooking = (musicianId) => {
    return existingBookings.some(b => b.musician_id === musicianId);
  };

  const getMusicianStatus = (musician) => {
    if (!musician.available) {
      return { canBook: false, reason: 'Unavailable', color: 'red' };
    }
    
    if (hasExistingBooking(musician.id)) {
      return { canBook: false, reason: 'Already Booked', color: 'blue' };
    }
    
    return { canBook: true, reason: 'Available', color: 'green' };
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);

      if (error) throw error;

      alert("Event deleted successfully");
      router.push("/client/home");
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateBooking = async (musicianId) => {
    const musician = interestedMusicians.find(m => m.id === musicianId);
    const status = getMusicianStatus(musician);
    
    if (!status.canBook) {
      alert(`❌ Cannot create booking: ${status.reason}`);
      return;
    }

    if (!confirm("Create a booking with this musician?")) return;

    try {
      const { data, error } = await supabase.from("bookings").insert({
        client_id: user.id,
        musician_id: musicianId,
        event_id: id,
        event_date: event.event_date,
        event_location: event.venue || 'Location TBD',
        amount: event.proposed_amount || null,
        currency: event.currency || 'NGN', // ⭐ NEW
        status: "pending",
      }).select().single();

      if (error) throw error;

      alert("✅ Booking created! The musician will be notified.");
      
      await fetchExistingBookings();
      
      router.push(`/client/bookings/${data.id}`);
    } catch (error) {
      console.error('❌ Error creating booking:', error);
      alert('Failed to create booking: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Event Not Found
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This event doesn&apos;t exist or has been removed
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          {event.media_url && (
            <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden mb-6 shadow-2xl">
              <Image
                src={event.media_url}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">{event.title}</h1>
                
                {/* ⭐ NEW: Category & Event Type Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {event.event_type && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                      <Star className="w-3.5 h-3.5" />
                      {event.event_type}
                    </span>
                  )}
                  
                  {event.category && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/30 backdrop-blur rounded-full text-sm font-medium">
                      <Music className="w-3.5 h-3.5" />
                      {event.category}
                    </span>
                  )}
                  
                  {event.subcategories && event.subcategories.length > 0 && (
                    <span className="inline-block px-3 py-1 bg-green-500/30 backdrop-blur rounded-full text-sm font-medium">
                      {event.subcategories.slice(0, 3).join(', ')}
                      {event.subcategories.length > 3 && ` +${event.subcategories.length - 3}`}
                    </span>
                  )}
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/events/${id}/edit`)}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur transition"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-3 bg-red-500/80 hover:bg-red-600 rounded-lg backdrop-blur transition disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-lg text-white/90 mb-6">{event.description}</p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              {event.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {event.venue}
                </div>
              )}
              {event.event_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {new Date(event.event_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              )}
              {event.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {event.duration} hours
                </div>
              )}
              {event.expected_attendees && (
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  ~{event.expected_attendees} attendees
                </div>
              )}
              {/* ⭐ ENHANCED: Currency Display */}
              {event.proposed_amount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {formatCurrency(event.proposed_amount, event.currency || 'NGN')} budget
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Requirements */}
        {event.requirements && (
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Requirements
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {event.requirements}
            </p>
          </section>
        )}

        {/* Interested Musicians */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              Interested Musicians ({interestedMusicians.length})
            </h2>
            {isOwner && interestedMusicians.length > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Only available musicians can be booked
              </span>
            )}
          </div>

          {interestedMusicians.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Musicians Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Musicians will appear here when they show interest in your event
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interestedMusicians.map((musician) => {
                const status = getMusicianStatus(musician);
                
                return (
                  <div key={musician.id} className="relative">
                    <MusicianCard musician={musician} />
                    
                    {isOwner && (
                      <div className="mt-3">
                        {status.canBook ? (
                          <button
                            onClick={() => handleCreateBooking(musician.id)}
                            className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm shadow-lg transition flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Create Booking
                          </button>
                        ) : (
                          <div className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-center ${
                            status.color === 'blue' 
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}>
                            {status.color === 'blue' ? (
                              <div className="flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {status.reason}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <XCircle className="w-4 h-4" />
                                {status.reason}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                      Interested{" "}
                      {new Date(musician.interested_at).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}