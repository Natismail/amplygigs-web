//src/app/(app)/musician/settings/notifications

"use client";

import { useState } from "react";

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState({
    bookings: true,
    payments: true,
    marketing: false,
  });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">Notifications</h1>

      {Object.entries(prefs).map(([key, value]) => (
        <label key={key} className="flex items-center gap-3 card">
          <input
            type="checkbox"
            checked={value}
            onChange={() =>
              setPrefs({ ...prefs, [key]: !value })
            }
          />
          <span className="capitalize">{key}</span>
        </label>
      ))}
    </div>
  );
}
