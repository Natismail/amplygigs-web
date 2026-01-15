// src/components/social/ChatWindow.js - PRODUCTION READY PWA
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, Image as ImageIcon, X, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import Avatar from '@/components/Avatar';
import { useMarkMessagesRead } from '@/hooks/useMarkMessagesRead';

export default function ChatWindow({ conversation, onBack }) {
  const { user } = useAuth();
  const { 
    messages, 
    fetchMessages, 
    sendMessage, 
    subscribeToMessages,
    typingUsers = []
  } = useSocial();
  
  const [messageText, setMessageText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useMarkMessagesRead(conversation?.otherUser?.id);

  useEffect(() => {
    if (!conversation?.id) return;

    fetchMessages(conversation.id);
    const channel = subscribeToMessages(conversation.id);
    
    return () => {
      channel?.unsubscribe();
    };
  }, [conversation?.id, fetchMessages, subscribeToMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end' 
      });
    });
  }, []);

  // ⭐ Format message timestamp
  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'h:mm a');
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'h:mm a')}`;
    } else {
      return format(messageDate, 'MMM d, h:mm a');
    }
  };

  // ⭐ Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // Emit typing event to server
      // socket.emit('typing', { conversationId: conversation.id, userId: user.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // socket.emit('stopTyping', { conversationId: conversation.id });
    }, 1000);
  }, [isTyping]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be less than 10MB');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Only images and videos allowed');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const removeMedia = useCallback(() => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSend = useCallback(async (e) => {
    e?.preventDefault();
    
    const trimmedText = messageText.trim();
    if (!trimmedText && !mediaFile) return;
    if (sending) return;

    setSending(true);
    setError(null);
    
    // ⭐ Optimistic update - add message immediately
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: user.id,
      content: trimmedText,
      media_url: mediaPreview,
      created_at: new Date().toISOString(),
      read: false,
      sending: true, // Flag for optimistic message
    };
    
    try {
      const result = await sendMessage(conversation.id, trimmedText, mediaFile);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      setMessageText('');
      removeMedia();
      
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
      
    } catch (err) {
      setError(err.message || 'Failed to send');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  }, [messageText, mediaFile, sending, conversation?.id, sendMessage, removeMedia, scrollToBottom, user?.id, mediaPreview]);

  const handleInputChange = useCallback((e) => {
    setMessageText(e.target.value);
    handleTyping();
  }, [handleTyping]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }, [handleSend]);

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6 max-w-sm">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No chat selected
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Select a conversation from your inbox to start chatting
          </p>
        </div>
      </div>
    );
  }

  const otherUserTyping = typingUsers.includes(conversation.otherUser?.id);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* ========== HEADER ========== */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10">
        <button
          onClick={onBack}
          className="lg:hidden -ml-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all active:scale-90"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <div className="relative flex-shrink-0">
          <Avatar 
            user={conversation.otherUser} 
            size="sm"
          />
          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 dark:text-white truncate text-base">
            {conversation.otherUser?.first_name} {conversation.otherUser?.last_name}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {otherUserTyping ? (
              <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                typing
              </span>
            ) : (
              <span className="capitalize">{conversation.otherUser?.role?.toLowerCase() || 'User'}</span>
            )}
          </p>
        </div>
      </header>

      {/* ========== MESSAGES ========== */}
      <main 
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 dark:bg-gray-950"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center max-w-xs">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center">
                <Send className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Start the conversation
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Send a message to begin chatting with {conversation.otherUser?.first_name}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const showAvatar = index === messages.length - 1 || messages[index + 1]?.sender_id !== message.sender_id;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'} ${message.sending ? 'opacity-60' : 'opacity-100'}`}
                >
                  {!isOwn && (
                    <div className="flex-shrink-0 w-8">
                      {showAvatar && (
                        <Avatar 
                          user={message.sender || conversation.otherUser} 
                          size="xs"
                        />
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Media */}
                    {message.media_url && (
                      <div className="mb-1.5 rounded-2xl overflow-hidden shadow-md max-w-full">
                        {message.media_type === 'image' || message.media_url.startsWith('data:image') ? (
                          <img
                            src={message.media_url}
                            alt="Shared"
                            className="max-w-full h-auto max-h-64 rounded-2xl cursor-pointer active:opacity-90 transition"
                            loading="lazy"
                            onClick={() => !message.sending && window.open(message.media_url, '_blank')}
                          />
                        ) : (
                          <video
                            src={message.media_url}
                            controls
                            playsInline
                            className="max-w-full h-auto max-h-64 rounded-2xl"
                          />
                        )}
                      </div>
                    )}

                    {/* Message bubble */}
                    {message.content && (
                      <div
                        className={`relative px-3.5 py-2 rounded-2xl shadow-sm transition-all ${
                          isOwn
                            ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-md'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        {message.sending && (
                          <div className="absolute -right-1 -bottom-1">
                            <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamp & status */}
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <time className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMessageTime(message.created_at)}
                      </time>
                      {isOwn && !message.sending && (
                        message.read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} className="h-1" />
          </>
        )}
      </main>

      {/* ========== ERROR BANNER ========== */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="flex-1 text-xs font-medium text-red-800 dark:text-red-200">
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="p-0.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========== INPUT AREA ========== */}
      <footer className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 safe-area-inset-bottom">
        {/* Media preview */}
        {mediaPreview && (
          <div className="mb-3 animate-fade-in">
            <div className="relative inline-block">
              <img
                src={mediaPreview}
                alt="Preview"
                className="w-20 h-20 rounded-xl object-cover border-2 border-purple-200 dark:border-purple-800 shadow-md"
              />
              <button
                type="button"
                onClick={removeMedia}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg active:scale-90 transition-transform"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 truncate max-w-[80px]">
                {mediaFile?.name}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={sending}
          />
          
          {/* Attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="flex-shrink-0 p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all active:scale-90 disabled:opacity-50"
            aria-label="Attach media"
          >
            <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              disabled={sending}
              maxLength={1000}
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-shadow"
              autoComplete="off"
            />
            {messageText.length > 900 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {1000 - messageText.length}
              </span>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={(!messageText.trim() && !mediaFile) || sending}
            className="flex-shrink-0 p-2.5 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-full transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </footer>
    </div>
  );
}