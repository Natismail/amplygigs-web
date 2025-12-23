"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatWindow({ gigId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!gigId) return;

    const channel = supabase.channel(`gig-${gigId}-chat`);
    channel.on("broadcast", { event: "new-message" }, (payload) => {
      setMessages((prev) => [...prev, payload.payload]);
    });
    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [gigId]);

  function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = { from: user, text: input, timestamp: Date.now() };

    supabase.channel(`gig-${gigId}-chat`).send({
      type: "broadcast",
      event: "new-message",
      payload: newMsg,
    });

    setMessages([...messages, newMsg]);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto border rounded p-2 mb-2">
        {messages.map((m, i) => (
          <p key={i}>
            <strong>{m.from}:</strong> {m.text}
          </p>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="border p-2 flex-1 rounded text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Send
        </button>
      </form>
    </div>
  );
}
