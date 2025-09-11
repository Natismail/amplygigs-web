// src/components/UpdateProfileForm.js
"use client";
// Add this at the very beginning of your component function
//console.log("🔴 COMPONENT LOADING");
//alert("Component is loading!"); // This will force a popup

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function UpdateProfileForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    bio: "",
    youtube: "",
    socials: { instagram: "", twitter: "" },
    available: false,
  });

  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(true);
useEffect(() => {
  console.log("=== PROFILE FETCH useEffect TRIGGERED ===");
  console.log("user:", user);
  console.log("user type:", typeof user);
  console.log("authLoading:", authLoading);
  console.log("user && !authLoading:", user && !authLoading);

  async function fetchProfile() {
  if (!user) return;
  setFormLoading(true);

  const { data: profile, error: fetchError } = await supabase
    .from("user_profiles")
    .select("name, bio, youtube, socials, available")
    .eq("id", user.id)
    .single();

  if (fetchError) {
    console.error("Error fetching profile:", fetchError);
  } else if (profile) {
    setForm({
      name: profile.name || "",
      bio: profile.bio || "",
      youtube: profile.youtube || "",
      socials: profile.socials || { instagram: "", twitter: "" },
      available: profile.available || false,
    });
  }

  setFormLoading(false);
}

  if (user && !authLoading) {
    console.log("Conditions met, calling fetchProfile()");
    fetchProfile();
  } else {
    console.log("Conditions not met for fetchProfile()");
  }
}, [user, authLoading]);
  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    if (!user) {
      setError("Not logged in");
      setFormLoading(false);
      return;
    }

    const { data, error: dbError } = await supabase
      .from("user_profiles")
      .update({
        role: "MUSICIAN",
        name: form.name,
        bio: form.bio,
        youtube: form.youtube,
        socials: form.socials,
        available: form.available,
      })
      .eq("id", user.id);

    setFormLoading(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    router.push("/musician/dashboard");
  }

  if (formLoading || authLoading) {
    return <div className="p-6 text-center text-gray-500">Loading form...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-lg space-y-4"
      >
        <h1 className="text-xl font-bold">Update Musician Profile</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="Stage / Full Name"
          className="w-full p-2 border rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <textarea
          placeholder="Short Bio"
          className="w-full p-2 border rounded"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
        <input
          type="text"
          placeholder="YouTube Link"
          className="w-full p-2 border rounded"
          value={form.youtube}
          onChange={(e) => setForm({ ...form, youtube: e.target.value })}
        />
        <input
          type="text"
          placeholder="Instagram Link"
          className="w-full p-2 border rounded"
          value={form.socials.instagram}
          onChange={(e) =>
            setForm({ ...form, socials: { ...form.socials, instagram: e.target.value } })
          }
        />
        <input
          type="text"
          placeholder="Twitter Link"
          className="w-full p-2 border rounded"
          value={form.socials.twitter}
          onChange={(e) =>
            setForm({ ...form, socials: { ...form.socials, twitter: e.target.value } })
          }
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.available}
            onChange={(e) => setForm({ ...form, available: e.target.checked })}
          />
          Available for booking
        </label>
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700" disabled={formLoading}>
          {formLoading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}