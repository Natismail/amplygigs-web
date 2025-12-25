// src/components/social/ChatWindow.js - IMPROVED UX
"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Paperclip, X, MoreVertical, Loader2, AlertCircle } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/Avatar';

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

  useEffect(() => {
    if (conversation) {
      fetchMessages(conversation.id);
      
      // Subscribe to realtime messages
      const channel = subscribeToMessages(conversation.id);
      
      return () => {
        channel?.unsubscribe();
      };
    }
  }, [conversation?.id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [messageText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setMediaFile(file);
    setError(null);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    const trimmedText = messageText.trim();
    
    if (!trimmedText && !mediaFile) return;

    setSending(true);
    setError(null);
    
    try {
      console.log('🚀 Sending message from ChatWindow...');
      
      const result = await sendMessage(conversation.id, trimmedText, mediaFile);
      
      if (result.error) {
        console.error('❌ Send failed:', result.error);
        setError(result.error.message || 'Failed to send message');
      } else {
        console.log('✅ Message sent successfully');
        setMessageText('');
        setMediaFile(null);
        setMediaPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      console.error('❌ Exception in handleSend:', err);
      setError('An unexpected error occurred');
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key (send on Enter, new line on Shift+Enter)
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
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <button
          onClick={onBack}
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Avatar user={conversation.otherUser} size="md" />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate">
            {conversation.otherUser?.first_name} {conversation.otherUser?.last_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
            {conversation.otherUser?.role?.toLowerCase() || 'User'}
          </p>
        </div>

        <button 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
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
                  className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  {!isOwn && (
                    <div className="flex-shrink-0 mt-auto">
                      <Avatar user={message.sender || conversation.otherUser} size="sm" />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[75%] sm:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Media */}
                    {message.media_url && (
                      <div className="mb-2 rounded-lg overflow-hidden shadow-md">
                        {message.media_type === 'image' ? (
                          <img
                            src={message.media_url}
                            alt="Message media"
                            className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition"
                            onClick={() => window.open(message.media_url, '_blank')}
                          />
                        ) : (
                          <video
                            src={message.media_url}
                            controls
                            className="max-w-full max-h-64 rounded-lg"
                          />
                        )}
                      </div>
                    )}

                    {/* Text */}
                    {message.content && (
                      <div
                        className={`px-4 py-2 rounded-2xl shadow-sm ${
                          isOwn
                            ? 'bg-purple-600 text-white rounded-br-none'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    )}

                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
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

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {/* Media Preview */}
        {mediaPreview && (
          <div className="mb-3 relative inline-block animate-fade-in">
            <div className="relative">
              <img
                src={mediaPreview}
                alt="Preview"
                className="max-w-32 max-h-32 rounded-lg border-2 border-purple-200 dark:border-purple-800"
              />
              <button
                type="button"
                onClick={removeMedia}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition"
                aria-label="Remove media"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-32">
              {mediaFile?.name}
            </p>
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
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition disabled:opacity-50"
            aria-label="Attach media"
          >
            <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Press Enter to send)"
              disabled={sending}
              rows={1}
              className="w-full px-4 py-2.5 pr-12 bg-gray-100 dark:bg-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none disabled:opacity-50 transition"
              style={{ maxHeight: '120px' }}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {messageText.length > 0 && (
                <span className={messageText.length > 1000 ? 'text-red-500' : ''}>
                  {messageText.length}/1000
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={(!messageText.trim() && !mediaFile) || sending || messageText.length > 1000}
            className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Enter</kbd> to send, 
          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs ml-1">Shift+Enter</kbd> for new line
        </p>
      </form>
    </div>
  );
}