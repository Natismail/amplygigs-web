// src/context/SocialContext.js
'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
  
  // State
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
   const [unreadCount, setUnreadCount] = useState(0);
  

  const [loading, setLoading] = useState({
    posts: false,
    followers: false,
    following: false,
    notifications: false,
    conversations: false,
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
  // POST FUNCTIONS
  // =====================================================

  // const fetchFeed = useCallback(async () => {
  //   if (!user) return { data: null, error: 'Not authenticated' };

  //   setLoading(prev => ({ ...prev, posts: true }));

  //   try {
  //     const { data, error } = await supabase
  //       .from('posts')
  //       .select(`
  //         *,
  //         user:user_id (
  //           id,
  //           first_name,
  //           last_name,
  //           role,
  //           profile_picture_url
  //         ),
  //         likes:post_likes(count),
  //         comments:post_comments(count),
  //         user_liked:post_likes!inner(user_id)
  //       `)
  //       .or(`user_id.eq.${user.id},user_id.in.(SELECT following_id FROM user_follows WHERE follower_id = ${user.id})`)
  //       .eq('is_public', true)
  //       .order('created_at', { ascending: false })
  //       .limit(50);

  //     if (error) throw error;

  //     setPosts(data || []);
  //     return { data, error: null };
  //   } catch (error) {
  //     console.error('Error fetching feed:', error);
  //     return { data: null, error };
  //   } finally {
  //     setLoading(prev => ({ ...prev, posts: false }));
  //   }
  // }, [user]);


// Replace your current fetchFeed with this:

const fetchFeed = useCallback(async () => {
  if (!user) return { data: null, error: 'Not authenticated' };

  setLoading(prev => ({ ...prev, posts: true }));

  try {
    console.log('📥 Fetching feed for user:', user.id);
    
    // ✅ FIXED: Get ALL public posts, not just followed users
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
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Error fetching posts:', error);
      throw error;
    }

    console.log('✅ Fetched posts:', data?.length || 0);

    // ✅ FIXED: Get likes count and user's like status separately
    const postsWithDetails = await Promise.all(
      (data || []).map(async (post) => {
        // Get likes count
        const { count: likesCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Check if current user liked this post
        const { data: userLike } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single();

        // Get comments count
        const { count: commentsCount } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Get shares count
        const { count: sharesCount } = await supabase
          .from('post_shares')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        return {
          ...post,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          shares_count: sharesCount || 0,
          user_liked: !!userLike,
        };
      })
    );

    console.log('✅ Posts with details:', postsWithDetails.length);

    setPosts(postsWithDetails);
    return { data: postsWithDetails, error: null };
  } catch (error) {
    console.error('❌ Error fetching feed:', error);
    return { data: null, error };
  } finally {
    setLoading(prev => ({ ...prev, posts: false }));
  }
}, [user]);



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

      if (mediaFile) {
        const { url, error } = await uploadMedia(mediaFile, user.id);
        if (error) throw error;
        mediaUrl = url;
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

      // Get post owner to create notification
      const { data: post } = await supabase
        .from('posts')
        .select('user_id, caption')
        .eq('id', postId)
        .single();

      if (post && post.user_id !== user.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: post.user_id,
            type: 'like',
            title: 'New Like',
            message: `${user.first_name} ${user.last_name} liked your post`,
            related_user_id: user.id,
            related_post_id: postId,
            action_url: `/feed?post=${postId}`,
          });
      }

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

      // Get post owner to create notification
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (post && post.user_id !== user.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: post.user_id,
            type: 'comment',
            title: 'New Comment',
            message: `${user.first_name} ${user.last_name} commented: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
            related_user_id: user.id,
            related_post_id: postId,
            action_url: `/feed?post=${postId}`,
          });
      }

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

  // =====================================================
  // MESSAGING FUNCTIONS
  // =====================================================

const getOrCreateConversation = useCallback(async (otherUserId) => {
  if (!user) return { error: 'Not authenticated' };

  try {
    console.log('🔍 Checking for existing conversation with user:', otherUserId);
    
    // Check if conversation already exists between these two users
    const { data: existingConversations, error: fetchError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations!inner (
          id,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('❌ Error fetching existing conversations:', fetchError);
      throw fetchError;
    }

    console.log('📋 Found participations:', existingConversations?.length || 0);

    // Find conversation where the other user is also a participant
    for (const conv of existingConversations || []) {
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conv.conversation_id);

      if (participantsError) {
        console.error('❌ Error fetching participants:', participantsError);
        continue;
      }

      const participantIds = participants?.map(p => p.user_id) || [];
      
      if (participantIds.includes(otherUserId) && participantIds.length === 2) {
        console.log('✅ Found existing conversation:', conv.conversation_id);
        return { data: conv.conversations, error: null };
      }
    }

    console.log('➕ Creating new conversation...');

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating conversation:', createError);
      throw createError;
    }

    console.log('✅ Conversation created:', newConversation.id);

    // Add both participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConversation.id, user_id: user.id },
        { conversation_id: newConversation.id, user_id: otherUserId }
      ]);

    if (participantsError) {
      console.error('❌ Error adding participants:', participantsError);
      throw participantsError;
    }

    console.log('✅ Participants added successfully');

    return { data: newConversation, error: null };
  } catch (error) {
    console.error('❌ Full error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return { data: null, error };
  }
}, [user]);


// In src/context/SocialContext.js - Replace fetchConversations
const fetchConversations = useCallback(async () => {
  if (!user) {
    console.log('⏭️ No user, skipping conversations fetch');
    return { error: 'Not authenticated' };
  }

  setLoading(prev => ({ ...prev, conversations: true }));

  try {
    console.log('📥 Fetching conversations for user:', user.id);
    
    const { data: participations, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        last_read_at,
        is_muted,
        is_archived,
        conversations!inner (
          id,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error fetching participations:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('📋 Found participations:', participations?.length || 0);

    const conversationsWithDetails = await Promise.all(
      (participations || []).map(async (participation) => {
        const conversationId = participation.conversation_id;

        const { data: participants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            user_profiles!inner (
              id,
              first_name,
              last_name,
              profile_picture_url,
              role
            )
          `)
          .eq('conversation_id', conversationId)
          .neq('user_id', user.id)
          .single();

        if (participantsError) {
          console.warn('⚠️ Error fetching participant for conversation:', conversationId);
        }

        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // ⭐ UPDATED: More explicit unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .eq('receiver_id', user.id)    // ⭐ ADDED
          .eq('read', false);             // ⭐ ADDED

        return {
          ...participation.conversations,
          otherUser: participants?.user_profiles,
          lastMessage,
          unreadCount: unreadCount || 0,
          isMuted: participation.is_muted,
          isArchived: participation.is_archived,
        };
      })
    );

    console.log('✅ Fetched conversations with details:', conversationsWithDetails.length);

    setConversations(conversationsWithDetails);
    
    // ⭐ ADDED: Calculate total unread
    const totalUnread = conversationsWithDetails.reduce(
      (sum, conv) => sum + (conv.unreadCount || 0),
      0
    );
    setUnreadMessagesCount(totalUnread);
    console.log('📬 Total unread messages:', totalUnread);

    return { data: conversationsWithDetails, error: null };
  } catch (error) {
    console.error('❌ Full error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return { data: null, error };
  } finally {
    setLoading(prev => ({ ...prev, conversations: false }));
  }
}, [user]);

  const fetchMessages = useCallback(async (conversationId) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            id,
            first_name,
            last_name,
            profile_picture_url
          )
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { data: null, error };
    }
  }, [user]);

 // SIMPLIFIED VERSION - Removes manual notification creation
// Let the SQL trigger handle notifications instead
// Replace sendMessage in src/context/SocialContext.js

const sendMessage = useCallback(async (conversationId, content, mediaFile = null) => {
  if (!user) {
    console.error('❌ User not authenticated');
    return { error: 'Not authenticated' };
  }

  try {
    console.log('📤 Starting message send...', { 
      conversationId, 
      hasContent: !!content, 
      hasMedia: !!mediaFile,
      userId: user.id 
    });

    // Get the other user from the conversation
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) {
      console.error('❌ Conversation not found:', conversationId);
      return { error: 'Conversation not found' };
    }

    const receiverId = conversation.otherUser?.id;
    if (!receiverId) {
      console.error('❌ Receiver ID not found');
      return { error: 'Receiver not found' };
    }

    console.log('✅ Receiver found:', {
      receiverId,
      receiverName: `${conversation.otherUser.first_name} ${conversation.otherUser.last_name}`
    });

    let mediaUrl = null;
    let mediaType = null;

    // Handle media upload
    if (mediaFile) {
      console.log('📎 Uploading media...');
      try {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('messages')
          .upload(fileName, mediaFile);

        if (uploadError) {
          console.error('❌ Media upload error:', uploadError);
          throw new Error(`Media upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('messages')
          .getPublicUrl(fileName);

        mediaUrl = urlData.publicUrl;
        mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
        console.log('✅ Media uploaded:', mediaUrl);
      } catch (uploadErr) {
        console.error('❌ Exception during media upload:', uploadErr);
        throw uploadErr;
      }
    }

    // Prepare message data
    const messageData = {
      sender_id: user.id,
      receiver_id: receiverId,
      conversation_id: conversationId,
      sender_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
      content: content?.trim() || '',
      media_url: mediaUrl,
      media_type: mediaType,
      read: false,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    console.log('💾 Inserting message:', JSON.stringify(messageData, null, 2));

    // Insert message (trigger will create notification automatically)
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select(`
        *,
        sender:sender_id (
          id,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      
      throw new Error(error.message || 'Failed to send message');
    }

    if (!data) {
      throw new Error('No data returned from database');
    }

    console.log('✅ Message sent successfully:', data);

    // Update conversation timestamp
    try {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      console.log('✅ Conversation timestamp updated');
    } catch (convError) {
      console.warn('⚠️ Could not update conversation timestamp:', convError);
      // Don't fail the whole operation if conversation update fails
    }

    // Update local messages state
    setMessages(prev => [...prev, data]);

    return { data, error: null };
  } catch (error) {
    console.error('❌ Exception in sendMessage:', error);
    
    return { 
      data: null, 
      error: {
        message: error?.message || 'Unknown error occurred',
        details: error?.details || null,
        code: error?.code || null
      }
    };
  }
}, [user, conversations, setMessages]);



  // ⭐ Fetch unread message count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      console.log('⏸️ No user, skipping unread count fetch');
      return;
    }

    try {
      console.log('🔔 Fetching unread message count for user:', user.id);
      
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('❌ Error fetching unread count:', error);
        return;
      }

      console.log('✅ Unread count:', count);
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('❌ Exception fetching unread count:', err);
    }
  }, [user?.id]);

  



  // ⭐ Listen for messagesRead events to refresh unread count
  useEffect(() => {
    const handleMessagesRead = () => {
      console.log('🔄 Messages marked as read - refreshing unread count');
      fetchUnreadCount();
    };

    window.addEventListener('messagesRead', handleMessagesRead);

    return () => {
      window.removeEventListener('messagesRead', handleMessagesRead);
    };
  }, [fetchUnreadCount]);

  // ⭐ Fetch unread count on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
    }
  }, [user?.id, fetchUnreadCount])

  const deleteMessage = useCallback(async (messageId) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));

      return { error: null };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { error };
    }
  }, [user]);

  const subscribeToMessages = useCallback((conversationId) => {
    if (!user) return null;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data: sender } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name, profile_picture_url')
            .eq('id', payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            sender,
          };

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return channel;
  }, [user]);

  // =====================================================
  // NOTIFICATION FUNCTIONS
  // =====================================================

  
const fetchNotifications = useCallback(async () => {
  if (!user) return { error: 'Not authenticated' };

  setLoading(prev => ({ ...prev, notifications: true }));

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        related_user:related_user_id (
          id,
          first_name,
          last_name,
          profile_picture_url,
          role
        ),
        related_post:related_post_id (
          id,
          caption,
          media_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    setNotifications(data || []);
    
    // ⭐ UPDATED: Check both is_read and read
    const unreadCount = data?.filter(n => !n.is_read && !n.read).length || 0;
    setUnreadNotificationsCount(unreadCount);

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: null, error };
  } finally {
    setLoading(prev => ({ ...prev, notifications: false }));
  }
}, [user]);


  const markNotificationAsRead = useCallback(async (notificationId) => {
  if (!user) return { error: 'Not authenticated' };

  try {
    // ⭐ Call API instead of direct Supabase
    const response = await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId, userId: user.id })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to mark as read');
    }

    // Update local state
    setNotifications(prev => 
      prev.map(n => n.id === notificationId 
        ? { ...n, is_read: true, read_at: new Date().toISOString() } 
        : n
      )
    );
    setUnreadNotificationsCount(prev => Math.max(0, prev - 1));

    return { error: null };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { error };
  }
}, [user]);

const markAllNotificationsAsRead = useCallback(async () => {
  if (!user) return { error: 'Not authenticated' };

  try {
    // ⭐ Call API instead of direct Supabase
    const response = await fetch('/api/notifications/mark-read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to mark all as read');
    }

    // Update local state
    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    setUnreadNotificationsCount(0);

    return { error: null };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { error };
  }
}, [user]);

const deleteNotification = useCallback(async (notificationId) => {
  if (!user) return { error: 'Not authenticated' };

  try {
    // ⭐ Call API instead of direct Supabase
    const response = await fetch(
      `/api/notifications/mark-read?id=${notificationId}&userId=${user.id}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete notification');
    }

    // Update local state
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    return { error: null };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { error };
  }
}, [user]);


  const createNotification = useCallback(async ({ 
    userId, 
    type, 
    title, 
    message, 
    relatedUserId = null,
    relatedPostId = null,
    actionUrl = null 
  }) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          related_user_id: relatedUserId,
          related_post_id: relatedPostId,
          action_url: actionUrl,
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { data: null, error };
    }
  }, []);

  const subscribeToNotifications = useCallback(() => {
    if (!user) return null;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const { data: relatedUser } = payload.new.related_user_id 
            ? await supabase
                .from('user_profiles')
                .select('id, first_name, last_name, profile_picture_url, role')
                .eq('id', payload.new.related_user_id)
                .single()
            : { data: null };

          const { data: relatedPost } = payload.new.related_post_id
            ? await supabase
                .from('posts')
                .select('id, caption, media_url')
                .eq('id', payload.new.related_post_id)
                .single()
            : { data: null };

          const newNotification = {
            ...payload.new,
            related_user: relatedUser,
            related_post: relatedPost,
          };

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadNotificationsCount(prev => prev + 1);

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: relatedUser?.profile_picture_url || '/icons/icon-192.png',
            });
          }
        }
      )
      .subscribe();

    return channel;
  }, [user]);



  // =============================================
  // REAL-TIME SUBSCRIPTIONS
  // =============================================

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔔 Setting up real-time subscriptions');

    // Notifications channel
    const notifChannel = supabase
      .channel(`notif:${user.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('🔔 New notification:', payload.new);
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadNotificationsCount(prev => prev + 1);
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(payload.new.title, {
              body: payload.new.message,
              icon: '/icons/icon-192.png',
            });
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
          if (payload.new.is_read || payload.new.read) {
            setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    // Messages channel
    const msgChannel = supabase
      .channel(`msg:${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          console.log('💬 New message:', payload.new);
          setUnreadMessagesCount(prev => prev + 1);
          fetchConversations();
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Message', {
              body: payload.new.content?.substring(0, 50) + '...',
              icon: '/icons/icon-192.png',
            });
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          if (payload.new.read && !payload.old.read) {
            setUnreadMessagesCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(msgChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);


  const value = {
    // State
    posts,
    followers,
    following,
    notifications,
    unreadNotificationsCount,
    conversations,
    activeConversation,
    messages,
    uploadProgress,
    loading,
    
    // Follow functions
    followUser,
    unfollowUser,
    checkIfFollowing,
    fetchFollowers,
    fetchFollowing,
    
    // Post functions
    fetchFeed,
    createPost,
    deletePost,
    updatePost,
    uploadMedia,
    
    // Like functions
    likePost,
    unlikePost,
    
    // Comment functions
    addComment,
    fetchComments,
    
    // Share function
    sharePost,
    
    // Messaging functions
    getOrCreateConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    deleteMessage,
    subscribeToMessages,
    setActiveConversation,
    // State
    conversations,
    messages,
    unreadCount,
    
    // Functions
    fetchConversations,
    fetchMessages,
    sendMessage,
    subscribeToMessages,
    fetchUnreadCount,

    // Notification functions
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    createNotification,
    subscribeToNotifications,
    
    // Setters
    setPosts,
    setFollowers,
    setFollowing,
    setNotifications,

    notifications,
    unreadNotificationsCount,
    loadingNotifications: loading.notifications,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    subscribeToNotifications,
    conversations,
    unreadMessagesCount,
    loadingConversations: loading.conversations,
    fetchConversations,
    getOrCreateConversation,
    sendMessage,
    followUser,
    unfollowUser,
    checkIfFollowing,
    loading,
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
};

// export function useSocial() {
//   const context = useContext(SocialContext);
//   if (!context) throw new Error('useSocial must be used within SocialProvider');
//   return context;
// }