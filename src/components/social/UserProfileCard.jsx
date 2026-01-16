// src/components/social/UserProfileCard.js - OPTION 1: BUTTONS AT BOTTOM RIGHT
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Music, Star, MessageCircle, UserPlus, UserCheck } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useSocial } from '@/context/SocialContext';
import { supabase } from '@/lib/supabaseClient';

export default function UserProfileCard({ user, showFollowButton = true, showMessageButton = true }) {
  const { user: currentUser } = useAuth();
  const { getOrCreateConversation } = useSocial();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    followers: user.followers_count || 0,
    following: user.following_count || 0,
  });
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  const isOwnProfile = currentUser?.id === user.id;

  useEffect(() => {
    fetchStats();
    checkFollowStatus();
  }, [user.id, currentUser]);

  const fetchStats = async () => {
    try {
      const { count: followersCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      setStats({
        followers: followersCount || 0,
        following: followingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser || isOwnProfile) return;
    
    try {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', user.id)
        .single();
      
      setIsFollowing(!!data);
    } catch (error) {
      setIsFollowing(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || isFollowLoading) return;
    
    setIsFollowLoading(true);
    
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', user.id);
        
        if (!error) {
          setIsFollowing(false);
          setStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
        }
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUser.id,
            following_id: user.id,
          });
        
        if (!error) {
          setIsFollowing(true);
          setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
          
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'follow',
              title: 'New Follower',
              message: `${currentUser.first_name} ${currentUser.last_name} started following you`,
              related_user_id: currentUser.id,
              action_url: `/profile/${currentUser.id}`,
            });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      const { data, error } = await getOrCreateConversation(user.id);
      
      if (error) {
        console.error('Error creating conversation:', error);
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Top Section: Avatar + Info */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link href={`/profile/${user.id}`} className="flex-shrink-0">
          <div className="cursor-pointer hover:opacity-80 transition">
            <Avatar user={user} size="lg" />
          </div>
        </Link>

        {/* Name & Details - Full Width! */}
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${user.id}`}>
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition">
              {user.first_name} {user.last_name}
            </h3>
          </Link>
          
          {user.role === 'MUSICIAN' && user.primary_role && (
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              <Music className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{user.primary_role}</span>
            </div>
          )}

          {user.location && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{user.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
          {user.bio}
        </p>
      )}

      {/* Genres */}
      {user.role === 'MUSICIAN' && user.genres && user.genres.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {user.genres.slice(0, 4).map((genre) => (
            <span
              key={genre}
              className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium"
            >
              {genre}
            </span>
          ))}
          {user.genres.length > 4 && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full font-medium">
              +{user.genres.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Bottom Section: Stats + Buttons */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        {/* Stats on Left */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          <Link 
            href={`/profile/${user.id}`}
            className="hover:text-purple-600 dark:hover:text-purple-400 transition"
          >
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats.followers}
            </span>{' '}
            <span className="text-gray-600 dark:text-gray-400">
              {stats.followers === 1 ? 'follower' : 'followers'}
            </span>
          </Link>
          
          <Link 
            href={`/profile/${user.id}`}
            className="hover:text-purple-600 dark:hover:text-purple-400 transition"
          >
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats.following}
            </span>{' '}
            <span className="text-gray-600 dark:text-gray-400">following</span>
          </Link>
          
          {user.average_rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {user.average_rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Buttons on Right */}
        {!isOwnProfile && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {showFollowButton && (
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition ${
                  isFollowing
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                } disabled:opacity-50`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Follow</span>
                  </>
                )}
              </button>
            )}
            
            {showMessageButton && (
              <button
                onClick={handleMessage}
                className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                title="Send message"
                aria-label="Send message"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}