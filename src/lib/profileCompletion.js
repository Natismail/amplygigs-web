// src/lib/profileCompletion.js
// Pure JS calculation — does NOT use profile.profile_completion from DB.
// The DB trigger is out of sync with our signal definitions, so we ignore it.
//
// Role signal checks primary_role, public_role, AND categories as fallbacks
// because DataContext may expose the field under a different key depending
// on how fetchProfile() selects and maps the user_profiles row.

export const COMPLETION_SIGNALS = [
  {
    key:    "photo",
    label:  "Photo",
    weight: 20,
    check:  (u) => !!(u?.profile_picture_url || u?.avatar_url),
    hint:   "Upload a profile picture",
    tab:    null,
  },
  {
    key:    "bio",
    label:  "Bio",
    weight: 20,
    check:  (u) => !!(u?.bio?.trim()),
    hint:   "Add a short bio",
    tab:    "basic",
  },
  {
    key:    "primary_role",
    label:  "Role",
    weight: 20,
    // Check every possible field name the profile object might use.
    // primary_role  — the actual DB column name
    // public_role   — fallback column (default 'Musician')
    // categories    — CategorySelector saves here; if non-empty they have a role
    check: (u) => {
      if (u?.primary_role?.trim())  return true;
      if (u?.public_role?.trim() && u.public_role.trim() !== "Musician") return true;
      const cats = u?.categories;
      if (Array.isArray(cats) && cats.length > 0)  return true;
      if (typeof cats === "string" && cats !== "[]" && cats !== "") return true;
      return false;
    },
    hint:   "Set your musician role",
    tab:    "music",
  },
  {
    key:    "genres",
    label:  "Genres",
    weight: 20,
    check:  (u) => {
      const g = u?.genres;
      if (Array.isArray(g))  return g.length > 0;
      if (typeof g === "string") return g.length > 2 && g !== "[]"; // e.g. '["Gospel"]'
      return false;
    },
    hint:   "Select at least one genre",
    tab:    "music",
  },
  {
    key:    "rate",
    label:  "Rate",
    weight: 20,
    check:  (u) => !!u?.hourly_rate && Number(u.hourly_rate) > 0,
    hint:   "Set your hourly rate",
    tab:    "music",
  },
];

/**
 * Pure JS completion — always recalculates from signals, never uses DB column.
 * Each signal is worth 20%, total = 100%.
 */
export function getProfileCompletion(profile) {
  if (!profile) return 0;
  return COMPLETION_SIGNALS.reduce(
    (sum, s) => sum + (s.check(profile) ? s.weight : 0),
    0
  );
}

/** Signals not yet completed */
export function getMissingSignals(profile) {
  if (!profile) return COMPLETION_SIGNALS;
  return COMPLETION_SIGNALS.filter((s) => !s.check(profile));
}

/** Tailwind progress bar colour */
export function completionColor(pct) {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-400";
}