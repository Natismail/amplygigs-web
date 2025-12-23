// src/components/social/UserProfileCard.js
"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Music, Star } from 'lucide-react';
import FollowButton from './FollowButton';
import { useAuth } from '@/context/AuthContext';

export default function UserProfileCard({ user, showFollowButton = true }) {
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === user.id;

  const getProfileImage = () => {
    return user.profile_picture_url || '/images/default-avatar.png';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-4">
        {/* Profile Picture */}
        <Link href={`/profile/${user.id}`}>
          <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition">
            <Image
              src={getProfileImage()}
              alt={`${user.first_name} ${user.last_name}`}
              fill
              className="object-cover"
            />
          </div>
        </Link>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${user.id}`}>
            <h3 className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition truncate">
              {user.first_name} {user.last_name}
            </h3>
          </Link>
          
          {user.role === 'MUSICIAN' && user.primary_role && (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
              <Music className="w-4 h-4" />
              <span>{user.primary_role}</span>
            </div>
          )}

          {user.location && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <MapPin className="w-3 h-3" />
              <span>{user.location}</span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{user.followers_count || 0}</span> followers
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{user.following_count || 0}</span> following
            </span>
            {user.average_rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{user.average_rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Follow Button */}
        {!isOwnProfile && showFollowButton && (
          <FollowButton targetUserId={user.id} targetUser={user} />
        )}
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 line-clamp-2">
          {user.bio}
        </p>
      )}

      {/* Genres */}
      {user.role === 'MUSICIAN' && user.genres && user.genres.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {user.genres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded-full"
            >
              {genre}
            </span>
          ))}
          {user.genres.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
              +{user.genres.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}