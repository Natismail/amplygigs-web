// src/app/(app)/events/[id]/edit/page.js - EVENT EDIT PAGE
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { 
  X, Save, Loader2, MapPin, Locate, Calendar, 
  DollarSign, Users, Clock, FileText 
} from "lucide-react";

export default function EventEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "",
    venue: "",
    city: "",
    country: "Nigeria",
    latitude: null,
    longitude: null,
    event_date: "",
    event_time: "",
    duration: "",
    expected_attendees: "",
    proposed_amount: "",
    requirements: "",
    status: "open",
  });

  const eventTypes = [
    "Wedding", "Birthday", "Corporate Event", "Concert", 
    "Festival", "Club Night", "Private Party", "Other"
  ];

  useEffect(() => {
    if (id && user) {
      fetchEvent();
    }
  }, [id, user]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Check if user owns this event
      if (data.creator_id !== user.id) {
        setError("You don't have permission to edit this event");
        return;
      }

      // Populate form
      setForm({
        title: data.title || "",
        description: data.description || "",
        event_type: data.event_type || "",
        venue: data.venue || "",
        city: data.city || "",
        country: data.country || "Nigeria",
        latitude: data.latitude,
        longitude: data.longitude,
        event_date: data.event_date ? data.event_date.split('T')[0] : "",
        event_time: data.event_date ? data.event_date.split('T')[1]?.substring(0, 5) : "",
        duration: data.duration || "",
        expected_attendees: data.expected_attendees || "",
        proposed_amount: data.proposed_amount || "",
        requirements: data.requirements || "",
        status: data.status || "open",
      });

    } catch (err) {
      console.error("Error fetching event:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setGettingLocation(false);
        reverseGeocode(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setError("Failed to get location");
        setGettingLocation(false);
      }
    );
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `/api/geocode?lat=${lat}&lng=${lng}`
      );
      const data = await response.json();
      
      if (data.city) {
        setForm(prev => ({
          ...prev,
          city: data.city,
          country: data.country || 'Nigeria'
        }));
      }
    } catch (err) {
      console.error("Geocode error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title || !form.description) {
      setError("Title and description are required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let eventDateTime = form.event_date;
      if (form.event_time) {
        eventDateTime = `${form.event_date}T${form.event_time}:00`;
      }

      const updateData = {
        title: form.title,
        description: form.description,
        event_type: form.event_type,
        venue: form.venue,
        city: form.city,
        country: form.country,
        latitude: form.latitude,
        longitude: form.longitude,
        event_date: eventDateTime,
        duration: form.duration ? parseInt(form.duration) : null,
        expected_attendees: form.expected_attendees ? parseInt(form.expected_attendees) : null,
        proposed_amount: form.proposed_amount ? parseFloat(form.proposed_amount) : null,
        requirements: form.requirements,
        status: form.status,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("events")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      // If event has bookings, update their coordinates too
      if (form.latitude && form.longitude) {
        await supabase
          .from("bookings")
          .update({
            event_latitude: form.latitude,
            event_longitude: form.longitude,
          })
          .eq("event_id", id);
      }

      alert("Event updated successfully!");
      router.push(`/events/${id}`);

    } catch (err) {
      console.error("Error updating event:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error && !form.title) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">{error}</h2>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-700 font-medium mb-4 inline-flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Event
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Update event details and location
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Event Type
                </label>
                <select
                  value={form.event_type}
                  onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select type</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none"
                  rows="4"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Venue
                </label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  placeholder="e.g., Oriental Hotel, Lagos"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-blue-700 dark:text-blue-300 font-medium"
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <Locate className="w-5 h-5" />
                    Update GPS Coordinates
                  </>
                )}
              </button>

              {(form.latitude && form.longitude) && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">GPS Coordinates Set</span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1 font-mono">
                    {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                  </p>
                  {form.city && (
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      📍 {form.city}, {form.country}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Event Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Date
                </label>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Time
                </label>
                <input
                  type="time"
                  value={form.event_time}
                  onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duration (hours)
                </label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Expected Attendees
                </label>
                <input
                  type="number"
                  value={form.expected_attendees}
                  onChange={(e) => setForm({ ...form, expected_attendees: e.target.value })}
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Proposed Budget (₦)
                </label>
                <input
                  type="number"
                  value={form.proposed_amount}
                  onChange={(e) => setForm({ ...form, proposed_amount: e.target.value })}
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Special Requirements
            </h2>

            <textarea
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              placeholder="Any specific requirements..."
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none"
              rows="3"
            />
          </div>

          {/* Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Event Status
            </h2>

            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}