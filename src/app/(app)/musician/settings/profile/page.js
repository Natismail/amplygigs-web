// src/app/(app)/musician/settings/profile/page.js
// Uses same getProfileCompletion() as ProfileCard — always shows same %.
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { User, Music, Camera, ChevronRight, CheckCircle, ArrowLeft, Instagram } from "lucide-react";
import { Image } from "lucide-react";
import {
  getProfileCompletion,
  getMissingSignals,
  completionColor,
  COMPLETION_SIGNALS,
} from "@/lib/profileCompletion";

export default function ProfileSettingsPage() {
  const { user }   = useAuth();
  const router     = useRouter();
  const completion = getProfileCompletion(user);
  const barColor   = completionColor(completion);
  const missing    = getMissingSignals(user);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage your public profile information</p>
        </div>
      </div>

      {/* Completion card */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 sm:p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900 dark:text-white">Profile Completion</h3>
              <span className={`text-sm font-bold ${completion >= 80 ? "text-green-600" : completion >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                {completion}%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {completion === 100 ? "🎉 Your profile is complete!" : "Complete your profile to attract more clients"}
            </p>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3">
              <div className={`${barColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${completion}%` }} />
            </div>

            {/* Signal badges */}
            <div className="flex flex-wrap gap-2">
              {COMPLETION_SIGNALS.map((signal) => {
                const done = signal.check(user);
                return (
                  <span key={signal.key} className={`text-xs px-2 py-0.5 rounded-full ${
                    done
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    {done ? "✓" : "✗"} {signal.label}
                  </span>
                );
              })}
            </div>

            {/* What's still missing */}
            {missing.length > 0 && (
              <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Still needed:</p>
                <div className="flex flex-wrap gap-1.5">
                  {missing.map(s => (
                    <span key={s.key} className="text-xs text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                      {s.hint}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main edit link */}
      <Link href="/musician/profile" className="block group p-6 rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                Edit Complete Profile
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update all your information in one place</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition flex-shrink-0" />
        </div>
      </Link>

      {/* Quick access grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Access</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              href: "/musician/profile?tab=basic", icon: User, label: "Basic Info",
              sub: "Name, bio, contact",
              done: !!(user?.first_name && user?.last_name && user?.bio),
              hoverColor: "purple",
            },
            {
              href: "/musician/profile", icon: Camera, label: "Profile Photo",
              sub: "Upload picture",
              done: !!(user?.profile_picture_url || user?.avatar_url),
              hoverColor: "blue",
            },
            {
              href: "/musician/profile?tab=videos", icon: Image, label: "Videos",
              sub: "Showcase talent",
              done: false,
              hoverColor: "green",
            },
            {
              href: "/musician/profile?tab=music", icon: Music, label: "Music Info",
              sub: "Genres, role, rate",
              done: !!(user?.primary_role && user?.genres?.length > 0 && user?.hourly_rate),
              hoverColor: "orange",
            },
            {
              href: "/musician/profile?tab=social", icon: Instagram, label: "Social Media",
              sub: "Online presence",
              done: !!(user?.instagram || user?.youtube || user?.tiktok || user?.twitter),
              hoverColor: "pink",
            },
          ].map(({ href, icon: Icon, label, sub, done, hoverColor }) => (
            <Link key={label} href={href}
              className={`flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-${hoverColor}-400 dark:hover:border-${hoverColor}-600 hover:bg-${hoverColor}-50 dark:hover:bg-${hoverColor}-900/10 transition group`}
            >
              <div className={`w-10 h-10 bg-${hoverColor}-100 dark:bg-${hoverColor}-900/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 text-${hoverColor}-600 dark:text-${hoverColor}-400`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-gray-900 dark:text-white group-hover:text-${hoverColor}-600 dark:group-hover:text-${hoverColor}-400 text-sm`}>
                  {label}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{sub}</p>
              </div>
              {done && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
            </Link>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Profile Tips</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Use a clear, professional profile photo</li>
              <li>• Add performance videos to showcase your talent</li>
              <li>• Keep your bio concise and engaging (2–3 sentences)</li>
              <li>• List all instruments you can perform with</li>
              <li>• Complete profiles get 3× more bookings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}