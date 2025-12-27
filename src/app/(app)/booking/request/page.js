// src/app/(app)/booking/request/page.js - FULLY FUNCTIONAL
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Calendar, MapPin, Clock, DollarSign, FileText, User, Send } from "lucide-react";

export default function BookingRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const musicianId = searchParams.get("musicianId");
  
  const [musician, setMusician] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    event_name: "",
    event_type: "",
    event_date: "",
    event_time: "",
    event_duration: "",
    event_location: "",
    event_address: "",
    budget: "",
    description: "",
    special_requests: "",
  });

  const eventTypes = [
    "Wedding",
    "Birthday Party",
    "Corporate Event",
    "Concert",
    "Church Service",
    "Funeral",
    "Anniversary",
    "Festival",
    "Private Party",
    "Other"
  ];

  useEffect(() => {
    if (!user && !authLoading) {
      router.push("/login?redirect=/booking/request");
      return;
    }

    if (user?.role !== "CLIENT") {
      router.push("/");
      return;
    }

    if (musicianId) {
      fetchMusician();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, musicianId]);

  const fetchMusician = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, primary_role, hourly_rate, location")
      .eq("id", musicianId)
      .eq("role", "MUSICIAN")
      .single();

    if (!error && data) {
      setMusician(data);
      // Pre-fill budget if hourly rate exists
      if (data.hourly_rate) {
        setFormData(prev => ({ ...prev, budget: data.hourly_rate.toString() }));
      }
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Combine date and time
      const eventDateTime = `${formData.event_date}T${formData.event_time}:00`;

      // Create event first
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .insert({
          title: formData.event_name,
          event_type: formData.event_type,
          description: formData.description,
          date: eventDateTime,
          location: formData.event_location,
          created_by: user.id,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create booking
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          client_id: user.id,
          musician_id: musicianId || null,
          event_id: eventData.id,
          event_date: eventDateTime,
          event_location: formData.event_location,
          event_duration: parseFloat(formData.event_duration) || null,
          amount: parseFloat(formData.budget) || 0,
          notes: formData.special_requests,
          status: musicianId ? "pending" : "open", // pending if musician selected, open if general request
          payment_status: "pending",
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        if (musicianId) {
          router.push(`/client/bookings/${bookingData.id}`);
        } else {
          router.push("/client/bookings");
        }
      }, 2000);

    } catch (err) {
      console.error("Booking request error:", err);
      setError(err.message || "Failed to submit booking request");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Booking Request Sent!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {musicianId 
              ? "The musician will review your request and respond soon."
              : "Musicians in your area will be notified of your request."}
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              Redirecting to your bookings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Request a Booking
          </h1>
          {musician ? (
            <p className="text-gray-600 dark:text-gray-400">
              Booking {musician.first_name} {musician.last_name} - {musician.primary_role}
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Find the perfect musician for your event
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
          {/* Event Details Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Event Details
            </h2>

            <div className="space-y-4">
              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  name="event_name"
                  value={formData.event_name}
                  onChange={handleChange}
                  placeholder="e.g., Sarah's Wedding Reception"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Type *
                </label>
                <select
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select event type</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="event_time"
                    value={formData.event_time}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  name="event_duration"
                  value={formData.event_duration}
                  onChange={handleChange}
                  placeholder="3"
                  min="0.5"
                  step="0.5"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Venue/City *
                </label>
                <input
                  type="text"
                  name="event_location"
                  value={formData.event_location}
                  onChange={handleChange}
                  placeholder="Lagos, Nigeria"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Address (Optional)
                </label>
                <input
                  type="text"
                  name="event_address"
                  value={formData.event_address}
                  onChange={handleChange}
                  placeholder="123 Main Street, Victoria Island"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Budget & Description */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Budget & Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget (₦) *
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="50000"
                  min="0"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {musician?.hourly_rate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Musician&apos;s rate: ₦{musician.hourly_rate.toLocaleString()}/hr
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your event, expected guests, atmosphere, etc."
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Special Requests
                </label>
                <textarea
                  name="special_requests"
                  value={formData.special_requests}
                  onChange={handleChange}
                  placeholder="Any specific songs, equipment needs, or special requirements?"
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[56px] bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending Request...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Booking Request
                </>
              )}
            </button>
            
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
              {musicianId 
                ? "The musician will be notified and can accept or propose changes"
                : "Multiple musicians in your area will be notified"}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}