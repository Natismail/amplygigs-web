// src/components/social/UserProfileCard.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Music, Star, MessageCircle, UserPlus, UserCheck, Users } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useSocial } from '@/context/SocialContext';
import { supabase } from '@/lib/supabaseClient';

export default function UserProfileCard({ user, showFollowButton = true, showMessageButton = true }) {
  const { user: currentUser } = useAuth();
  const { getOrCreateConversation } = useSocial();
  const router = useRouter();

  const [stats, setStats] = useState({ followers: null, following: null }); // null = loading
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsYou, setFollowsYou] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const isOwnProfile = currentUser?.id === user.id;

  useEffect(() => {
    fetchStats();
    if (currentUser && !isOwnProfile) {
      checkFollowStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, currentUser?.id]);

  const fetchStats = async () => {
    try {
      const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
      ]);
      setStats({ followers: followersCount || 0, following: followingCount || 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ followers: 0, following: 0 });
    }
  };

  const checkFollowStatus = async () => {
    try {
      // Check if current user follows this person AND if this person follows current user
      const [{ data: followingData }, { data: followerData }] = await Promise.all([
        supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', currentUser.id)
          .maybeSingle(),
      ]);
      setIsFollowing(!!followingData);
      setFollowsYou(!!followerData);
    } catch {
      setIsFollowing(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || isFollowLoading) return;
    setIsFollowLoading(true);

    // Optimistic update
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setStats((prev) => ({
      ...prev,
      followers: wasFollowing
        ? Math.max(0, (prev.followers ?? 0) - 1)
        : (prev.followers ?? 0) + 1,
    }));

    try {
      if (wasFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', user.id);
      } else {
        await supabase.from('user_follows').insert({
          follower_id: currentUser.id,
          following_id: user.id,
        });
        // Fire-and-forget notification
        supabase.from('notifications').insert({
          user_id: user.id,
          type: 'follow',
          title: 'New Follower',
          message: `${currentUser.first_name || ''} ${currentUser.last_name || ''} started following you`.trim(),
          related_user_id: currentUser.id,
          action_url: `/profile/${currentUser.id}`,
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      console.error('Error toggling follow:', error);
      setIsFollowing(wasFollowing);
      setStats((prev) => ({
        ...prev,
        followers: wasFollowing
          ? (prev.followers ?? 0) + 1
          : Math.max(0, (prev.followers ?? 0) - 1),
      }));
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      const { data, error } = await getOrCreateConversation(user.id);
      if (error) { alert('Failed to start conversation'); return; }
      if (data) router.push('/messages');
    } catch {
      alert('An error occurred');
    }
  };

  const statsLoading = stats.followers === null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">

      {/* Colour strip — mirrors the public profile cover */}
      <div className="h-12 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500" />

      {/* Body */}
      <div className="px-4 pb-4">

        {/* Avatar row — overlaps the strip */}
        <div className="flex items-end justify-between -mt-7 mb-3">
          <Link href={`/profile/${user.id}`} className="flex-shrink-0">
            <div className="ring-2 ring-white dark:ring-gray-800 rounded-full hover:opacity-90 transition">
              <Avatar user={user} size="lg" />
            </div>
          </Link>

          {/* Mutual badge */}
          {!isOwnProfile && followsYou && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full mt-5 border border-purple-200 dark:border-purple-800">
              <Users className="w-3 h-3" />
              Follows you
            </span>
          )}
        </div>

        {/* Name & role */}
        <Link href={`/profile/${user.id}`}>
          <h3 className="font-bold text-base text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition leading-tight">
            {user.first_name} {user.last_name}
          </h3>
        </Link>

        {user.display_name && (
          <p className="text-xs text-gray-400 mt-0.5">@{user.display_name}</p>
        )}

        {user.role === 'MUSICIAN' && user.primary_role && (
          <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
            <Music className="w-3 h-3 flex-shrink-0" />
            {user.primary_role}
          </div>
        )}

        {user.location && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{user.location}</span>
          </div>
        )}

        {/* Rating */}
        {user.average_rating > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {user.average_rating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">
              ({user.total_reviews || 0} reviews)
            </span>
          </div>
        )}

        {/* Bio */}
        {user.bio && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2.5 line-clamp-2 leading-relaxed">
            {user.bio}
          </p>
        )}

        {/* Genres */}
        {user.role === 'MUSICIAN' && user.genres?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {user.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-[11px] rounded-full font-medium"
              >
                {genre}
              </span>
            ))}
            {user.genres.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[11px] rounded-full font-medium">
                +{user.genres.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3 flex items-center justify-between gap-2">

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs">
            {statsLoading ? (
              // Skeleton
              <>
                <div className="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </>
            ) : (
              <>
                <Link
                  href={`/profile/${user.id}`}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition"
                >
                  <span className="font-bold text-gray-900 dark:text-white">{stats.followers}</span>{' '}
                  <span className="text-gray-500 dark:text-gray-400">
                    {stats.followers === 1 ? 'follower' : 'followers'}
                  </span>
                </Link>

                <Link
                  href={`/profile/${user.id}`}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition"
                >
                  <span className="font-bold text-gray-900 dark:text-white">{stats.following}</span>{' '}
                  <span className="text-gray-500 dark:text-gray-400">following</span>
                </Link>
              </>
            )}
          </div>

          {/* Action buttons */}
          {!isOwnProfile && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {showFollowButton && (
                <button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs transition disabled:opacity-60 ${
                    isFollowing
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}

              {showMessageButton && (
                <button
                  onClick={handleMessage}
                  className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 text-gray-600 dark:text-gray-300 rounded-lg transition"
                  title="Send message"
                  aria-label="Send message"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Own profile — subtle link to edit */}
          {isOwnProfile && (
            <Link
              href={user.role === 'MUSICIAN' ? '/musician/settings' : '/client/settings'}
              className="text-[11px] text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition font-medium"
            >
              Edit profile →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}