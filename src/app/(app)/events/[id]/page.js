// src/app/(app)/events/[id]/page.js
// CHANGES vs original:
//   1. MusicianCard click → profile navigation only for isOwner
//   2. Double booking protection: if client already has a booking for this event
//      (with a DIFFERENT musician), shows a cancellation modal with late fee
//      calculation before allowing a new booking to proceed
//   3. All other functionality unchanged

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/components/CurrencySelector";
import MusicianCard from "@/components/MusicianCard";
import Image from "next/image";
import {
  Calendar, MapPin, Users, DollarSign, Clock, Edit, Trash2,
  CheckCircle, XCircle, TrendingUp, Music, Star, AlertTriangle, X,
} from "lucide-react";

// ── Cancellation fee calculator ────────────────────────────────────────────────
function getCancellationFee(eventDate, bookingAmount) {
  if (!eventDate || !bookingAmount) return { pct: 0, amount: 0, label: "No fee" };
  const daysToEvent = Math.ceil((new Date(eventDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysToEvent >= 30) return { pct: 0,   amount: 0,                              label: "No cancellation fee (30+ days)" };
  if (daysToEvent >= 14) return { pct: 25,  amount: bookingAmount * 0.25,           label: "25% late cancellation fee (14–29 days)" };
  if (daysToEvent >= 7)  return { pct: 50,  amount: bookingAmount * 0.50,           label: "50% late cancellation fee (7–13 days)" };
  return                        { pct: 100, amount: bookingAmount * 1.00,           label: "No refund — less than 7 days to event" };
}

// ── Cancel + Rebook Confirmation Modal ────────────────────────────────────────
function CancelRebookModal({ existingBooking, newMusician, event, onConfirm, onClose, loading }) {
  const fee = getCancellationFee(event?.event_date, existingBooking?.amount);
  const currency = event?.currency || "NGN";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Switch Musician?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">You already have an active booking</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current booking info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current Booking</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {existingBooking.musician_name || "Existing musician"}
          </p>
          {existingBooking.amount > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Amount: {formatCurrency(existingBooking.amount, currency)}
            </p>
          )}
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
            existingBooking.status === "confirmed"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}>
            {existingBooking.status}
          </span>
        </div>

        {/* Cancellation fee warning */}
        <div className={`rounded-xl p-4 mb-4 ${
          fee.pct === 0
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            : fee.pct === 100
            ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            : "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
        }`}>
          <p className={`text-sm font-semibold mb-1 ${
            fee.pct === 0 ? "text-green-800 dark:text-green-200"
            : fee.pct === 100 ? "text-red-800 dark:text-red-200"
            : "text-orange-800 dark:text-orange-200"
          }`}>
            {fee.pct === 0 ? "✅" : fee.pct === 100 ? "🚫" : "⚠️"} {fee.label}
          </p>
          {fee.pct > 0 && existingBooking.amount > 0 && (
            <p className={`text-sm ${fee.pct === 100 ? "text-red-700 dark:text-red-300" : "text-orange-700 dark:text-orange-300"}`}>
              Cancellation fee: <strong>{formatCurrency(fee.amount, currency)}</strong>
              {fee.pct < 100 && (
                <span className="text-xs ml-1">
                  (you will receive {formatCurrency(existingBooking.amount - fee.amount, currency)} back)
                </span>
              )}
            </p>
          )}
        </div>

        {/* New musician */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6 border border-purple-200 dark:border-purple-800">
          <p className="text-xs font-semibold text-purple-500 dark:text-purple-400 uppercase tracking-wide mb-1">New Booking</p>
          <p className="font-medium text-purple-900 dark:text-purple-100">
            {newMusician?.first_name} {newMusician?.last_name}
            {newMusician?.primary_role && (
              <span className="text-xs text-purple-600 dark:text-purple-400 ml-2">· {newMusician.primary_role}</span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            Keep Current
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
              fee.pct === 100
                ? "bg-red-600 hover:bg-red-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              `Cancel & Book ${newMusician?.first_name || "New"}`
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
          This action cannot be undone. The cancellation fee (if any) will be deducted from your refund.
        </p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function EventDetailsPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const { user }  = useAuth();

  const [event,                setEvent]                = useState(null);
  const [interestedMusicians,  setInterestedMusicians]  = useState([]);
  const [existingBookings,     setExistingBookings]     = useState([]);
  const [loading,              setLoading]              = useState(true);
  const [deleting,             setDeleting]             = useState(false);
  const [bookingLoading,       setBookingLoading]       = useState(false);

  // Cancel + rebook modal state
  const [cancelModal, setCancelModal] = useState({
    open:            false,
    existingBooking: null,  // the booking to cancel
    newMusicianId:   null,  // the musician to book after cancellation
  });

  const isOwner = user?.id === event?.creator_id;
  // const canViewProfile =
  // isOwner || user?.id === musician.id;

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      fetchExistingBookings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Re-fetch bookings when isOwner resolves
  useEffect(() => {
    if (isOwner !== undefined && id) fetchExistingBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          creator:creator_id(first_name, last_name, profile_picture_url),
          event_interests (
            id, musician_id, created_at,
            user_profiles (
              id, first_name, last_name, display_name, primary_role,
              profile_picture_url, bio, average_rating, hourly_rate,
              genres, location, available
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setEvent(data);
      setInterestedMusicians(
        data.event_interests?.map(interest => ({
          ...interest.user_profiles,
          interest_id:    interest.id,
          interested_at:  interest.created_at,
        })) || []
      );
    } catch (err) {
      console.error("Error fetching event details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingBookings = async () => {
    if (!user?.id || !id) return;
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id, musician_id, status, amount, currency,
          musician:musician_id(first_name, last_name)
        `)
        .eq("event_id", id)
        .eq("client_id", user.id)
        .in("status", ["pending", "confirmed", "completed"]);

      if (error) throw error;
      // Flatten musician name onto booking object for easy display
      setExistingBookings(
        (data || []).map(b => ({
          ...b,
          musician_name: b.musician
            ? `${b.musician.first_name} ${b.musician.last_name}`
            : "Unknown musician",
        }))
      );
    } catch (err) {
      console.error("Error fetching existing bookings:", err);
    }
  };

  const hasExistingBookingWith = (musicianId) =>
    existingBookings.some(b => b.musician_id === musicianId);

  const getMusicianStatus = (musician) => {
    if (!musician.available)
      return { canBook: false, reason: "Unavailable", color: "red" };
    if (hasExistingBookingWith(musician.id))
      return { canBook: false, reason: "Already Booked", color: "blue" };
    return { canBook: true, reason: "Available", color: "green" };
  };

  // ── Booking flow ─────────────────────────────────────────────────────────────
  const handleCreateBooking = async (musicianId) => {
    const musician = interestedMusicians.find(m => m.id === musicianId);
    const status   = getMusicianStatus(musician);

    if (!status.canBook) {
      alert(`❌ Cannot create booking: ${status.reason}`);
      return;
    }

    // Check if client already has a DIFFERENT musician booked for this event
    const conflictingBooking = existingBookings.find(b => b.musician_id !== musicianId);

    if (conflictingBooking) {
      // Show cancellation modal instead of proceeding
      setCancelModal({
        open:            true,
        existingBooking: conflictingBooking,
        newMusicianId:   musicianId,
      });
      return;
    }

    // No conflict — proceed directly
    await executeBooking(musicianId);
  };

  const executeBooking = async (musicianId) => {
    setBookingLoading(true);
    try {
      const { data, error } = await supabase.from("bookings").insert({
        client_id:      user.id,
        musician_id:    musicianId,
        event_id:       id,
        event_date:     event.event_date,
        event_location: event.venue || "Location TBD",
        amount:         event.proposed_amount || null,
        currency:       event.currency || "NGN",
        status:         "pending",
      }).select().single();

      if (error) throw error;
      await fetchExistingBookings();
      router.push(`/client/bookings/${data.id}`);
    } catch (err) {
      console.error("Error creating booking:", err);
      alert("Failed to create booking: " + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAndRebook = async () => {
    const { existingBooking, newMusicianId } = cancelModal;
    setBookingLoading(true);

    try {
      // 1. Cancel the existing booking
      const { error: cancelErr } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", existingBooking.id);

      if (cancelErr) throw cancelErr;

      // 2. Create the new booking
      const { data, error: bookErr } = await supabase.from("bookings").insert({
        client_id:      user.id,
        musician_id:    newMusicianId,
        event_id:       id,
        event_date:     event.event_date,
        event_location: event.venue || "Location TBD",
        amount:         event.proposed_amount || null,
        currency:       event.currency || "NGN",
        status:         "pending",
        notes:          `Switched from previous booking (${existingBooking.id})`,
      }).select().single();

      if (bookErr) throw bookErr;

      setCancelModal({ open: false, existingBooking: null, newMusicianId: null });
      await fetchExistingBookings();
      router.push(`/client/bookings/${data.id}`);
    } catch (err) {
      console.error("Error during cancel + rebook:", err);
      alert("Failed to switch booking: " + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      alert("Event deleted successfully");
      router.push("/client/home");
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600" />
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">This event doesn&apos;t exist or has been removed</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
          Go Back
        </button>
      </div>
    </div>
  );

  const newMusicianForModal = interestedMusicians.find(m => m.id === cancelModal.newMusicianId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Cancel + Rebook Modal */}
      {cancelModal.open && cancelModal.existingBooking && newMusicianForModal && (
        <CancelRebookModal
          existingBooking={cancelModal.existingBooking}
          newMusician={newMusicianForModal}
          event={event}
          onConfirm={handleCancelAndRebook}
          onClose={() => setCancelModal({ open: false, existingBooking: null, newMusicianId: null })}
          loading={bookingLoading}
        />
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          {event.media_url && (
            <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden mb-6 shadow-2xl">
              <Image src={event.media_url} alt={event.title} fill className="object-cover" priority />
            </div>
          )}

          <div className="text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {event.event_type && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                      <Star className="w-3.5 h-3.5" />{event.event_type}
                    </span>
                  )}
                  {event.category && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/30 backdrop-blur rounded-full text-sm font-medium">
                      <Music className="w-3.5 h-3.5" />{event.category}
                    </span>
                  )}
                  {event.subcategories?.length > 0 && (
                    <span className="inline-block px-3 py-1 bg-green-500/30 backdrop-blur rounded-full text-sm font-medium">
                      {event.subcategories.slice(0, 3).join(", ")}
                      {event.subcategories.length > 3 && ` +${event.subcategories.length - 3}`}
                    </span>
                  )}
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/events/${id}/edit`)}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur transition">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="p-3 bg-red-500/80 hover:bg-red-600 rounded-lg backdrop-blur transition disabled:opacity-50">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-lg text-white/90 mb-6">{event.description}</p>

            <div className="flex flex-wrap gap-4 text-sm">
              {event.venue && <div className="flex items-center gap-2"><MapPin className="w-5 h-5" />{event.venue}</div>}
              {event.event_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {new Date(event.event_date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
                </div>
              )}
              {event.duration && <div className="flex items-center gap-2"><Clock className="w-5 h-5" />{event.duration} hours</div>}
              {event.expected_attendees && <div className="flex items-center gap-2"><Users className="w-5 h-5" />~{event.expected_attendees} attendees</div>}
              {event.proposed_amount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {formatCurrency(event.proposed_amount, event.currency || "NGN")} budget
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {event.requirements && (
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Requirements</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{event.requirements}</p>
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
              <span className="text-sm text-gray-600 dark:text-gray-400">Only available musicians can be booked</span>
            )}
          </div>

          {interestedMusicians.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Musicians Yet</h3>
              <p className="text-gray-600 dark:text-gray-400">Musicians will appear here when they show interest in your event</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interestedMusicians.map((musician) => {
                const status = getMusicianStatus(musician);
                  const canViewProfile = isOwner || user?.id === musician.id;

                return (
                  <div key={musician.id} className="relative">
                      <div
  className={`relative ${canViewProfile ? 'cursor-pointer' : 'cursor-not-allowed'}`}
  onClick={() => {
    if (canViewProfile) {
      router.push(`/profile/${musician.id}`);
    } else if (!user) {
      router.push('/signup');
    } else {
      alert("You can only view your own profile or profiles for events you created.");
    }
  }}
>
  {/* Blur overlay ONLY if restricted */}
  {!canViewProfile && (
    <div className="absolute inset-0 backdrop-blur-sm bg-white/10 dark:bg-black/10 z-10 flex items-center justify-center rounded-xl">
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-black/60 px-4 py-2 rounded-lg">
        🔒 Restricted
      </span>
    </div>
  )}

  <MusicianCard musician={musician} />
</div>
                    {/* Book / status button — owner only */}
                    {isOwner && (
                      <div className="mt-3">
                        {status.canBook ? (
                          <button
                            onClick={() => handleCreateBooking(musician.id)}
                            disabled={bookingLoading}
                            className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Create Booking
                          </button>
                        ) : (
                          <div className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-center ${
                            status.color === "blue"
                              ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          }`}>
                            <div className="flex items-center justify-center gap-2">
                              {status.color === "blue"
                                ? <><CheckCircle className="w-4 h-4" />{status.reason}</>
                                : <><XCircle className="w-4 h-4" />{status.reason}</>
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                      Interested {new Date(musician.interested_at).toLocaleDateString()}
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