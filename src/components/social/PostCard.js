// src/components/social/PostCard.js
"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/Avatar';
import CommentsSection from './CommentsSection';

export default function PostCard({ post }) {
  const { user } = useAuth();
  const { likePost, unlikePost, deletePost, sharePost } = useSocial();
  
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  
  const isOwnPost = user?.id === post.user_id;

  const handleLike = async () => {
    const previousState = isLiked;
    const previousCount = likesCount;
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    const { error } = isLiked 
      ? await unlikePost(post.id)
      : await likePost(post.id);

    if (error) {
      // Revert on error
      setIsLiked(previousState);
      setLikesCount(previousCount);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    
    const { error } = await deletePost(post.id);
    if (error) {
      alert('Failed to delete post');
    }
  };

  const handleShare = async () => {
    const { error } = await sharePost(post.id);
    if (error) {
      alert('Failed to share post');
    } else {
      alert('Post shared!');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Link href={`/profile/${post.user.id}`} className="flex items-center gap-3 flex-1">
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={post.user.profile_picture_url || '/images/default-avatar.png'}
              alt={`${post.user.first_name}`}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {post.user.first_name} {post.user.last_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </Link>

        {/* Menu */}
        {isOwnPost && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
            {post.caption}
          </p>
        </div>
      )}

      {/* Media */}
      {post.media_url && (
        <div className="relative w-full bg-black">
          {post.media_type === 'image' ? (
            <div className="relative w-full" style={{ paddingBottom: '75%' }}>
              <Image
                src={post.media_url}
                alt="Post media"
                fill
                className="object-contain"
              />
            </div>
          ) : post.media_type === 'video' ? (
            <video
              src={post.media_url}
              controls
              className="w-full max-h-[600px]"
            />
          ) : null}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-3">
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
          <div className="flex gap-3">
            <span>{post.comments_count || 0} comments</span>
            <span>{post.shares_count || 0} shares</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-around border-t border-gray-200 dark:border-gray-700 pt-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
              isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">Like</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-400"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Comment</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-400"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && <CommentsSection postId={post.id} />}
    </div>
  );
}