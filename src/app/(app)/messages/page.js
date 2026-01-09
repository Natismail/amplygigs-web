// src/app/(app)/messages/page.js - MOBILE-SAFE LAYOUT
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
    <div className="h-full flex overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Conversation List */}
      <div className={`${
        showChat ? 'hidden lg:block' : 'block'
      } w-full lg:w-96 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-full overflow-hidden`}>
        <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationList onSelectConversation={handleSelectConversation} />
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${
        showChat ? 'block' : 'hidden lg:block'
      } flex-1 bg-white dark:bg-gray-900 h-full overflow-hidden`}>
        <ChatWindow conversation={selectedConversation} onBack={handleBack} />
      </div>
    </div>
     </PullToRefresh>

  );
}



