// src/components/social/ConversationList.js
"use client";

import { useEffect } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { useSocial } from '@/context/SocialContext';
import { MessageCircle, Search } from 'lucide-react';

export default function ConversationList({ onSelectConversation }) {
  const { conversations, fetchConversations, loading } = useSocial();

  useEffect(() => {
    fetchConversations();
  }, []);

  if (loading.conversations) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <MessageCircle className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Messages Yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Start a conversation with musicians or clients
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition border-b border-gray-100 dark:border-gray-800"
          >
            {/* Avatar */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={conversation.otherUser?.profile_picture_url || '/images/default-avatar.png'}
                alt={conversation.otherUser?.first_name || 'User'}
                fill
                className="object-cover"
              />
              {conversation.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                  {conversation.unreadCount}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {conversation.otherUser?.first_name} {conversation.otherUser?.last_name}
                </p>
                {conversation.lastMessage && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true })}
                  </span>
                )}
              </div>
              
              {conversation.lastMessage && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {conversation.lastMessage.content || 'Media message'}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}