//src/app/(app)/chat/[conversationId]/page.js

'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';

export default function ChatScreen() {
  const { conversationId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Fetch existing messages
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) console.error('Error fetching messages:', error.message);
      else setMessages(data || []);

      setLoading(false);
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const newMessage = {
      conversation_id: conversationId,
      sender_id: user.id,
      sender_role: user.role.toLowerCase(),
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    // Optimistic UI
    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    const { error } = await supabase.from('messages').insert(newMessage);
    if (error) console.error('Failed to send message:', error);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-gray-500">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-screen p-6">
      <h1 className="text-xl font-semibold mb-4">Chat</h1>

      <div className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender_id === user.id;
            return (
              <div
                key={idx}
                className={`max-w-xs px-4 py-2 rounded-lg break-words ${
                  isMine
                    ? 'ml-auto bg-indigo-600 text-white'
                    : 'mr-auto bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <span className="text-xs opacity-70">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-4 py-2 text-white  dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          disabled={!input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}


