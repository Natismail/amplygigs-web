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

  // ── Genres display ─────────────────────────────────────────────────────────
  const genres = Array.isArray(profile?.genres) ? profile.genres : [];
  const genreDisplay = genres.length > 0
    ? genres.slice(0, 2).join(", ") + (genres.length > 2 ? ` +${genres.length - 2} more` : "")
    : "No genres set";

  // ── Role + title display ───────────────────────────────────────────────────
  // Primary role  = broad category  e.g. "Instrumentalist" — from DB or categories array
  // Display title = specific skills e.g. "Bass Guitar & Keyboard" — from professional_title or subcategories
  const categories  = Array.isArray(profile?.categories) ? profile.categories : [];
  const primaryCat  = categories.find(c => c.isPrimary) || categories[0] || null;
  const primaryRole = profile?.primary_role || primaryCat?.category || null;

  // professional_title is auto-saved from handleSave
  // fall back to building it from subcategories if not yet saved
  const displayTitle = profile?.professional_title
    || primaryCat?.subcategories?.slice(0, 2).join(" & ")
    || null;

  // "Instrumentalist · Bass Guitar & Keyboard"
  // if both are the same (e.g. Singer · Singer) show only one
  const roleDisplay = primaryRole && displayTitle && displayTitle !== primaryRole
    ? `${primaryRole} · ${displayTitle}`
    : displayTitle || primaryRole || null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
      <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
        Profile
      </h3>

      {/* Name */}
      <p className="font-medium text-gray-900 dark:text-white">
        {profile?.display_name ||
          `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
          "Unnamed"}
      </p>

      {/* Role · Title — e.g. "Instrumentalist · Bass Guitar & Keyboard" */}
      {roleDisplay && (
        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">
          {roleDisplay}
        </p>
      )}

      {/* Genres */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">
        {genreDisplay}
      </p>

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


