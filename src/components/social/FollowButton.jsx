// src/components/social/FollowButton.js
"use client";

import { useState, useEffect } from 'react';
import { useSocial } from '@/context/SocialContext';
import { UserPlus, UserCheck } from 'lucide-react';

export default function FollowButton({ targetUserId, targetUser }) {
  const { followUser, unfollowUser, checkIfFollowing } = useSocial();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const following = await checkIfFollowing(targetUserId);
      setIsFollowing(following);
    };
    checkStatus();
  }, [targetUserId, checkIfFollowing]);

  const handleToggle = async () => {
    setLoading(true);
    
    if (isFollowing) {
      const { error } = await unfollowUser(targetUserId);
      if (!error) setIsFollowing(false);
    } else {
      const { error } = await followUser(targetUserId);
      if (!error) setIsFollowing(true);
    }
    
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition min-h-[44px] ${
        isFollowing
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          : 'bg-purple-600 text-white hover:bg-purple-700'
      } disabled:opacity-50`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="w-4 h-4" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Follow</span>
        </>
      )}
    </button>
  );
}