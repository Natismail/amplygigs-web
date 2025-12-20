//src/app/(app)/musician/settings/profile

"use client";

import Link from "next/link";

export default function ProfileSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Profile Settings</h1>

      <div className="space-y-3">
        <Link className="block card" href="/musician/profile/edit">
          Edit basic profile
        </Link>

        <Link className="block card" href="/musician/profile/media">
          Profile photo & performance media
        </Link>

        <Link className="block card" href="/musician/profile/gear">
          Instruments & gear
        </Link>
      </div>
    </div>
  );
}
