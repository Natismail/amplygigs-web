"use client";

export default function ProfileCard({ profile }) {
  const completion =
    (profile.bio ? 30 : 0) +
    (profile.avatar_url ? 30 : 0) +
    (profile.genre ? 40 : 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
      <h3 className="font-semibold text-lg mb-2">Profile</h3>

      <p className="font-medium">
        {profile.first_name} {profile.last_name}
      </p>

      <p className="text-sm text-gray-500 mb-3">
        {profile.genre || "Genre not set"}
      </p>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full"
          style={{ width: `${completion}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-1">
        Profile completeness: {completion}%
      </p>
    </div>
  );
}
