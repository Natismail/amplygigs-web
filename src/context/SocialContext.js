// src/context/SocialContext.js
'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const SocialContext = createContext({});

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};

export const SocialProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [loading, setLoading] = useState({
    posts: false,
    followers: false,
    following: false,
    notifications: false,
  });

  // =====================================================
  // FOLLOW/UNFOLLOW FUNCTIONS
  // =====================================================

  const followUser = useCallback(async (targetUserId) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for followed user
      await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type: 'follow',
          title: 'New Follower',
          message: `${user.first_name} ${user.last_name} started following you`,
          related_user_id: user.id,
          action_url: `/profile/${user.id}`,
        });

      return { data, error: null };
    } catch (error) {
      console.error('Error following user:', error);
      return { data: null, error };
    }
  }, [user]);

  const unfollowUser = useCallback(async (targetUserId) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return { error };
    }
  }, [user]);

  const checkIfFollowing = useCallback(async (targetUserId) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }, [user]);

  const fetchFollowers = useCallback(async (userId) => {
    setLoading(prev => ({ ...prev, followers: true }));

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          id,
          created_at,
          follower:follower_id (
            id,
            first_name,
            last_name,
            email,
            role,
            profile_picture_url
          )
        `)
        .eq('following_id', userId || user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFollowers(data || []);
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching followers:', error);
      return { data: null, error };
    } finally {
      setLoading(prev => ({ ...prev, followers: false }));
    }
  }, [user]);

  const fetchFollowing = useCallback(async (userId) => {
    setLoading(prev => ({ ...prev, following: true }));

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          id,
          created_at,
          following:following_id (
            id,
            first_name,
            last_name,
            email,
            role,
            profile_picture_url
          )
        `)
        .eq('follower_id', userId || user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFollowing(data || []);
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching following:', error);
      return { data: null, error };
    } finally {
      setLoading(prev => ({ ...prev, following: false }));
    }
  }, [user]);

  // =====================================================
  // POST FUNCTIONS (We'll expand this)
  // =====================================================

  const fetchFeed = useCallback(async () => {
    if (!user) return { data: null, error: 'Not authenticated' };

    setLoading(prev => ({ ...prev, posts: true }));

    try {
      // Get posts from followed users + own posts
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_id (
            id,
            first_name,
            last_name,
            role,
            profile_picture_url
          ),
          likes:post_likes(count),
          comments:post_comments(count),
          user_liked:post_likes!inner(user_id)
        `)
        .or(`user_id.eq.${user.id},user_id.in.(SELECT following_id FROM user_follows WHERE follower_id = ${user.id})`)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setPosts(data || []);
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching feed:', error);
      return { data: null, error };
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  }, [user]);


  // =====================================================
// POST UPLOAD & CRUD FUNCTIONS (Add to SocialContext)
// =====================================================

const uploadMedia = useCallback(async (file, userId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('posts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Media upload error:', error);
    return { url: null, error };
  }
}, []);

const createPost = useCallback(async ({ caption, mediaFile, mediaType }) => {
  if (!user) return { error: 'Not authenticated' };

  try {
    let mediaUrl = null;
    let thumbnailUrl = null;

    // Upload media if provided
    if (mediaFile) {
      const { url, error } = await uploadMedia(mediaFile, user.id);
      if (error) throw error;
      mediaUrl = url;

      // For videos, you could generate a thumbnail here
      // For now, we'll leave it null
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        caption,
        media_url: mediaUrl,
        media_type: mediaType || (mediaFile ? 'video' : 'text'),
        thumbnail_url: thumbnailUrl,
        is_public: true,
      })
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          last_name,
          role,
          profile_picture_url
        )
      `)
      .single();

    if (error) throw error;

    // Optimistically add to feed
    setPosts(prev => [data, ...prev]);

    return { data, error: null };
  } catch (error) {
    console.error('Error creating post:', error);
    return { data: null, error };
  }
}, [user, uploadMedia]);

const deletePost = useCallback(async (postId) => {
  if (!user) return { error: 'Not authenticated' };

  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Remove from local state
    setPosts(prev => prev.filter(p => p.id !== postId));

    return { error: null };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { error };
  }
}, [user]);

const updatePost = useCallback(async (postId, updates) => {
  if (!user) return { error: 'Not authenticated' };

  try {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Update local state
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...data } : p));

    return { data, error: null };
  } catch (error) {
    console.error('Error updating post:', error);
    return { data: null, error };
  }
}, [user]);

// =====================================================
// LIKE FUNCTIONS
// =====================================================

const likePost = useCallback(async (postId) => {
  if (!user) return { error: 'Not authenticated' };

  try {
    const { error } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: user.id,
      });

    if (error) throw error;

    // Optimistically update UI
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, likes_count: (p.likes_count || 0) + 1, user_liked: true }
        : p
    ));

    return { error: null };
  } catch (error) {
    console.error('Error liking post:', error);
    return { error };
  }
}, [user]);

const unlikePost = useCallback(async (postId) => {
  if (!user) return { error: 'Not authenticated' };

  try {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Optimistically update UI
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, likes_count: Math.max((p.likes_count || 0) - 1, 0), user_liked: false }
        : p
    ));

    return { error: null };
  } catch (error) {
    console.error('Error unliking post:', error);
    return { error };
  }
}, [user]);

// =====================================================
// COMMENT FUNCTIONS
// =====================================================

const addComment = useCallback(async (postId, content) => {
  if (!user) return { error: 'Not authenticated' };

  try {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
      })
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .single();

    if (error) throw error;

    // Update post comments count
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, comments_count: (p.comments_count || 0) + 1 }
        : p
    ));

    return { data, error: null };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { data: null, error };
  }
}, [user]);

const fetchComments = useCallback(async (postId) => {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { data: null, error };
  }
}, []);

// =====================================================
// SHARE FUNCTION
// =====================================================

const sharePost = useCallback(async (postId, caption = '') => {
  if (!user) return { error: 'Not authenticated' };

  try {
    const { error } = await supabase
      .from('post_shares')
      .insert({
        post_id: postId,
        user_id: user.id,
        shared_with_caption: caption,
      });

    if (error) throw error;

    // Update shares count
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, shares_count: (p.shares_count || 0) + 1 }
        : p
    ));

    return { error: null };
  } catch (error) {
    console.error('Error sharing post:', error);
    return { error };
  }
}, [user]);

  const value = {
    // State
    posts,
    followers,
    following,
    notifications,
    loading,
    
    // Follow functions
    followUser,
    unfollowUser,
    checkIfFollowing,
    fetchFollowers,
    fetchFollowing,
    
    // Post functions
    fetchFeed,
    
    // Setters (for optimistic updates)
    setPosts,
    setFollowers,
    setFollowing,
    setNotifications,

    // Post functions
  createPost,
  deletePost,
  updatePost,
  uploadMedia,
  uploadProgress,
  
  // Like functions
  likePost,
  unlikePost,
  
  // Comment functions
  addComment,
  fetchComments,
  
  // Share function
  sharePost,
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
};

