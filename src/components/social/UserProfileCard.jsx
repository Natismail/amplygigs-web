// src/components/social/UserProfileCard.js - FIXED SOCIAL STATS
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Music, Star, MessageCircle } from 'lucide-react';
import Avatar from '@/components/Avatar';
import FollowButton from './FollowButton';
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
  
  const isOwnProfile = currentUser?.id === user.id;

  // Fetch real-time stats
  useEffect(() => {
    fetchStats();
  }, [user.id]);

  const fetchStats = async () => {
    try {
      // Get actual follower count
      const { count: followersCount, error: followersError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      // Get actual following count
      const { count: followingCount, error: followingError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      if (!followersError && !followingError) {
        setStats({
          followers: followersCount || 0,
          following: followingCount || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-4">
        {/* Profile Picture with Avatar component */}
        <Link href={`/profile/${user.id}`}>
          <div className="cursor-pointer hover:opacity-80 transition">
            <Avatar user={user} size="lg" />
          </div>
        </Link>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${user.id}`}>
            <h3 className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition truncate">
              {user.first_name} {user.last_name}
            </h3>
          </Link>
          
          {/* Role Badge for Musicians */}
          {user.role === 'MUSICIAN' && user.primary_role && (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
              <Music className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{user.primary_role}</span>
            </div>
          )}

          {/* Location */}
          {user.location && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{user.location}</span>
            </div>
          )}

          {/* Stats - Using real-time data */}
          <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
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
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user.average_rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="flex gap-2 flex-shrink-0">
            {showFollowButton && (
              <FollowButton 
                targetUserId={user.id} 
                targetUser={user}
                onFollowChange={fetchStats} // Refresh stats when follow changes
              />
            )}
            
            {showMessageButton && (
              <button
                onClick={handleMessage}
                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                title="Send message"
                aria-label="Send message"
              >
                <MessageCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 line-clamp-3">
          {user.bio}
        </p>
      )}

      {/* Genres (for musicians) */}
      {user.role === 'MUSICIAN' && user.genres && user.genres.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {user.genres.slice(0, 4).map((genre) => (
            <span
              key={genre}
              className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium"
            >
              {genre}
            </span>
          ))}
          {user.genres.length > 4 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full font-medium">
              +{user.genres.length - 4} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}