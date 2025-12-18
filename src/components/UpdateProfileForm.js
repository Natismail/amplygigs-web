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
  const [success, setSuccess] = useState(false);
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
      // Set verification status to 'unverified' when becoming a musician
      verification_status: "unverified",
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

    setSuccess(true);
    
    // Show success message for 2 seconds, then redirect
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
        className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg space-y-4"
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
            onChange={(e) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
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
            onChange={(e) =>
              setForm((f) => ({ ...f, bio: e.target.value }))
            }
          />
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
            onChange={(e) =>
              setForm((f) => ({ ...f, youtube: e.target.value }))
            }
          />
        </div>

        {/* Social Media Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Social Media
          </h3>
          
          {/* Instagram */}
          <div className="mb-3">
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
          <div className="mb-3">
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
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) =>
                setForm((f) => ({ ...f, available: e.target.checked }))
              }
              className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
            />
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                Available for booking
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Clients can request to book you for events
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



// // // src/components/UpdateProfileForm.js

// // src/components/UpdateProfileForm.js
// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import { useAuth } from "@/context/AuthContext";
// import { useRouter } from "next/navigation";

// /* ------------------ Defaults ------------------ */

// const EMPTY_FORM = {
//   name: "",
//   bio: "",
//   youtube: "",
//   socials: {
//     instagram: "",
//     twitter: "",
//     tiktok: "",
//   },
//   contact: {
//     whatsapp: "",
//     availableLine: "",
//   },
//   available: false,
// };

// /* ------------------ Helpers ------------------ */

// const normalizePhone = (phone) =>
//   phone.replace(/\s+/g, "").replace(/^0/, "+234");

// export default function UpdateProfileForm() {
//   const { user, loading: authLoading } = useAuth();
//   const router = useRouter();

//   const [form, setForm] = useState(EMPTY_FORM);
//   const [error, setError] = useState("");
//   const [formLoading, setFormLoading] = useState(true);

//   /* ------------------ Fetch Profile ------------------ */

//   const fetchProfile = useCallback(async () => {
//     if (!user) return;

//     setFormLoading(true);

//     const { data, error } = await supabase
//       .from("user_profiles")
//       .select("name, bio, youtube, socials, contact, available")
//       .eq("id", user.id)
//       .single();

//     if (error) {
//       console.error("Profile fetch error:", error);
//     } else if (data) {
//       setForm({
//         name: data.name ?? "",
//         bio: data.bio ?? "",
//         youtube: data.youtube ?? "",
//         socials: {
//           instagram: data.socials?.instagram ?? "",
//           twitter: data.socials?.twitter ?? "",
//           tiktok: data.socials?.tiktok ?? "",
//         },
//         contact: {
//           whatsapp: data.contact?.whatsapp ?? "",
//           availableLine: data.contact?.availableLine ?? "",
//         },
//         available: data.available ?? false,
//       });
//     }

//     setFormLoading(false);
//   }, [user]);

//   useEffect(() => {
//     if (user && !authLoading) {
//       fetchProfile();
//     }
//   }, [user, authLoading, fetchProfile]);

//   /* ------------------ Submit ------------------ */

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setError("");
//     setFormLoading(true);

//     if (!user) {
//       setError("You must be logged in.");
//       setFormLoading(false);
//       return;
//     }

//     const payload = {
//       role: "MUSICIAN",
//       name: form.name.trim(),
//       bio: form.bio.trim(),
//       youtube: form.youtube.trim(),
//       socials: form.socials,
//       contact: {
//         ...form.contact,
//         whatsapp: normalizePhone(form.contact.whatsapp),
//       },
//       available: form.available,
//     };

//     const { error } = await supabase
//       .from("user_profiles")
//       .update(payload)
//       .eq("id", user.id);

//     setFormLoading(false);

//     if (error) {
//       setError(error.message);
//       return;
//     }

//     router.push("/musician/dashboard");
//   }

//   /* ------------------ Loading ------------------ */

//   if (authLoading || formLoading) {
//     return (
//       <div className="p-6 text-center text-gray-500">
//         Loading profile…
//       </div>
//     );
//   }

//   /* ------------------ UI ------------------ */

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
//       <form
//         onSubmit={handleSubmit}
//         className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-lg space-y-4"
//       >
//         <h1 className="text-xl font-bold">Update Musician Profile</h1>

//         {error && <p className="text-red-500 text-sm">{error}</p>}

//         {/* Name */}
//         <input
//           className="w-full p-2 border rounded"
//           placeholder="Stage / Full Name"
//           value={form.name}
//           onChange={(e) =>
//             setForm((f) => ({ ...f, name: e.target.value }))
//           }
//           required
//         />

//         {/* Bio */}
//         <textarea
//           className="w-full p-2 border rounded"
//           placeholder="Short Bio"
//           value={form.bio}
//           onChange={(e) =>
//             setForm((f) => ({ ...f, bio: e.target.value }))
//           }
//         />

//         {/* YouTube */}
//         <input
//           className="w-full p-2 border rounded"
//           placeholder="YouTube Channel / Video Link"
//           value={form.youtube}
//           onChange={(e) =>
//             setForm((f) => ({ ...f, youtube: e.target.value }))
//           }
//         />

//         {/* Instagram */}
//         <input
//           className="w-full p-2 border rounded"
//           placeholder="Instagram Profile"
//           value={form.socials.instagram}
//           onChange={(e) =>
//             setForm((f) => ({
//               ...f,
//               socials: { ...f.socials, instagram: e.target.value },
//             }))
//           }
//         />

//         {/* Twitter */}
//         <input
//           className="w-full p-2 border rounded"
//           placeholder="Twitter / X Profile"
//           value={form.socials.twitter}
//           onChange={(e) =>
//             setForm((f) => ({
//               ...f,
//               socials: { ...f.socials, twitter: e.target.value },
//             }))
//           }
//         />

//         {/* TikTok */}
//         <input
//           className="w-full p-2 border rounded"
//           placeholder="TikTok Profile (https://tiktok.com/@username)"
//           value={form.socials.tiktok}
//           onChange={(e) =>
//             setForm((f) => ({
//               ...f,
//               socials: { ...f.socials, tiktok: e.target.value },
//             }))
//           }
//         />

//         {/* WhatsApp */}
//         <input
//           className="w-full p-2 border rounded"
//           placeholder="WhatsApp Number (+234...)"
//           value={form.contact.whatsapp}
//           onChange={(e) =>
//             setForm((f) => ({
//               ...f,
//               contact: { ...f.contact, whatsapp: e.target.value },
//             }))
//           }
//         />

//         {/* Official Line */}
//         <input
//           className="w-full p-2 border rounded"
//           placeholder="Official / Available Line (e.g. WhatsApp only, 9am–8pm)"
//           value={form.contact.availableLine}
//           onChange={(e) =>
//             setForm((f) => ({
//               ...f,
//               contact: {
//                 ...f.contact,
//                 availableLine: e.target.value,
//               },
//             }))
//           }
//         />

//         {/* Availability */}
//         <label className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             checked={form.available}
//             onChange={(e) =>
//               setForm((f) => ({ ...f, available: e.target.checked }))
//             }
//           />
//           Available for booking
//         </label>

//         <button
//           type="submit"
//           disabled={formLoading}
//           className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
//         >
//           {formLoading ? "Saving..." : "Save Profile"}
//         </button>
//       </form>
//     </div>
//   );
// }


// // // src/components/UpdateProfileForm.js
// // "use client";
// // // Add this at the very beginning of your component function
// // //console.log("🔴 COMPONENT LOADING");
// // //alert("Component is loading!"); // This will force a popup

// // import { useState, useEffect } from "react";
// // import { supabase } from "@/lib/supabaseClient";
// // import { useAuth } from "@/context/AuthContext";
// // import { useRouter } from "next/navigation";

// // export default function UpdateProfileForm() {
// //   const { user, loading: authLoading } = useAuth();
// //   const router = useRouter();

// //   const [form, setForm] = useState({
// //     name: "",
// //     bio: "",
// //     youtube: "",
// //     socials: { instagram: "", twitter: "" },
// //     available: false,
// //   });

// //   const [error, setError] = useState("");
// //   const [formLoading, setFormLoading] = useState(true);
// // useEffect(() => {
// //   console.log("=== PROFILE FETCH useEffect TRIGGERED ===");
// //   console.log("user:", user);
// //   console.log("user type:", typeof user);
// //   console.log("authLoading:", authLoading);
// //   console.log("user && !authLoading:", user && !authLoading);

// //   async function fetchProfile() {
// //   if (!user) return;
// //   setFormLoading(true);

// //   const { data: profile, error: fetchError } = await supabase
// //     .from("user_profiles")
// //     .select("name, bio, youtube, socials, available")
// //     .eq("id", user.id)
// //     .single();

// //   if (fetchError) {
// //     console.error("Error fetching profile:", fetchError);
// //   } else if (profile) {
// //     setForm({
// //       name: profile.name || "",
// //       bio: profile.bio || "",
// //       youtube: profile.youtube || "",
// //       socials: profile.socials || { instagram: "", twitter: "" },
// //       available: profile.available || false,
// //     });
// //   }

// //   setFormLoading(false);
// // }

// //   if (user && !authLoading) {
// //     console.log("Conditions met, calling fetchProfile()");
// //     fetchProfile();
// //   } else {
// //     console.log("Conditions not met for fetchProfile()");
// //   }
// // }, [user, authLoading]);
// //   async function handleSubmit(e) {
// //     e.preventDefault();
// //     setFormLoading(true);
// //     setError("");

// //     if (!user) {
// //       setError("Not logged in");
// //       setFormLoading(false);
// //       return;
// //     }

// //     const { data, error: dbError } = await supabase
// //       .from("user_profiles")
// //       .update({
// //         role: "MUSICIAN",
// //         name: form.name,
// //         bio: form.bio,
// //         youtube: form.youtube,
// //         socials: form.socials,
// //         available: form.available,
// //       })
// //       .eq("id", user.id);

// //     setFormLoading(false);

// //     if (dbError) {
// //       setError(dbError.message);
// //       return;
// //     }

// //     router.push("/musician/dashboard");
// //   }

// //   if (formLoading || authLoading) {
// //     return <div className="p-6 text-center text-gray-500">Loading form...</div>;
// //   }

// //   return (
// //     <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
// //       <form
// //         onSubmit={handleSubmit}
// //         className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-lg space-y-4"
// //       >
// //         <h1 className="text-xl font-bold">Update Musician Profile</h1>
// //         {error && <p className="text-red-500 text-sm">{error}</p>}
// //         <input
// //           type="text"
// //           placeholder="Stage / Full Name"
// //           className="w-full p-2 border rounded"
// //           value={form.name}
// //           onChange={(e) => setForm({ ...form, name: e.target.value })}
// //         />
// //         <textarea
// //           placeholder="Short Bio"
// //           className="w-full p-2 border rounded"
// //           value={form.bio}
// //           onChange={(e) => setForm({ ...form, bio: e.target.value })}
// //         />
// //         <input
// //           type="text"
// //           placeholder="YouTube Link"
// //           className="w-full p-2 border rounded"
// //           value={form.youtube}
// //           onChange={(e) => setForm({ ...form, youtube: e.target.value })}
// //         />
// //         <input
// //           type="text"
// //           placeholder="Instagram Link"
// //           className="w-full p-2 border rounded"
// //           value={form.socials.instagram}
// //           onChange={(e) =>
// //             setForm({ ...form, socials: { ...form.socials, instagram: e.target.value } })
// //           }
// //         />
// //         <input
// //           type="text"
// //           placeholder="Twitter Link"
// //           className="w-full p-2 border rounded"
// //           value={form.socials.twitter}
// //           onChange={(e) =>
// //             setForm({ ...form, socials: { ...form.socials, twitter: e.target.value } })
// //           }
// //         />
// //         <label className="flex items-center gap-2">
// //           <input
// //             type="checkbox"
// //             checked={form.available}
// //             onChange={(e) => setForm({ ...form, available: e.target.checked })}
// //           />
// //           Available for booking
// //         </label>
// //         <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700" disabled={formLoading}>
// //           {formLoading ? "Saving..." : "Save Profile"}
// //         </button>
// //       </form>
// //     </div>
// //   );
// // }