// src/components/social/CommentsSection.js
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Send } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function CommentsSection({ postId }) {
  const { user } = useAuth();
  const { addComment, fetchComments } = useSocial();
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    const { data } = await fetchComments(postId);
    setComments(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { data, error } = await addComment(postId, newComment.trim());
    
    if (!error && data) {
      setComments(prev => [...prev, data]);
      setNewComment('');
    }
    
    setSubmitting(false);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      {/* Comments List */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={comment.user.profile_picture_url || '/images/default-avatar.png'}
                  alt={comment.user.first_name}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {comment.user.first_name} {comment.user.last_name}
                  </p>
                  <p className="text-gray-800 dark:text-gray-200 text-sm mt-1">
                    {comment.content}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-4">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={user?.profile_picture_url || '/images/default-avatar.png'}
              alt={user?.first_name || 'User'}
              fill
              className="object-cover"
            />
          </div>
          
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}