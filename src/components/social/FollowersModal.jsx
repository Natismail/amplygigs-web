// src/components/social/FollowersModal.js
"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import UserProfileCard from './UserProfileCard';

export default function FollowersModal({ userId, type = 'followers', onClose }) {
  const { fetchFollowers, fetchFollowing, loading } = useSocial();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (type === 'followers') {
        const { data } = await fetchFollowers(userId);
        setUsers(data?.map(f => f.follower) || []);
      } else {
        const { data } = await fetchFollowing(userId);
        setUsers(data?.map(f => f.following) || []);
      }
    };
    fetchData();
  }, [userId, type, fetchFollowers, fetchFollowing]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading[type] ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No {type} yet
            </div>
          ) : (
            users.map((user) => (
              <UserProfileCard key={user.id} user={user} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}