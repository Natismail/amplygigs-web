// src/components/UpdateProfileForm.js - COMPLETE WITH ALL FIELDS
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

/* ------------------ Defaults ------------------ */

const EMPTY_FORM = {
  name: "",
  bio: "",
  youtube: "",
  socials: {
    instagram: "",
    twitter: "",
    tiktok: "",
  },
  contact: {
    whatsapp: "",
    availableLine: "",
  },
  available: true,
  // ⭐ NEW FIELDS
  experience_years: "",
  hourly_rate: "",
  genres: [],
};

/* ------------------ Available Genres ------------------ */

const GENRES = [
  "Afrobeats", "Hip Hop", "R&B", "Jazz", "Gospel", 
  "Highlife", "Reggae", "Pop", "Rock", "Classical", 
  "Electronic", "Fuji", "Juju", "Apala"
];

/* ------------------ Helpers ------------------ */

const normalizePhone = (phone) =>
  phone.replace(/\s+/g, "").replace(/^0/, "+234");

export default function UpdateProfileForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formLoading, setFormLoading] = useState(true);

  /* ------------------ Fetch Profile ------------------ */

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    setFormLoading(true);

    const { data, error } = await supabase
      .from("user_profiles")
      .select("name, bio, youtube, socials, contact, available, experience_years, hourly_rate, genres")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Profile fetch error:", error);
    } else if (data) {
      setForm({
        name: data.name ?? "",
        bio: data.bio ?? "",
        youtube: data.youtube ?? "",
        socials: {
          instagram: data.socials?.instagram ?? "",
          twitter: data.socials?.twitter ?? "",
          tiktok: data.socials?.tiktok ?? "",
        },
        contact: {
          whatsapp: data.contact?.whatsapp ?? "",
          availableLine: data.contact?.availableLine ?? "",
        },
        available: data.available ?? true,
        experience_years: data.experience_years ?? "",
        hourly_rate: data.hourly_rate ?? "",
        genres: data.genres ?? [],
      });
    }

    setFormLoading(false);
  }, [user]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchProfile();
    }
  }, [user, authLoading, fetchProfile]);

  /* ------------------ Genre Toggle ------------------ */

  const toggleGenre = (genre) => {
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(genre)
        ? f.genres.filter((g) => g !== genre)
        : [...f.genres, genre],
    }));
  };

  /* ------------------ Submit ------------------ */

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setFormLoading(true);

    if (!user) {
      setError("You must be logged in.");
      setFormLoading(false);
      return;
    }

    const payload = {
      role: "MUSICIAN",
      name: form.name.trim(),
      bio: form.bio.trim(),
      youtube: form.youtube.trim(),
      socials: form.socials,
      contact: {
        ...form.contact,
        whatsapp: normalizePhone(form.contact.whatsapp),
      },
      available: form.available,
      verification_status: "unverified",
      // ⭐ NEW FIELDS
      experience_years: form.experience_years ? parseInt(form.experience_years, 10) : 0,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : 0,
      genres: form.genres,
    };

    console.log('💾 Saving musician profile:', payload);

    const { error } = await supabase
      .from("user_profiles")
      .update(payload)
      .eq("id", user.id);

    setFormLoading(false);

    if (error) {
      console.error('❌ Error saving profile:', error);
      setError(error.message);
      return;
    }

    console.log('✅ Profile saved successfully');
    setSuccess(true);
    
    setTimeout(() => {
      router.push("/musician/dashboard");
    }, 2000);
  }

  /* ------------------ Loading ------------------ */

  if (authLoading || formLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  /* ------------------ Success State ------------------ */

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Profile Saved!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Welcome to AmplyGigs Musicians! 
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ You are now <span className="font-semibold">
                {form.available ? 'AVAILABLE' : 'UNAVAILABLE'}
              </span> for bookings
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚡ Next Step: Complete your <span className="font-semibold">KYC Verification</span> to start receiving bookings!
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* ------------------ UI ------------------ */

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl space-y-4"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Become a Musician
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Fill in your details to start receiving gig bookings
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Stage / Full Name *
          </label>
          <input
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., DJ Spinall, Wizkid"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Short Bio
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Tell clients about your music style, experience, and what makes you unique..."
            rows={4}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
        </div>

        {/* ⭐ NEW: Experience & Rate Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Years of Experience *
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="50"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="5"
              value={form.experience_years}
              onChange={(e) => setForm((f) => ({ ...f, experience_years: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Hourly Rate (₦) *
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="15000"
              value={form.hourly_rate}
              onChange={(e) => setForm((f) => ({ ...f, hourly_rate: e.target.value }))}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum rate per hour
            </p>
          </div>
        </div>

        {/* ⭐ NEW: Genres Selection */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
            Music Genres (Select all that apply) *
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  form.genres.includes(genre)
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
          {form.genres.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {form.genres.length} genre{form.genres.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* YouTube */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            YouTube Channel / Video Link
          </label>
          <input
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="https://youtube.com/..."
            value={form.youtube}
            onChange={(e) => setForm((f) => ({ ...f, youtube: e.target.value }))}
          />
        </div>

        {/* Social Media Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Social Media
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Instagram
              </label>
              <input
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="@username"
                value={form.socials.instagram}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    socials: { ...f.socials, instagram: e.target.value },
                  }))
                }
              />
            </div>

            {/* Twitter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Twitter / X
              </label>
              <input
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="@username"
                value={form.socials.twitter}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    socials: { ...f.socials, twitter: e.target.value },
                  }))
                }
              />
            </div>

            {/* TikTok */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                TikTok
              </label>
              <input
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="@username"
                value={form.socials.tiktok}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    socials: { ...f.socials, tiktok: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Contact Information
          </h3>

          {/* WhatsApp */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              WhatsApp Number *
            </label>
            <input
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="080XXXXXXXX or +234XXXXXXXXXX"
              value={form.contact.whatsapp}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  contact: { ...f.contact, whatsapp: e.target.value },
                }))
              }
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Clients will use this to contact you
            </p>
          </div>

          {/* Available Line */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Preferred Contact Method
            </label>
            <input
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., WhatsApp only, Call 9am-8pm"
              value={form.contact.availableLine}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  contact: {
                    ...f.contact,
                    availableLine: e.target.value,
                  },
                }))
              }
            />
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => {
                console.log('📌 Availability toggled:', e.target.checked);
                setForm((f) => ({ ...f, available: e.target.checked }));
              }}
              className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  Available for booking
                </span>
                {form.available && (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {form.available 
                  ? "Clients can request to book you for events" 
                  : "You won't appear in search results for new bookings"}
              </p>
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {formLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Saving...
            </span>
          ) : (
            "Save Profile & Continue"
          )}
        </button>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
          After saving, you&apos;ll need to complete KYC verification to start receiving bookings
        </p>
      </form>
    </div>
  );
}