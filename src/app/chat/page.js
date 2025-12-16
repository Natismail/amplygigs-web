'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';

export default function ChatScreen() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to realtime messages
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_role: user.role.toLowerCase(),
      content: input.trim(),
    });

    setInput('');
  };

  return (
    <div className="flex flex-col h-full max-h-screen p-6">
      <h1 className="text-xl font-semibold mb-4">Chat</h1>

      <div className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.sender_id === user.id;

          return (
            <div
              key={msg.id}
              className={`max-w-xs px-4 py-2 rounded-lg ${
                isMine
                  ? 'ml-auto bg-indigo-600 text-white'
                  : 'mr-auto bg-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <span className="text-xs opacity-70">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 mt-4">
        <input
          className="flex-1 border rounded-lg px-4 py-2"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg"
        >
          Send
        </button>
      </form>
    </div>
  );
}






// "use client";
// import { useState } from "react";

// export default function ChatScreen() {
//   const [messages, setMessages] = useState([{ from: "DJ Mike", text: "Hey, are we good for Saturday?" }]);
//   const [input, setInput] = useState("");

//   function sendMessage(e) {
//     e.preventDefault();
//     setMessages([...messages, { from: "You", text: input }]);
//     setInput("");
//   }

//   return (
//     <div className="p-6 flex flex-col h-screen">
//       <h1 className="text-2xl font-bold mb-4">Chat</h1>
//       <div className="flex-1 overflow-y-auto border rounded p-2 mb-4">
//         {messages.map((m, i) => (
//           <p key={i}><strong>{m.from}:</strong> {m.text}</p>
//         ))}
//       </div>
//       <form onSubmit={sendMessage} className="flex gap-2">
//         <input
//           className="border p-2 flex-1 rounded"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//         />
//         <button className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
//       </form>
//     </div>
//   );
// }
