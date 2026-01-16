// src/app/(app)/musician/settings/profile/page.js - FIXED TO USE EXISTING PROFILE
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { User, Image, Music, Camera, ChevronRight, CheckCircle, ArrowLeft } from "lucide-react";

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Calculate profile completion
  const getCompletionPercentage = () => {
    if (!user) return 0;
    
    let completed = 0;
    let total = 8;
    
    if (user.first_name && user.last_name) completed++;
    if (user.profile_picture_url) completed++;
    if (user.bio) completed++;
    if (user.primary_role) completed++;
    if (user.genres && user.genres.length > 0) completed++;
    if (user.location) completed++;
    if (user.hourly_rate) completed++;
    if (user.gadget_specs) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your public profile information
          </p>
        </div>
      </div>

      {/* Profile Completion Card */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 sm:p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
              Profile Completion
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Complete your profile to attract more clients
            </p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
              <div 
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {completionPercentage}% complete
            </p>
          </div>
        </div>
      </div>

      {/* Main Profile Edit Button - Links to Existing Page */}
      <Link
        href="/musician/profile"
        className="block group p-6 rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg transition-all"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                Edit Complete Profile
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update all your information in one place
              </p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition flex-shrink-0" />
        </div>
      </Link>

      {/* Quick Links Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">
          Quick Access
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Basic Info */}
          <Link
            href="/musician/profile?tab=basic"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition group"
          >
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                Basic Info
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Name, bio, contact
              </p>
            </div>
            {user?.first_name && user?.last_name && (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            )}
          </Link>

          {/* Profile Photo */}
          <Link
            href="/musician/profile"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition group"
          >
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Profile Photo
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Upload picture
              </p>
            </div>
            {user?.profile_picture_url && (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            )}
          </Link>

          {/* Performance Videos */}
          <Link
            href="/musician/profile?tab=videos"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 transition group"
          >
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Image className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                Videos
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Showcase talent
              </p>
            </div>
          </Link>

          {/* Music Details */}
          <Link
            href="/musician/profile?tab=music"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition group"
          >
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                Music Info
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Genres, experience
              </p>
            </div>
            {user?.primary_role && user?.genres?.length > 0 && (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            )}
          </Link>
        </div>
      </div>

      {/* Profile Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Profile Tips
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Use a clear, professional profile photo</li>
              <li>• Add performance videos to showcase your talent</li>
              <li>• Keep your bio concise and engaging (2-3 sentences)</li>
              <li>• List all instruments you can perform with</li>
              <li>• Complete profiles get 3x more bookings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}