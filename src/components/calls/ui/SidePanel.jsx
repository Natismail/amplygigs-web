// src/components/calls/ui/SidePanel.jsx
// FIX: On mobile renders as bottom sheet overlay (not beside the video)
//      On desktop renders as side column (w-64)

"use client";

import { useParticipants, useDataChannel } from "@livekit/components-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Mic, MicOff, Video, VideoOff, Shield, Send, Users, MessageSquare } from "lucide-react";

// ── In-call chat ──────────────────────────────────────────────────────────────
function InCallChat({ onNewMessage }) {
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const bottomRef               = useRef(null);
  const encoder                 = useRef(new TextEncoder());
  const decoder                 = useRef(new TextDecoder());

  const { send } = useDataChannel("chat", (msg) => {
    try {
      const decoded = decoder.current.decode(msg.payload);
      const parsed  = JSON.parse(decoded);
      setMessages(prev => [...prev, { ...parsed, own: false }]);
      onNewMessage?.();
    } catch (e) { console.warn("Chat decode:", e); }
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    const payload = { text: text.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    try {
      send(encoder.current.encode(JSON.stringify(payload)), { reliable: true });
      setMessages(prev => [...prev, { ...payload, own: true }]);
      setText("");
    } catch (e) { console.error("Chat send:", e); }
  }, [text, send]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-6 text-white/30 text-sm">No messages yet. Say hi! 👋</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.own ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
              m.own ? "bg-purple-600 text-white rounded-br-sm" : "bg-white/10 text-white/90 rounded-bl-sm"
            }`}>
              <p className="break-words">{m.text}</p>
              <p className={`text-[10px] mt-1 ${m.own ? "text-purple-200" : "text-white/40"}`}>{m.time}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 p-3 border-t border-white/10 flex-shrink-0">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Message..." maxLength={500}
          className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        <button onClick={handleSend} disabled={!text.trim()}
          className="w-9 h-9 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition active:scale-95 flex-shrink-0">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Participant list ───────────────────────────────────────────────────────────
function ParticipantList({ callType }) {
  const participants = useParticipants();
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {participants.map(p => (
        <div key={p.identity} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {(p.name || p.identity || "?").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {p.isLocal ? "You" : (p.name || p.identity || "Guest")}
              {p.isLocal && <span className="text-white/40 ml-1 font-normal">(You)</span>}
            </p>
            {p.isSpeaking && <p className="text-green-400 text-[10px]">Speaking...</p>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {p.isMicrophoneEnabled ? <Mic className="w-3 h-3 text-white/40" /> : <MicOff className="w-3 h-3 text-red-400" />}
            {p.isCameraEnabled     ? <Video className="w-3 h-3 text-white/40" /> : <VideoOff className="w-3 h-3 text-red-400" />}
          </div>
        </div>
      ))}
      {callType === "audition" && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <Shield className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-purple-300 text-xs leading-relaxed">Virtual Audition mode.</p>
        </div>
      )}
    </div>
  );
}

// ── Main SidePanel ────────────────────────────────────────────────────────────
export default function SidePanel({ onClose, callType, activeTab = "participants", onTabChange, onNewMessage }) {
  const participants = useParticipants();

  const inner = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex gap-1">
          {[
            { id: "participants", icon: <Users className="w-3.5 h-3.5" />, label: `${participants.length}` },
            { id: "chat",         icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Chat" },
          ].map(tab => (
            <button key={tab.id} onClick={() => onTabChange?.(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === tab.id ? "bg-white/15 text-white" : "text-white/50 hover:text-white hover:bg-white/10"
              }`}>
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg transition text-white/50 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {activeTab === "participants"
          ? <ParticipantList callType={callType} />
          : <InCallChat onNewMessage={onNewMessage} />
        }
      </div>
    </>
  );

  // ✅ Mobile: full-width bottom sheet overlay
  // ✅ Desktop: side column
  return (
    <>
      {/* Mobile — bottom sheet */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 h-[60vh] bg-gray-900 rounded-t-2xl border-t border-white/10 flex flex-col shadow-2xl">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
        {inner}
      </div>

      {/* Desktop — side column */}
      <div className="hidden sm:flex w-64 flex-shrink-0 flex-col bg-gray-900 border-l border-white/10">
        {inner}
      </div>
    </>
  );
}

