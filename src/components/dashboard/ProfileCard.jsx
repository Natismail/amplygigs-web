// src/components/dashboard/ProfileCard.jsx
"use client";

console.log("✅ ProfileCard loaded"); // ← add this temporarily


export default function ProfileCard({ profile }) {
  const hasGenres = profile?.genres && profile.genres.length > 0;
  const hasBio    = !!profile?.bio;
  const hasAvatar = !!profile?.profile_picture_url;

  const completion = (hasBio ? 30 : 0) + (hasAvatar ? 30 : 0) + (hasGenres ? 40 : 0);

  const completionColor =
    completion >= 80 ? "bg-green-500" :
    completion >= 50 ? "bg-yellow-500" :
    "bg-red-400";

  const genreDisplay = hasGenres
    ? profile.genres.slice(0, 2).join(", ") +
      (profile.genres.length > 2 ? ` +${profile.genres.length - 2} more` : "")
    : "No genres set";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
      <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
        Profile
      </h3>

      <p className="font-medium text-gray-900 dark:text-white">
        {profile?.display_name || `${profile?.first_name} ${profile?.last_name}`}
      </p>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {genreDisplay}
      </p>

      <div className="flex gap-2 mb-3 text-xs flex-wrap">
        <span className={`px-2 py-0.5 rounded-full ${hasBio
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-100 text-gray-400 dark:bg-gray-700"}`}>
          {hasBio ? "✓" : "✗"} Bio
        </span>
        <span className={`px-2 py-0.5 rounded-full ${hasAvatar
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-100 text-gray-400 dark:bg-gray-700"}`}>
          {hasAvatar ? "✓" : "✗"} Photo
        </span>
        <span className={`px-2 py-0.5 rounded-full ${hasGenres
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-100 text-gray-400 dark:bg-gray-700"}`}>
          {hasGenres ? "✓" : "✗"} Genres
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`${completionColor} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${completion}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Profile completeness: {completion}%
      </p>
    </div>
  );
}