"use client";

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useSocial } from '@/context/SocialContext';
import { MessageCircle, Search, X, Loader2, Sparkles } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { AMY_USER_ID } from '@/lib/constants/amy';

//const AMY_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function ConversationList({ onSelectConversation, selectedConversationId }) {
  const { conversations, fetchConversations, loading } = useSocial();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Separate Amy conversation from regular conversations
  const amyConversation = conversations.find(
    conv => conv.otherUser?.id === AMY_USER_ID
  );

  const regularConversations = conversations.filter(
    conv => conv.otherUser?.id !== AMY_USER_ID
  );

  // Filter regular conversations by search
  const filteredConversations = regularConversations.filter((conversation) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const firstName = conversation.otherUser?.first_name?.toLowerCase() || '';
    const lastName = conversation.otherUser?.last_name?.toLowerCase() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const displayName = conversation.otherUser?.display_name?.toLowerCase() || '';
    const lastMessage = conversation.lastMessage?.content?.toLowerCase() || '';

    return (
      fullName.includes(query) ||
      displayName.includes(query) ||
      firstName.includes(query) ||
      lastName.includes(query) ||
      lastMessage.includes(query)
    );
  });

  const clearSearch = () => setSearchQuery('');

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

  const renderConversation = (conversation, isAmy = false) => {
    const isSelected = selectedConversationId === conversation.id;
    const otherUserName = isAmy 
      ? 'Amy - AI Assistant'
      : `${conversation.otherUser?.first_name || ''} ${conversation.otherUser?.last_name || ''}`.trim() ||
        conversation.otherUser?.display_name ||
        'Unknown User';

    return (
      <button
        key={conversation.id}
        onClick={() => onSelectConversation(conversation)}
        className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition border-b border-gray-100 dark:border-gray-800 ${
          isSelected ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-600' : ''
        } ${isAmy ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10' : ''}`}
      >
        {/* Avatar with unread badge or Amy sparkle */}
        <div className="relative flex-shrink-0">
          {isAmy ? (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          ) : (
            <Avatar user={conversation.otherUser} size="md" />
          )}
          
          {conversation.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between mb-1 gap-2">
            <p
              className={`font-semibold truncate ${
                conversation.unreadCount > 0
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300'
              } ${isAmy ? 'text-purple-600 dark:text-purple-400' : ''}`}
            >
              {otherUserName}
              {isAmy && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                  AI
                </span>
              )}
            </p>
            {conversation.lastMessage && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {formatDistanceToNow(new Date(conversation.lastMessage.created_at), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>

          {/* Last message */}
          {conversation.lastMessage ? (
            <p
              className={`text-sm truncate ${
                conversation.unreadCount > 0
                  ? 'text-gray-900 dark:text-white font-medium'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {conversation.lastMessage.content || (
                <span className="flex items-center gap-1 text-gray-500">
                  <MessageCircle className="w-3 h-3" />
                  Media message
                </span>
              )}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">No messages yet</p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results Count */}
      {searchQuery && (
        <div className="flex-shrink-0 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {filteredConversations.length === 0
              ? 'No conversations found'
              : `${filteredConversations.length} conversation${filteredConversations.length === 1 ? '' : 's'} found`}
          </p>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {/* ✅ AMY ALWAYS FIRST (not affected by search) */}
        {amyConversation && !searchQuery && renderConversation(amyConversation, true)}

        {/* Regular Conversations */}
        {filteredConversations.length === 0 && !amyConversation ? (
          <div className="text-center py-12 px-4">
            <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {searchQuery ? `No results for "${searchQuery}"` : 'No conversations yet'}
            </p>
            {searchQuery && (
              <button onClick={clearSearch} className="text-sm text-purple-600 hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            {filteredConversations.map((conversation) => renderConversation(conversation, false))}
            
            {filteredConversations.length === 0 && searchQuery && (
              <div className="text-center py-8 px-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  No results for "{searchQuery}"
                </p>
                <button onClick={clearSearch} className="text-sm text-purple-600 hover:underline">
                  Clear search
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

