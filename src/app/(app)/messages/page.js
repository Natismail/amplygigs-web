// src/app/(app)/messages/page.js - FINAL FIX
"use client";

import { useState } from 'react';
import ConversationList from '@/components/social/ConversationList';
import ChatWindow from '@/components/social/ChatWindow';
import { useSocial } from '@/context/SocialContext';
import PullToRefresh from '@/components/PullToRefresh';

export default function MessagesPage() {
  const { fetchConversations } = useSocial();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowChat(true);
  };

  const handleBack = () => {
    setShowChat(false);
    setSelectedConversation(null);
  };

  const handleRefresh = async () => {
    await fetchConversations();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {/* ⭐ FIX 1: Added "absolute" - was missing! */}
      <div className="absolute inset-0 flex bg-gray-50 dark:bg-gray-950 overflow-hidden">
        
        {/* CONVERSATION LIST */}
        <div 
          className={`${
            showChat ? 'hidden lg:flex' : 'flex'
          } w-full lg:w-96 flex-shrink-0 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-hidden`}
        >
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Messages
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <ConversationList onSelectConversation={handleSelectConversation} />
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div 
          className={`${
            showChat ? 'flex' : 'hidden lg:flex'
          } flex-1 flex-col bg-white dark:bg-gray-900 overflow-hidden`}
        >
          <ChatWindow 
            conversation={selectedConversation} 
            onBack={handleBack} 
          />
        </div>
      </div>
    </PullToRefresh>
  );
}