// src/app/(app)/messages/page.js
"use client";

import { useState } from 'react';
import ConversationList from '@/components/social/ConversationList';
import ChatWindow from '@/components/social/ChatWindow';

export default function MessagesPage() {
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

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Conversation List - Desktop always visible, Mobile conditionally */}
      <div className={`${
        showChat ? 'hidden lg:block' : 'block'
      } w-full lg:w-96 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
        </div>
        <ConversationList onSelectConversation={handleSelectConversation} />
      </div>

      {/* Chat Window - Desktop always visible, Mobile conditionally */}
      <div className={`${
        showChat ? 'block' : 'hidden lg:block'
      } flex-1 bg-white dark:bg-gray-900`}>
        <ChatWindow conversation={selectedConversation} onBack={handleBack} />
      </div>
    </div>
  );
}