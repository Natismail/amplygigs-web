// src/components/dashboard/ProfileCard.jsx
"use client";

import { getProfileCompletion, COMPLETION_SIGNALS, completionColor } from "@/lib/profileCompletion";

export default function ProfileCard({ profile }) {
  // 🔍 TEMPORARY DEBUG — remove once Role badge is confirmed working
  // Open browser console and check: does primary_role appear in this object?
  if (process.env.NODE_ENV === "development") {
    console.log("ProfileCard profile shape:", {
      primary_role: profile?.primary_role,
      public_role:  profile?.public_role,
      categories:   profile?.categories,
      hourly_rate:  profile?.hourly_rate,
      genres:       profile?.genres,
      bio:          profile?.bio?.slice(0, 30),
      profile_picture_url: !!profile?.profile_picture_url,
      avatar_url:   !!profile?.avatar_url,
    });
  }

  const completion = getProfileCompletion(profile);
  const barColor   = completionColor(completion);

  const genres = Array.isArray(profile?.genres)
    ? profile.genres
    : [];
  const genreDisplay = genres.length > 0
    ? genres.slice(0, 2).join(", ") + (genres.length > 2 ? ` +${genres.length - 2} more` : "")
    : "No genres set";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
      <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Profile</h3>

      <p className="font-medium text-gray-900 dark:text-white">
        {profile?.display_name ||
          `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
          "Unnamed"}
      </p>

      {/* Primary role display — checks both field names */}
      {(profile?.primary_role || profile?.public_role) && (
        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">
          {profile.primary_role || profile.public_role}
        </p>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">{genreDisplay}</p>

      {/* Completion signal badges */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {COMPLETION_SIGNALS.map((signal) => {
          const done = signal.check(profile);
          return (
            <span
              key={signal.key}
              className={`px-2 py-0.5 rounded-full text-xs ${
                done
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
              }`}
            >
              {done ? "✓" : "✗"} {signal.label}
            </span>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${completion}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Profile completeness: {completion}%
      </p>
    </div>
  );
}



// // src/components/dashboard/ProfileCard.jsx
// "use client";

// console.log("✅ ProfileCard loaded"); // ← add this temporarily


// export default function ProfileCard({ profile }) {
//   const hasGenres = profile?.genres && profile.genres.length > 0;
//   const hasBio    = !!profile?.bio;
//   const hasAvatar = !!profile?.profile_picture_url;

//   const completion = (hasBio ? 30 : 0) + (hasAvatar ? 30 : 0) + (hasGenres ? 40 : 0);

//   const completionColor =
//     completion >= 80 ? "bg-green-500" :
//     completion >= 50 ? "bg-yellow-500" :
//     "bg-red-400";

//   const genreDisplay = hasGenres
//     ? profile.genres.slice(0, 2).join(", ") +
//       (profile.genres.length > 2 ? ` +${profile.genres.length - 2} more` : "")
//     : "No genres set";

//   return (
//     <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
//       <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
//         Profile
//       </h3>

//       <p className="font-medium text-gray-900 dark:text-white">
//         {profile?.display_name || `${profile?.first_name} ${profile?.last_name}`}
//       </p>

//       <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
//         {genreDisplay}
//       </p>

//       <div className="flex gap-2 mb-3 text-xs flex-wrap">
//         <span className={`px-2 py-0.5 rounded-full ${hasBio
//           ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
//           : "bg-gray-100 text-gray-400 dark:bg-gray-700"}`}>
//           {hasBio ? "✓" : "✗"} Bio
//         </span>
//         <span className={`px-2 py-0.5 rounded-full ${hasAvatar
//           ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
//           : "bg-gray-100 text-gray-400 dark:bg-gray-700"}`}>
//           {hasAvatar ? "✓" : "✗"} Photo
//         </span>
//         <span className={`px-2 py-0.5 rounded-full ${hasGenres
//           ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
//           : "bg-gray-100 text-gray-400 dark:bg-gray-700"}`}>
//           {hasGenres ? "✓" : "✗"} Genres
//         </span>
//       </div>

//       <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
//         <div
//           className={`${completionColor} h-2 rounded-full transition-all duration-500`}
//           style={{ width: `${completion}%` }}
//         />
//       </div>

//       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//         Profile completeness: {completion}%
//       </p>
//     </div>
//   );
// }