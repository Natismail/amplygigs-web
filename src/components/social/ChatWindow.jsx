// src/components/social/ChatWindow.js - FINAL MOBILE FIX
"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Paperclip, X, MoreVertical, Loader2, AlertCircle } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/Avatar';
import { useMarkMessagesRead } from '@/hooks/useMarkMessagesRead';

export default function ChatWindow({ conversation, onBack }) {
  const { user } = useAuth();
  const { messages, fetchMessages, sendMessage, subscribeToMessages } = useSocial();
  
  const [messageText, setMessageText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // ⭐ Auto-mark messages as read
  useMarkMessagesRead(conversation?.otherUser?.id);

  useEffect(() => {
    if (conversation) {
      fetchMessages(conversation.id);
      const channel = subscribeToMessages(conversation.id);
      return () => channel?.unsubscribe();
    }
  }, [conversation?.id, fetchMessages, subscribeToMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ⭐ CRITICAL: Prevent body scroll when keyboard opens
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const preventScroll = (e) => {
      if (containerRef.current?.contains(e.target)) {
        e.preventDefault();
      }
    };

    // Lock body scroll on mobile
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, []);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setMediaFile(file);
    setError(null);
    
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    const trimmedText = messageText.trim();
    if (!trimmedText && !mediaFile) return;

    setSending(true);
    setError(null);
    
    try {
      const result = await sendMessage(conversation.id, trimmedText, mediaFile);
      
      if (result.error) {
        setError(result.error.message || 'Failed to send message');
      } else {
        setMessageText('');
        setMediaFile(null);
        setMediaPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => scrollToBottom(false), 100);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Conversation Selected
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a conversation from the list to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    // ⭐ CRITICAL FIX: Use dvh (dynamic viewport height) + flex
    <div 
      ref={containerRef}
      className="flex flex-col bg-white dark:bg-gray-900"
      style={{
        height: '100dvh', // ⭐ Dynamic viewport height (mobile-safe)
        maxHeight: '100dvh',
        overflow: 'hidden',
      }}
    >
      {/* ⭐ HEADER - Fixed position */}
      <div className="flex-shrink-0 flex items-center gap-3 p-3 lg:p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
        <button
          onClick={onBack}
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Avatar user={conversation.otherUser} size="sm" />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm lg:text-base text-gray-900 dark:text-white truncate">
            {conversation.otherUser?.first_name} {conversation.otherUser?.last_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
            {conversation.otherUser?.role?.toLowerCase() || 'User'}
          </p>
        </div>

        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* ⭐ MESSAGES - Scrollable area */}
      <div 
        className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 bg-gray-50 dark:bg-gray-950"
        style={{
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-4xl mb-3">👋</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {!isOwn && (
                    <div className="flex-shrink-0 mt-auto">
                      <Avatar user={message.sender || conversation.otherUser} size="xs" />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[80%] sm:max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {message.media_url && (
                      <div className="mb-2 rounded-lg overflow-hidden">
                        {message.media_type === 'image' ? (
                          <img
                            src={message.media_url}
                            alt="Message media"
                            className="max-w-full max-h-48 rounded-lg"
                            onClick={() => window.open(message.media_url, '_blank')}
                          />
                        ) : (
                          <video
                            src={message.media_url}
                            controls
                            className="max-w-full max-h-48 rounded-lg"
                          />
                        )}
                      </div>
                    )}

                    {message.content && (
                      <div
                        className={`px-3 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-purple-600 text-white rounded-br-none'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    )}

                    <span className="text-xs text-gray-500 mt-1 px-2">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex-shrink-0 px-3 py-2 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-xs text-red-800 dark:text-red-200">
            <AlertCircle className="w-4 h-4" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ⭐ INPUT - Fixed at bottom */}
      <form 
        onSubmit={handleSend} 
        className="flex-shrink-0 p-3 lg:p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
        }}
      >
        {mediaPreview && (
          <div className="mb-2 relative inline-block">
            <img
              src={mediaPreview}
              alt="Preview"
              className="max-w-24 max-h-24 rounded-lg border-2 border-purple-200"
            />
            <button
              type="button"
              onClick={removeMedia}
              className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <Paperclip className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>

          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sending}
            maxLength={1000}
            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />

          <button
            type="submit"
            disabled={(!messageText.trim() && !mediaFile) || sending}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}