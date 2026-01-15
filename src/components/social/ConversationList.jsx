// src/components/social/ConversationList.js - FIXED VERSION
"use client";

import { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useSocial } from '@/context/SocialContext';
import { MessageCircle, Search, X, Loader2 } from 'lucide-react';
import Avatar from '@/components/Avatar';

export default function ConversationList({ onSelectConversation }) {
  const { conversations, fetchConversations, loading } = useSocial();
  const [searchQuery, setSearchQuery] = useState('');

  // ⭐ FIX: Memoize fetchConversations to prevent infinite loops
  useEffect(() => {
    fetchConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // ⭐ IMPROVEMENT: Memoize filtered conversations
  const filteredConversations = useCallback(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conversation) => {
      const fullName = `${conversation.otherUser?.first_name || ''} ${conversation.otherUser?.last_name || ''}`.toLowerCase();
      const lastMessage = conversation.lastMessage?.content?.toLowerCase() || '';

      return fullName.includes(query) || lastMessage.includes(query);
    });
  }, [conversations, searchQuery])();

  const clearSearch = () => {
    setSearchQuery('');
  };

  // ⭐ IMPROVEMENT: Better loading state
  if (loading.conversations) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loading conversations...
        </p>
      </div>
    );
  }

  // ⭐ IMPROVEMENT: Empty state
  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
          <MessageCircle className="w-10 h-10 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Messages Yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Start a conversation with musicians or clients
        </p>
        <button
          onClick={() => fetchConversations()}
          className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* ========== SEARCH BAR ========== */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition active:scale-95"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* ========== SEARCH RESULTS COUNT ========== */}
      {searchQuery && (
        <div className="flex-shrink-0 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {filteredConversations.length === 0 ? (
              'No conversations found'
            ) : (
              `${filteredConversations.length} conversation${filteredConversations.length === 1 ? '' : 's'} found`
            )}
          </p>
        </div>
      )}

      {/* ========== CONVERSATIONS LIST ========== */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {filteredConversations.length === 0 ? (
          // No search results
          <div className="text-center py-12 px-4">
            <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : 'No conversations yet'
              }
            </p>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          // Conversation items
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition border-b border-gray-100 dark:border-gray-800"
            >
              {/* Avatar with unread badge */}
              <div className="relative flex-shrink-0">
                <Avatar user={conversation.otherUser} size="md" />
                {conversation.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                {/* Name and time */}
                <div className="flex items-center justify-between mb-1 gap-2">
                  <p className={`font-semibold truncate ${
                    conversation.unreadCount > 0 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {highlightText(
                      `${conversation.otherUser?.first_name || ''} ${conversation.otherUser?.last_name || ''}`.trim() || 'Unknown User',
                      searchQuery
                    )}
                  </p>
                  {conversation.lastMessage && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { 
                        addSuffix: true 
                      })}
                    </span>
                  )}
                </div>
                
                {/* Last message */}
                {conversation.lastMessage && (
                  <p className={`text-sm truncate ${
                    conversation.unreadCount > 0
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {conversation.lastMessage.content || (
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        Media message
                      </span>
                    )}
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

// ⭐ Helper function to highlight search text
function highlightText(text, query) {
  if (!query.trim()) return text;

  try {
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    
    return (
      <span>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark 
              key={index} 
              className="bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-white px-0.5 rounded"
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  } catch (error) {
    // Fallback if regex fails
    return text;
  }
}



