// src/app/(app)/profile/[userId]/page.js - FIXED SOCIAL STATS
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/social/FollowButton";
import { 
  MapPin, 
  Mail, 
  Phone, 
  Star, 
  Calendar, 
  Music, 
  Users, 
  MessageCircle,
  Edit,
  ArrowLeft
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import { useSocial } from "@/context/SocialContext";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { getOrCreateConversation } = useSocial();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    posts: 0,
    events: 0,
  });

  const userId = params.userId;
  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch ACTUAL followers count from user_follows
      const { count: followersCount } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      // Fetch ACTUAL following count from user_follows
      const { count: followingCount } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      // Fetch posts count
      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Fetch events count (if client)
      const { count: eventsCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", userId);

      setStats({
        followers: followersCount || 0,
        following: followingCount || 0,
        posts: postsCount || 0,
        events: eventsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleMessage = async () => {
    try {
      const { data, error } = await getOrCreateConversation(userId);
      
      if (error) {
        alert('Failed to start conversation');
        return;
      }

      if (data) {
        router.push('/messages');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This user doesn&apos;t exist or has been removed
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Cover/Banner */}
          <div className="h-32 sm:h-48 bg-gradient-to-r from-purple-500 to-pink-500"></div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 sm:-mt-20">
              {/* Avatar */}
              <div className="relative">
                <div className="ring-4 ring-white dark:ring-gray-800 rounded-full">
                  <Avatar user={profile} size="xl" />
                </div>
                {profile.is_verified && (
                  <div className="absolute bottom-2 right-2 bg-blue-500 text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Name & Actions */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {profile.first_name} {profile.last_name}
                    </h1>
                    {profile.display_name && (
                      <p className="text-gray-600 dark:text-gray-400">
                        @{profile.display_name}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isOwnProfile ? (
                      <Link
                        href={profile.role === 'MUSICIAN' ? '/musician/settings' : '/client/settings'}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                      </Link>
                    ) : (
                      <>
                        <FollowButton 
                          targetUserId={userId} 
                          targetUser={profile}
                          onFollowChange={fetchStats} // Refresh stats when follow changes
                        />
                        <button
                          onClick={handleMessage}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Message
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats - Using REAL counts from user_follows table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.followers}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.followers === 1 ? 'Follower' : 'Followers'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.following}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Following</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.posts}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.events}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Events</p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-6">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Details */}
            <div className="mt-6 space-y-3">
              {profile.role === 'MUSICIAN' && profile.primary_role && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Music className="w-5 h-5 flex-shrink-0" />
                  <span>{profile.primary_role}</span>
                </div>
              )}

              {profile.location && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-5 h-5 flex-shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}

              {profile.created_at && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-5 h-5 flex-shrink-0" />
                  <span>
                    Joined {new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}

              {profile.average_rating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {profile.average_rating.toFixed(1)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    ({profile.total_reviews || 0} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Genres (for musicians) */}
            {profile.role === 'MUSICIAN' && profile.genres && profile.genres.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Sections */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Posts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No recent activity
            </p>
          </div>

          {/* Reviews/Ratings */}
          {profile.role === 'MUSICIAN' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                Reviews
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                No reviews yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}