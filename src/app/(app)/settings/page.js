"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .select("first_name, last_name, phone")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          phone: data.phone || "",
        });
      }
      setLoading(false);
    }

    fetchProfile();
  }, []);

  async function updateProfile(e) {
    e.preventDefault();
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in to update your profile.");
      return;
    }

    const { error } = await supabase
      .from("user_profiles")
      .update({
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
      })
      .eq("id", user.id)
      .single();

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Profile updated successfully!");
    }
  }

  if (loading) return <p className="p-6">Loading settings...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      {message && <p className={`mb-3 ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>{message}</p>}

      <form onSubmit={updateProfile}>
        <input
          type="text"
          placeholder="First Name"
          value={profile.firstName}
          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
          className="w-full p-2 border rounded mb-3"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={profile.lastName}
          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
          className="w-full p-2 border rounded mb-3"
        />
        <input
          type="text"
          placeholder="Phone"
          value={profile.phone}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          className="w-full p-2 border rounded mb-4"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}


