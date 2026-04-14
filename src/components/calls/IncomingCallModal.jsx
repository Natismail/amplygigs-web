// src/components/calls/IncomingCallModal.jsx
// Shown when a Supabase Realtime 'incoming_call' event is received
// Auto-dismisses after 30 seconds (missed call)

"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneOff, Video, Shield } from "lucide-react";

export default function IncomingCallModal({ call, onAccept, onDecline }) {
  const [secondsLeft, setSecondsLeft] = useState(30);

  // Auto-dismiss countdown
  useEffect(() => {
    if (!call) return;
    setSecondsLeft(30);

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline?.("missed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [call, onDecline]);

  if (!call) return null;

  const callIcon = call.call_type === "audition"
    ? <Shield className="w-7 h-7 text-white" />
    : call.call_type === "video"
    ? <Video className="w-7 h-7 text-white" />
    : <Phone className="w-7 h-7 text-white" />;

  const callLabel = call.call_type === "audition"
    ? "Virtual Audition"
    : call.call_type === "video"
    ? "Video Call"
    : "Voice Call";

  const callerName = `${call.initiator?.first_name || ""} ${call.initiator?.last_name || ""}`.trim() || "Someone";

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">

        {/* Animated ring */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-600/20 animate-ping" />
        </div>

        <div className="relative p-8 text-center">

          {/* Call type badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs font-medium mb-6">
            {callIcon}
            <span>Incoming {callLabel}</span>
          </div>

          {/* Caller avatar */}
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-2xl ring-4 ring-purple-500/30">
              <span className="text-4xl font-bold text-white">
                {callerName.charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full ring-4 ring-purple-400/30 animate-ping" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">{callerName}</h2>
          <p className="text-gray-400 text-sm mb-2">is calling you</p>

          {/* Countdown */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-gray-400 text-xs mb-8">
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            Auto-dismiss in {secondsLeft}s
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-6">
            {/* Decline */}
            <button
              onClick={() => onDecline?.("declined")}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center shadow-lg transition active:scale-95 group-hover:shadow-red-500/40 group-hover:shadow-xl">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs text-gray-400">Decline</span>
            </button>

            {/* Accept */}
            <button
              onClick={() => onAccept?.()}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center shadow-lg transition active:scale-95 group-hover:shadow-green-500/40 group-hover:shadow-xl animate-bounce">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs text-gray-400">Accept</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
