"use client";

import { useAuth } from "@/context/AuthContext";

export default function SecuritySettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Security</h1>

      <div className="card">
        <p>Email</p>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      <div className="card">
        <button className="btn-primary">
          Change Password
        </button>
      </div>

      <div className="card">
        <button className="btn-danger">
          Sign out all sessions
        </button>
      </div>
    </div>
  );
}
