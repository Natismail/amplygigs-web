// src/app/(app)/client/settings/page.js
"use client";

import { useAuth } from "@/context/AuthContext";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { User, Mail, Phone, MapPin } from "lucide-react";

export default function ClientSettingsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your profile information and preferences
          </p>
        </div>

        {/* Profile Picture Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Profile Picture
          </h2>
          <ProfilePictureUpload />
        </div>

        {/* Personal Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Personal Information
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <User className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {user.first_name} {user.last_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Mail className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {user.email}
                </p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <Phone className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {user.phone}
                  </p>
                </div>
              </div>
            )}

            {user.location && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <MapPin className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {user.location}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Type */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Account Type
          </h2>
          <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Client Account</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Book musicians for your events
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

