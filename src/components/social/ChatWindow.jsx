// src/components/social/ChatWindow.js - FINAL FIX
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, Image as ImageIcon, X, Check, CheckCheck } from 'lucide-react';
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
  const textareaRef = useRef(null);

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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [messageText]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

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
    setError(null);
    
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
    
    try {
      const result = await sendMessage(conversation.id, trimmedText, mediaFile);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to send');
      }
      
      setMessageText('');
      removeMedia();
      
      setTimeout(() => {
        textareaRef.current?.focus();
        scrollToBottom();
      }, 100);
      
    } catch (err) {
      setError(err.message || 'Failed to send');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  }, [messageText, mediaFile, sending, conversation?.id, sendMessage, removeMedia, scrollToBottom]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }, [handleSend]);

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Select a conversation
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-900">
      
      {/* HEADER - FIXED AT TOP */}
      {/* ⭐ FIX 3: Removed "relative" */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
        <button
          onClick={onBack}
          className="lg:hidden -ml-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <Avatar 
          user={conversation.otherUser} 
          size="sm" 
          className="flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 dark:text-white truncate">
            {conversation.otherUser?.first_name} {conversation.otherUser?.last_name}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {conversation.otherUser?.role?.toLowerCase() || 'User'}
          </p>
        </div>
      </div>

      {/* MESSAGES - SCROLLABLE ONLY */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-950"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="px-4 py-4 space-y-4 min-h-full flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Send className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No messages yet. Say hi! 👋
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
                      <Avatar 
                        user={message.sender || conversation.otherUser} 
                        size="xs" 
                        className="flex-shrink-0 mt-auto"
                      />
                    )}

                    <div className={`flex flex-col max-w-[75%] sm:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      {message.media_url && (
                        <div className="mb-1 rounded-2xl overflow-hidden shadow-md">
                          {message.media_type === 'image' ? (
                            <img
                              src={message.media_url}
                              alt="Shared"
                              className="max-w-full max-h-60 rounded-2xl cursor-pointer active:opacity-90"
                              onClick={() => window.open(message.media_url, '_blank')}
                            />
                          ) : (
                            <video
                              src={message.media_url}
                              controls
                              playsInline
                              className="max-w-full max-h-60 rounded-2xl"
                            />
                          )}
                        </div>
                      )}

                      {message.content && (
                        <div
                          className={`px-4 py-2 rounded-2xl shadow-sm ${
                            isOwn
                              ? 'bg-purple-600 text-white rounded-br-md'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-1 mt-1 px-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                        {isOwn && (
                          message.read ? (
                            <CheckCheck className="w-3 h-3 text-purple-600" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-400" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <span className="flex-1 text-xs text-red-800 dark:text-red-200">
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* INPUT - FIXED AT BOTTOM */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
        {mediaPreview && (
          <div className="mb-3 relative inline-block">
            <div className="relative">
              <img
                src={mediaPreview}
                alt="Preview"
                className="w-20 h-20 rounded-lg object-cover border-2 border-purple-200 dark:border-purple-800"
              />
              <button
                type="button"
                onClick={removeMedia}
                className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg active:scale-95"
              >
                <X className="w-3 h-3" />
              </button>
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
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="flex-shrink-0 p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors active:scale-95 disabled:opacity-50"
          >
            <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sending}
            maxLength={1000}
            rows={1}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 resize-none overflow-y-auto"
            style={{ maxHeight: '120px' }}
          />

          <button
            type="submit"
            disabled={(!messageText.trim() && !mediaFile) || sending}
            className="flex-shrink-0 p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Enter to send • Shift+Enter for new line
        </p> */}
      </div>
    </div>
  );
}




