// // src/components/UpdateProfileForm.js

// src/components/UpdateProfileForm.js
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
  available: false,
};

/* ------------------ Helpers ------------------ */

const normalizePhone = (phone) =>
  phone.replace(/\s+/g, "").replace(/^0/, "+234");

export default function UpdateProfileForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(true);

  /* ------------------ Fetch Profile ------------------ */

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    setFormLoading(true);

    const { data, error } = await supabase
      .from("user_profiles")
      .select("name, bio, youtube, socials, contact, available")
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
        available: data.available ?? false,
      });
    }

    setFormLoading(false);
  }, [user]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchProfile();
    }
  }, [user, authLoading, fetchProfile]);

  /* ------------------ Submit ------------------ */

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
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
    };

    const { error } = await supabase
      .from("user_profiles")
      .update(payload)
      .eq("id", user.id);

    setFormLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/musician/dashboard");
  }

  /* ------------------ Loading ------------------ */

  if (authLoading || formLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading profile…
      </div>
    );
  }

  /* ------------------ UI ------------------ */

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-lg space-y-4"
      >
        <h1 className="text-xl font-bold">Update Musician Profile</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Name */}
        <input
          className="w-full p-2 border rounded"
          placeholder="Stage / Full Name"
          value={form.name}
          onChange={(e) =>
            setForm((f) => ({ ...f, name: e.target.value }))
          }
          required
        />

        {/* Bio */}
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Short Bio"
          value={form.bio}
          onChange={(e) =>
            setForm((f) => ({ ...f, bio: e.target.value }))
          }
        />

        {/* YouTube */}
        <input
          className="w-full p-2 border rounded"
          placeholder="YouTube Channel / Video Link"
          value={form.youtube}
          onChange={(e) =>
            setForm((f) => ({ ...f, youtube: e.target.value }))
          }
        />

        {/* Instagram */}
        <input
          className="w-full p-2 border rounded"
          placeholder="Instagram Profile"
          value={form.socials.instagram}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              socials: { ...f.socials, instagram: e.target.value },
            }))
          }
        />

        {/* Twitter */}
        <input
          className="w-full p-2 border rounded"
          placeholder="Twitter / X Profile"
          value={form.socials.twitter}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              socials: { ...f.socials, twitter: e.target.value },
            }))
          }
        />

        {/* TikTok */}
        <input
          className="w-full p-2 border rounded"
          placeholder="TikTok Profile (https://tiktok.com/@username)"
          value={form.socials.tiktok}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              socials: { ...f.socials, tiktok: e.target.value },
            }))
          }
        />

        {/* WhatsApp */}
        <input
          className="w-full p-2 border rounded"
          placeholder="WhatsApp Number (+234...)"
          value={form.contact.whatsapp}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              contact: { ...f.contact, whatsapp: e.target.value },
            }))
          }
        />

        {/* Official Line */}
        <input
          className="w-full p-2 border rounded"
          placeholder="Official / Available Line (e.g. WhatsApp only, 9am–8pm)"
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

        {/* Availability */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.available}
            onChange={(e) =>
              setForm((f) => ({ ...f, available: e.target.checked }))
            }
          />
          Available for booking
        </label>

        <button
          type="submit"
          disabled={formLoading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {formLoading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}


// // src/components/UpdateProfileForm.js
// "use client";
// // Add this at the very beginning of your component function
// //console.log("🔴 COMPONENT LOADING");
// //alert("Component is loading!"); // This will force a popup

// import { useState, useEffect } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import { useAuth } from "@/context/AuthContext";
// import { useRouter } from "next/navigation";

// export default function UpdateProfileForm() {
//   const { user, loading: authLoading } = useAuth();
//   const router = useRouter();

//   const [form, setForm] = useState({
//     name: "",
//     bio: "",
//     youtube: "",
//     socials: { instagram: "", twitter: "" },
//     available: false,
//   });

//   const [error, setError] = useState("");
//   const [formLoading, setFormLoading] = useState(true);
// useEffect(() => {
//   console.log("=== PROFILE FETCH useEffect TRIGGERED ===");
//   console.log("user:", user);
//   console.log("user type:", typeof user);
//   console.log("authLoading:", authLoading);
//   console.log("user && !authLoading:", user && !authLoading);

//   async function fetchProfile() {
//   if (!user) return;
//   setFormLoading(true);

//   const { data: profile, error: fetchError } = await supabase
//     .from("user_profiles")
//     .select("name, bio, youtube, socials, available")
//     .eq("id", user.id)
//     .single();

//   if (fetchError) {
//     console.error("Error fetching profile:", fetchError);
//   } else if (profile) {
//     setForm({
//       name: profile.name || "",
//       bio: profile.bio || "",
//       youtube: profile.youtube || "",
//       socials: profile.socials || { instagram: "", twitter: "" },
//       available: profile.available || false,
//     });
//   }

//   setFormLoading(false);
// }

//   if (user && !authLoading) {
//     console.log("Conditions met, calling fetchProfile()");
//     fetchProfile();
//   } else {
//     console.log("Conditions not met for fetchProfile()");
//   }
// }, [user, authLoading]);
//   async function handleSubmit(e) {
//     e.preventDefault();
//     setFormLoading(true);
//     setError("");

//     if (!user) {
//       setError("Not logged in");
//       setFormLoading(false);
//       return;
//     }

//     const { data, error: dbError } = await supabase
//       .from("user_profiles")
//       .update({
//         role: "MUSICIAN",
//         name: form.name,
//         bio: form.bio,
//         youtube: form.youtube,
//         socials: form.socials,
//         available: form.available,
//       })
//       .eq("id", user.id);

//     setFormLoading(false);

//     if (dbError) {
//       setError(dbError.message);
//       return;
//     }

//     router.push("/musician/dashboard");
//   }

//   if (formLoading || authLoading) {
//     return <div className="p-6 text-center text-gray-500">Loading form...</div>;
//   }

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
//       <form
//         onSubmit={handleSubmit}
//         className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-lg space-y-4"
//       >
//         <h1 className="text-xl font-bold">Update Musician Profile</h1>
//         {error && <p className="text-red-500 text-sm">{error}</p>}
//         <input
//           type="text"
//           placeholder="Stage / Full Name"
//           className="w-full p-2 border rounded"
//           value={form.name}
//           onChange={(e) => setForm({ ...form, name: e.target.value })}
//         />
//         <textarea
//           placeholder="Short Bio"
//           className="w-full p-2 border rounded"
//           value={form.bio}
//           onChange={(e) => setForm({ ...form, bio: e.target.value })}
//         />
//         <input
//           type="text"
//           placeholder="YouTube Link"
//           className="w-full p-2 border rounded"
//           value={form.youtube}
//           onChange={(e) => setForm({ ...form, youtube: e.target.value })}
//         />
//         <input
//           type="text"
//           placeholder="Instagram Link"
//           className="w-full p-2 border rounded"
//           value={form.socials.instagram}
//           onChange={(e) =>
//             setForm({ ...form, socials: { ...form.socials, instagram: e.target.value } })
//           }
//         />
//         <input
//           type="text"
//           placeholder="Twitter Link"
//           className="w-full p-2 border rounded"
//           value={form.socials.twitter}
//           onChange={(e) =>
//             setForm({ ...form, socials: { ...form.socials, twitter: e.target.value } })
//           }
//         />
//         <label className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             checked={form.available}
//             onChange={(e) => setForm({ ...form, available: e.target.checked })}
//           />
//           Available for booking
//         </label>
//         <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700" disabled={formLoading}>
//           {formLoading ? "Saving..." : "Save Profile"}
//         </button>
//       </form>
//     </div>
//   );
// }