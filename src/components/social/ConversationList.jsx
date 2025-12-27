// src/components/social/ConversationList.js - WITH WORKING SEARCH
"use client";

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useSocial } from '@/context/SocialContext';
import { MessageCircle, Search, X } from 'lucide-react';
import Avatar from '@/components/Avatar';

export default function ConversationList({ onSelectConversation }) {
  const { conversations, fetchConversations, loading } = useSocial();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conversation) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const fullName = `${conversation.otherUser?.first_name || ''} ${conversation.otherUser?.last_name || ''}`.toLowerCase();
    const lastMessage = conversation.lastMessage?.content?.toLowerCase() || '';

    return fullName.includes(query) || lastMessage.includes(query);
  });

  const clearSearch = () => {
    setSearchQuery('');
  };

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Results count (when searching) */}
      {searchQuery && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {filteredConversations.length === 0 ? (
              'No conversations found'
            ) : (
              `${filteredConversations.length} conversation${filteredConversations.length === 1 ? '' : 's'} found`
            )}
          </p>
        </div>
      )}

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : 'No conversations yet'
              }
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition border-b border-gray-100 dark:border-gray-800"
            >
              {/* Avatar - Now with initials fallback */}
              <div className="relative flex-shrink-0">
                <Avatar user={conversation.otherUser} size="md" />
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
                    {highlightText(
                      `${conversation.otherUser?.first_name || ''} ${conversation.otherUser?.last_name || ''}`,
                      searchQuery
                    )}
                  </p>
                  {conversation.lastMessage && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
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
          ))
        )}
      </div>
    </div>
  );
}

// Helper function to highlight search text
function highlightText(text, query) {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-white">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
}




