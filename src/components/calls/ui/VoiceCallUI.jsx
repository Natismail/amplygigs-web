// src/components/calls/ui/VoiceCallUI.jsx
"use client";

import { useParticipants, RoomAudioRenderer } from "@livekit/components-react";
import { useEffect, useState } from "react";
import { Phone, Shield, Clock } from "lucide-react";
import Controls from "./Controls";

export default function VoiceCallUI({ participantName, callType, onEnd }) {
  const participants = useParticipants();
  const connected    = participants.length >= 2;
  const [seconds,    setSeconds]   = useState(0);
  const [timerOn,    setTimerOn]   = useState(false);

  useEffect(() => {
    if (connected && !timerOn) setTimerOn(true);
  }, [connected, timerOn]);

  useEffect(() => {
    if (!timerOn) return;
    const i = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(i);
  }, [timerOn]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  // Speaking participant name (not local)
  const remoteSpeaker = participants.find(p => !p.isLocal && p.isSpeaking);
  const remoteParticipant = participants.find(p => !p.isLocal);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-950">
      <RoomAudioRenderer />

      {/* Status bar */}
      <div className="flex items-center justify-center gap-2 py-3 border-b border-white/10">
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-yellow-400 animate-pulse"}`} />
        <span className="text-white/60 text-xs">
          {connected ? "Connected" : "Calling..."}
        </span>
        {timerOn && (
          <>
            <span className="text-white/20">·</span>
            <span className="text-white/60 text-xs font-mono">{mins}:{secs}</span>
          </>
        )}
      </div>

      {/* Centre — avatar */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">

        {/* Pulse rings when connected */}
        <div className="relative">
          {connected && (
            <>
              <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping scale-150" />
              <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-ping scale-125" style={{ animationDelay: "0.3s" }} />
            </>
          )}
          <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl ring-4 ring-white/10">
            <span className="text-5xl font-bold text-white">
              {(participantName || "?").charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-1">{participantName}</h2>
          <p className="text-white/50 text-sm">
            {remoteSpeaker ? "Speaking..." : connected ? "On the call" : "Ringing..."}
          </p>
          {callType === "audition" && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/20 border border-purple-400/30 rounded-full">
              <Shield className="w-3.5 h-3.5 text-purple-300" />
              <span className="text-purple-200 text-xs font-medium">Virtual Audition</span>
            </div>
          )}
        </div>

        {/* Remote participants list (if more than 1 remote) */}
        {participants.filter(p => !p.isLocal).length > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            {participants.filter(p => !p.isLocal).map(p => (
              <div key={p.identity}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs text-white/70">
                <div className={`w-1.5 h-1.5 rounded-full ${p.isSpeaking ? "bg-green-400" : "bg-white/30"}`} />
                {p.name || p.identity}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls — voice only (no camera button) */}
      <Controls onEnd={onEnd} callType="voice" />
    </div>
  );
}