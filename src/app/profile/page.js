//src/app/profile/page.js

"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null); // ✅ Removed <any>

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
      setProfile(data);
    }
    fetchProfile();
  }, []);  // ✅ Removed setProfile from dependency array - it's not needed

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p><strong>Name:</strong> {profile.first_name} {profile.last_name}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Role:</strong> {profile.role}</p>
    </div>
  );
}