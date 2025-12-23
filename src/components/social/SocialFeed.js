// src/components/social/SocialFeed.js
"use client";

import { useEffect, useState } from 'react';
import { useSocial } from '@/context/SocialContext';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import { Plus, Loader } from 'lucide-react';

export default function SocialFeed() {
  const { posts, fetchFeed, loading } = useSocial();
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    fetchFeed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePostSuccess = () => {
    fetchFeed();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Create Post Button */}
      <button
        onClick={() => setShowCreatePost(true)}
        className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        <div className="p-2 bg-purple-600 rounded-full">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <span className="text-gray-600 dark:text-gray-400">
          Share something with your followers...
        </span>
      </button>

      {/* Loading State */}
      {loading.posts ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-gray-500 dark:text-gray-400">Loading feed...</p>
          </div>
        </div>
      ) : posts.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No Posts Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Follow musicians and clients to see their posts here
          </p>
          <button
            onClick={() => setShowCreatePost(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Create Your First Post
          </button>
        </div>
      ) : (
        /* Posts Feed */
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onSuccess={handlePostSuccess}
        />
      )}
    </div>
  );
}