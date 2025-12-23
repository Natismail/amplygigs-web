// src/components/social/ChatWindow.js
"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Send, ArrowLeft, Paperclip, X, MoreVertical } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function ChatWindow({ conversation, onBack }) {
  const { user } = useAuth();
  const { messages, fetchMessages, sendMessage, subscribeToMessages } = useSocial();
  
  const [messageText, setMessageText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMediaFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() && !mediaFile) return;

    setSending(true);
    
    const { error } = await sendMessage(conversation.id, messageText.trim(), mediaFile);
    
    if (!error) {
      setMessageText('');
      setMediaFile(null);
      setMediaPreview(null);
    }
    
    setSending(false);
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        Select a conversation to start messaging
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <button
          onClick={onBack}
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative w-10 h-10 rounded-full overflow-hidden">
          <Image
            src={conversation.otherUser?.profile_picture_url || '/images/default-avatar.png'}
            alt={conversation.otherUser?.first_name || 'User'}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">
            {conversation.otherUser?.first_name} {conversation.otherUser?.last_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {conversation.otherUser?.role?.toLowerCase()}
          </p>
        </div>

        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
        {messages.map((message) => {
          const isOwn = message.sender_id === user?.id;
          
          return (
            <div
              key={message.id}
              className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              {!isOwn && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={message.sender?.profile_picture_url || '/images/default-avatar.png'}
                    alt={message.sender?.first_name || 'User'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {/* Media */}
                {message.media_url && (
                  <div className="mb-2 rounded-lg overflow-hidden">
                    {message.media_type === 'image' ? (
                      <img
                        src={message.media_url}
                        alt="Message media"
                        className="max-w-full max-h-64 rounded-lg"
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
                    className={`px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
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
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {/* Media Preview */}
        {mediaPreview && (
          <div className="mb-3 relative inline-block">
            <img
              src={mediaPreview}
              alt="Preview"
              className="max-w-32 max-h-32 rounded-lg"
            />
            <button
              type="button"
              onClick={removeMedia}
              className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-2">
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
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
            disabled={sending}
          />

          <button
            type="submit"
            disabled={(!messageText.trim() && !mediaFile) || sending}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}