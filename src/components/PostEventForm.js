// src/components/PostEventForm.js - ENHANCED WITH GPS COORDINATES
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import CategorySelector from "@/components/musician/CategorySelector";
import CurrencySelector, { CURRENCIES, getCurrencyByCode } from "@/components/CurrencySelector";
import { X, ChevronLeft, ChevronRight, Upload, Check, MapPin, Locate } from "lucide-react";

export default function PostEventForm({ onSuccess, onCancel }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [gettingLocation, setGettingLocation] = useState(false);

  // const [form, setForm] = useState({
  //   title: "",
  //   description: "",
  //   event_type: "",
  //   venue: "",
  //   city: "",
  //   country: "Nigeria",
  //   latitude: null,
  //   longitude: null,
  //   event_date: "",
  //   event_time: "",
  //   duration: "",
  //   expected_attendees: "",
  //   proposed_amount: "",
  //   requirements: "",
  //   media_file: null,
  // });

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "",

    // ⭐ NEW: Categories
    categories: [],
    required_skills: [],
    preferred_genres: [],

    venue: "",
    city: "",
    country: "Nigeria",
    latitude: null,
    longitude: null,
    event_date: "",
    event_time: "",
    duration: "",
    expected_attendees: "",

    // ⭐ NEW: Currency
    currency: "NGN",
    country_code: "NG",
    proposed_amount: "",

    requirements: "",
    media_file: null,
  });

  const eventTypes = [
    "Wedding", "Birthday", "Corporate Event", "Concert",
    "Festival", "Club Night", "Private Party", "Other"
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setForm({ ...form, media_file: file });
    setError(null);

    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ⭐ NEW: Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        setGettingLocation(false);

        // Optionally reverse geocode to get city name
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.error("Location error:", error);
        setError("Failed to get location. Please enter manually.");
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // ⭐ NEW: Reverse geocode coordinates to city name
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();

      if (data.address) {
        setForm(prev => ({
          ...prev,
          city: data.address.city || data.address.town || data.address.state || '',
          country: data.address.country || 'Nigeria'
        }));
      }
    } catch (err) {
      console.error("Reverse geocode error:", err);
    }
  };

  // ⭐ NEW: Geocode venue address to coordinates
  const geocodeVenue = async (venue) => {
    if (!venue || venue.length < 3) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(venue)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setForm(prev => ({
          ...prev,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        }));
      }
    } catch (err) {
      console.error("Geocode error:", err);
    }
  };

  // ⭐ NEW: Debounced venue geocoding
  useEffect(() => {
    if (!form.venue) return;

    const timer = setTimeout(() => {
      if (form.venue && !form.latitude) {
        geocodeVenue(form.venue);
      }
    }, 1500); // Geocode after 1.5s of no typing

    return () => clearTimeout(timer);
  }, [form.venue]);

  const validateStep = (step) => {
    setError(null);

    if (step === 1) {
      if (!form.title.trim()) {
        setError("Event title is required");
        return false;
      }
      if (!form.description.trim()) {
        setError("Event description is required");
        return false;
      }
      if (!form.event_type) {
        setError("Please select an event type");
        return false;
      }
      // ⭐ NEW: Validate categories
      if (form.categories.length === 0) {
        setError("Please select at least one entertainment type");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!form.event_date) {
        setError("Event date is required");
        return false;
      }

      const selectedDate = new Date(form.event_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setError("Event date cannot be in the past");
        return false;
      }

      // ⭐ WARN if no GPS coordinates (but don't block)
      if (!form.latitude || !form.longitude) {
        console.warn("⚠️ No GPS coordinates provided for event");
      }

      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!user) {
      setError("You must be logged in to post an event.");
      setLoading(false);
      return;
    }

    try {
      let eventDateTime = form.event_date;
      if (form.event_time) {
        eventDateTime = `${form.event_date}T${form.event_time}:00`;
      }

      const proposedAmount = form.proposed_amount
        ? parseFloat(form.proposed_amount)
        : null;

      // ⭐ Extract category data
      const primaryCat = form.categories.find(c => c.isPrimary) || form.categories[0];
      const allSubcategories = form.categories.reduce((acc, cat) => {
        return [...acc, ...cat.subcategories];
      }, []);


      let mediaUrl = null;

      if (form.media_file) {
        const file = form.media_file;
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error("Failed to upload file. Make sure the 'posts' storage bucket exists.");
        }

        const { data } = supabase.storage
          .from("posts")
          .getPublicUrl(fileName);

        mediaUrl = data.publicUrl;
      }

      // ⭐ ENHANCED: Include GPS coordinates
      // const { data: eventData, error: dbError } = await supabase
      //   .from("events")
      //   .insert([{
      //     creator_id: user.id,
      //     title: form.title,
      //     description: form.description,
      //     event_type: form.event_type,
      //     venue: form.venue,
      //     city: form.city,
      //     country: form.country,
      //     latitude: form.latitude,
      //     longitude: form.longitude,
      //     event_date: eventDateTime,
      //     duration: form.duration ? parseInt(form.duration) : null,
      //     expected_attendees: form.expected_attendees ? parseInt(form.expected_attendees) : null,
      //     proposed_amount: proposedAmount,
      //     requirements: form.requirements,
      //     media_url: mediaUrl,
      //     status: 'open',
      //   }])

      const { data: eventData, error: dbError } = await supabase
        .from("events")
        .insert([{
          creator_id: user.id,
          title: form.title,
          description: form.description,
          event_type: form.event_type,

          // ⭐ NEW: Categories
          category: primaryCat?.category || null,
          subcategories: allSubcategories,
          required_skills: form.required_skills,
          preferred_genres: form.preferred_genres,

          venue: form.venue,
          city: form.city,
          country: form.country,
          latitude: form.latitude,
          longitude: form.longitude,
          event_date: eventDateTime,
          duration: form.duration ? parseInt(form.duration) : null,
          expected_attendees: form.expected_attendees ? parseInt(form.expected_attendees) : null,

          // ⭐ NEW: Currency
          currency: form.currency,
          country_code: form.country_code,
          proposed_amount: proposedAmount,

          requirements: form.requirements,
          media_url: mediaUrl,
          status: 'open',
        }])
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      console.log('✅ Event created with GPS:', {
        id: eventData.id,
        latitude: eventData.latitude,
        longitude: eventData.longitude
      });

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) {
          onSuccess(eventData);
        }
      }, 2000);

      // setForm({
      //   title: "",
      //   description: "",
      //   event_type: "",
      //   venue: "",
      //   city: "",
      //   country: "Nigeria",
      //   latitude: null,
      //   longitude: null,
      //   event_date: "",
      //   event_time: "",
      //   duration: "",
      //   expected_attendees: "",
      //   proposed_amount: "",
      //   requirements: "",
      //   media_file: null,
      // });

      setForm({
        title: "",
        description: "",
        event_type: "",
        categories: [], // ⭐ NEW
        required_skills: [], // ⭐ NEW
        preferred_genres: [], // ⭐ NEW
        venue: "",
        city: "",
        country: "Nigeria",
        latitude: null,
        longitude: null,
        event_date: "",
        event_time: "",
        duration: "",
        expected_attendees: "",
        currency: "NGN", // ⭐ NEW
        country_code: "NG", // ⭐ NEW
        proposed_amount: "",
        requirements: "",
        media_file: null,
      });
      setMediaPreview(null);
      setCurrentStep(1);
    } catch (err) {
      setError(err.message);
      console.error("Post event error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Post a New Event</h2>
            <p className="text-purple-100 text-sm mt-1">
              Step {currentStep} of 3
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:bg-white/20 rounded-full p-2 transition"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="h-2 bg-purple-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-6 overflow-y-auto flex-1">
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl p-4 mb-4 flex items-center gap-3 animate-fadeIn">
            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200 font-medium">
              Event posted successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-4 mb-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Birthday Celebration, Corporate Dinner"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Event Type *
                </label>
                <select
                  value={form.event_type}
                  onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  required
                >
                  <option value="">Select event type</option>
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
                  placeholder="Describe your event, the atmosphere you want, music style preferences..."
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none text-base"
                  rows="4"
                  required
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {form.description.length}/500 characters
                </p>
              </div>
              {/* ⭐ NEW: Entertainment Categories */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Entertainment Type Needed *
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  What type of entertainment are you looking for? This helps musicians find your event.
                </p>
                <CategorySelector
                  value={form.categories}
                  onChange={(categories) => setForm({ ...form, categories })}
                  error={null}
                  maxCategories={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Event Details + Location */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              {/* ⭐ NEW: Venue with GPS */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Venue / Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    placeholder="e.g., Oriental Hotel, Victoria Island, Lagos"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Type venue address - GPS coordinates will be detected automatically
                </p>
              </div>

              {/* ⭐ NEW: Current Location Button */}
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-blue-700 dark:text-blue-300 font-medium"
              >
                {gettingLocation ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    Getting location...
                  </>
                ) : (
                  <>
                    <Locate className="w-5 h-5" />
                    Use My Current Location
                  </>
                )}
              </button>

              {/* ⭐ NEW: GPS Coordinates Display */}
              {(form.latitude && form.longitude) && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 dark:text-green-200 font-medium">
                      Location detected
                    </span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={form.event_time}
                    onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g., 4"
                    min="1"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Expected Attendees
                  </label>
                  <input
                    type="number"
                    value={form.expected_attendees}
                    onChange={(e) => setForm({ ...form, expected_attendees: e.target.value })}
                    placeholder="e.g., 100"
                    min="1"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                </div>
              </div>

              {/* <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Proposed Budget (₦)
                </label>
                <input
                  type="number"
                  value={form.proposed_amount}
                  onChange={(e) => setForm({ ...form, proposed_amount: e.target.value })}
                  placeholder="e.g., 50000"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This helps musicians provide appropriate quotes
                </p>
              </div> */}

              {/* ⭐ ENHANCED: Budget with Currency Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CurrencySelector
                  value={form.currency}
                  onChange={(currency) => setForm({
                    ...form,
                    currency: currency.code,
                    country_code: currency.countryCode
                  })}
                  label="Budget Currency"
                  showPaymentProvider={true}
                />

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Proposed Budget
                  </label>
                  <input
                    type="number"
                    value={form.proposed_amount}
                    onChange={(e) => setForm({ ...form, proposed_amount: e.target.value })}
                    placeholder={`e.g., ${form.currency === 'NGN' ? '50000' : form.currency === 'USD' ? '100' : '80'}`}
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Musicians will see this as a guide
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Additional Info */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Special Requirements
                </label>
                <textarea
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  placeholder="Any specific requirements? (e.g., specific songs, equipment needs, dress code)"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none text-base"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Media (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Add photos or videos of the venue (max 5MB)
                </p>

                {mediaPreview && (
                  <div className="mt-4 relative">
                    {form.media_file?.type.startsWith("image") ? (
                      <div className="relative w-full h-48 rounded-xl overflow-hidden">
                        <Image
                          src={mediaPreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <video
                        src={mediaPreview}
                        controls
                        className="w-full h-48 rounded-xl"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, media_file: null });
                        setMediaPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Footer Navigation */}
      <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}

        {currentStep < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition shadow-lg"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Posting...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Post Event
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}