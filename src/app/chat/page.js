"use client";
import { useState } from "react";

export default function ChatScreen() {
  const [messages, setMessages] = useState([{ from: "DJ Mike", text: "Hey, are we good for Saturday?" }]);
  const [input, setInput] = useState("");

  function sendMessage(e) {
    e.preventDefault();
    setMessages([...messages, { from: "You", text: input }]);
    setInput("");
  }

  return (
    <div className="p-6 flex flex-col h-screen">
      <h1 className="text-2xl font-bold mb-4">Chat</h1>
      <div className="flex-1 overflow-y-auto border rounded p-2 mb-4">
        {messages.map((m, i) => (
          <p key={i}><strong>{m.from}:</strong> {m.text}</p>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="border p-2 flex-1 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
      </form>
    </div>
  );
}
