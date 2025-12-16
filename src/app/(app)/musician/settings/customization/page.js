"use client";

import { useState } from "react";

export default function CustomizationSettingsPage() {
  const [theme, setTheme] = useState("dark");

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">Customization</h1>

      <div className="card space-y-2">
        <p className="font-medium">Public Profile Theme</p>

        <select
          className="input"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="auto">Auto</option>
        </select>
      </div>

      <div className="card">
        <p className="font-medium">Profile Visibility</p>
        <p className="text-sm text-gray-500">
          Control whether your profile appears in search results
        </p>
      </div>
    </div>
  );
}
