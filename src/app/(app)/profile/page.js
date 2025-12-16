// //src/app/profile/page.js


"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
        .select("first_name, last_name, email, role, phone")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          role: data.role,
          phone: data.phone,
        });
      }
      setLoading(false);
    }

    fetchProfile();
  }, []);

  if (loading) return <p className="p-6">Loading profile...</p>;
  if (!profile) return <p className="p-6">No profile found</p>;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <p><strong>Name:</strong> {profile.firstName} {profile.lastName}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Phone:</strong> {profile.phone}</p>
      <p><strong>Role:</strong> {profile.role}</p>
    </div>
  );
}



// "use client";
// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabaseClient";

// export default function ProfilePage() {
//   const [profile, setProfile] = useState(null); // ✅ Removed <any>

//   useEffect(() => {
//     async function fetchProfile() {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       if (!user) return;

//       const { data } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
//       setProfile(data);
//     }
//     fetchProfile();
//   }, []);  // ✅ Removed setProfile from dependency array - it's not needed

//   if (!profile) return <p>Loading...</p>;

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold">Profile</h1>
//       <p><strong>Name:</strong> {profile.first_name} {profile.last_name}</p>
//       <p><strong>Email:</strong> {profile.email}</p>
//       <p><strong>Role:</strong> {profile.role}</p>
//     </div>
//   );
// }