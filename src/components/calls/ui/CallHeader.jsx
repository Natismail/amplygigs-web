// src/components/calls/ui/CallHeader.jsx
"use client";

import { useParticipants } from "@livekit/components-react";
import { useEffect, useState } from "react";
import { Phone, Video, Shield, Users } from "lucide-react";

export default function CallHeader({ callType, participantName }) {
  const participants = useParticipants();
  const [seconds,   setSeconds]   = useState(0);
  const [connected, setConnected] = useState(false);

  // Timer — only runs when at least 2 participants are in the room
  useEffect(() => {
    if (participants.length >= 2 && !connected) {
      setConnected(true);
    }
  }, [participants.length, connected]);

  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [connected]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  const callIcon = callType === "audition"
    ? <Shield className="w-4 h-4 text-purple-400" />
    : callType === "video"
    ? <Video className="w-4 h-4 text-blue-400" />
    : <Phone className="w-4 h-4 text-green-400" />;

  const callLabel = callType === "audition" ? "Virtual Audition"
                  : callType === "video"    ? "Video Call"
                  :                           "Voice Call";

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-950/90 backdrop-blur-sm border-b border-white/10 flex-shrink-0">

      {/* Left — call type + participant */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          {callIcon}
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">{participantName}</p>
          <p className="text-white/50 text-xs">{callLabel}</p>
        </div>
      </div>

      {/* Right — status + timer + participant count */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${
            participants.length >= 2
              ? "bg-green-400 animate-pulse"
              : "bg-yellow-400 animate-pulse"
          }`} />
          <span className="text-white/60 text-xs">
            {participants.length >= 2 ? "Connected" : "Waiting..."}
          </span>
        </div>

        {connected && (
          <span className="font-mono text-white/80 text-sm bg-white/10 px-2 py-0.5 rounded-md">
            {mins}:{secs}
          </span>
        )}

        <div className="flex items-center gap-1 text-white/50 text-xs">
          <Users className="w-3.5 h-3.5" />
          <span>{participants.length}</span>
        </div>
      </div>
    </div>
  );
}