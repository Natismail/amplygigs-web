// src/components/calls/IncomingCallModal.jsx
"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneOff, Video, Shield } from "lucide-react";

export default function IncomingCallModal({ call, onAccept, onDecline, accepting }) {
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    if (!call) return;
    setSecondsLeft(30);
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(interval); onDecline?.(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [call, onDecline]);

  if (!call) return null;

  const callLabel = call.call_type === "audition" ? "Virtual Audition"
                  : call.call_type === "video"    ? "Video Call"
                  :                                 "Voice Call";

  const callerName   = `${call.initiator?.first_name || ""} ${call.initiator?.last_name || ""}`.trim() || "Someone";
  const callerAvatar = call.initiator?.avatar;
  const initial      = callerName.charAt(0).toUpperCase();

  const callIcon = call.call_type === "audition" ? <Shield className="w-6 h-6 text-white" />
                 : call.call_type === "video"    ? <Video  className="w-6 h-6 text-white" />
                 :                                 <Phone  className="w-6 h-6 text-white" />;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">

        {/* Animated rings */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-purple-600/10 animate-ping" />
        </div>

        <div className="relative p-8 text-center">
          {/* Call type badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs font-medium mb-6">
            {callIcon}
            <span>Incoming {callLabel}</span>
          </div>

          {/* ✅ Profile picture or initial */}
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto shadow-2xl ring-4 ring-purple-500/30">
              {callerAvatar
                ? <img src={callerAvatar} alt={callerName} className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">{initial}</span>
                  </div>
                )
              }
            </div>
            <div className="absolute inset-0 rounded-full ring-4 ring-purple-400/20 animate-ping" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">{callerName}</h2>
          <p className="text-gray-400 text-sm mb-2">is calling you</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-gray-400 text-xs mb-8">
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            Auto-dismiss in {secondsLeft}s
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-8">
            <button onClick={() => onDecline?.()} className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center shadow-lg transition active:scale-95">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs text-gray-400">Decline</span>
            </button>
            <button onClick={() => onAccept?.()} disabled={accepting} className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center shadow-lg transition active:scale-95 animate-bounce">
                {accepting
                  ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Phone className="w-7 h-7 text-white" />
                }
              </div>
              <span className="text-xs text-gray-400">Accept</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

