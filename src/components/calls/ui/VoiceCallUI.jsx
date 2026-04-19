// src/components/calls/ui/VoiceCallUI.jsx
"use client";

import { useParticipants, RoomAudioRenderer } from "@livekit/components-react";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import Controls from "./Controls";

function SpeakingWave() {
  return (
    <div className="flex gap-1 items-end h-5">
      {[3, 6, 9, 6, 3].map((h, i) => (
        <div key={i} className="w-1 bg-green-400 rounded-full animate-pulse"
          style={{ height: `${h * 2}px`, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

export default function VoiceCallUI({ participantName, participantAvatar, callType, onEnd, roomName }) {
  const participants = useParticipants();
  const connected    = participants.length >= 2;
  const [seconds, setSeconds] = useState(0);
  const [timerOn, setTimerOn] = useState(false);

  useEffect(() => { if (connected && !timerOn) setTimerOn(true); }, [connected, timerOn]);
  useEffect(() => {
    if (!timerOn) return;
    const i = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(i);
  }, [timerOn]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const remoteSpeaking = participants.some(p => !p.isLocal && p.isSpeaking);
  const initial        = (participantName || "?").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-950">
      <RoomAudioRenderer />

      {/* Status bar */}
      <div className="flex items-center justify-center gap-2 py-3 border-b border-white/10 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-yellow-400 animate-pulse"}`} />
        <span className="text-white/60 text-xs">{connected ? "Connected" : "Ringing..."}</span>
        {timerOn && (
          <>
            <span className="text-white/20 mx-1">·</span>
            <span className="font-mono text-white/60 text-xs bg-white/10 px-2 py-0.5 rounded-md">{mins}:{secs}</span>
          </>
        )}
      </div>

      {/* Centre */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        <div className="relative">
          {connected && (
            <>
              <div className="absolute inset-0 rounded-full bg-purple-500/15 animate-ping"
                style={{ transform: "scale(1.6)", animationDuration: "2s" }} />
              <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-ping"
                style={{ transform: "scale(1.3)", animationDuration: "2s", animationDelay: "0.4s" }} />
            </>
          )}
          {/* ✅ Profile picture or initial */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/10">
            {participantAvatar
              ? <img src={participantAvatar} alt={participantName} className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">{initial}</span>
                </div>
              )
            }
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-1">{participantName}</h2>
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
            {remoteSpeaking
              ? <><SpeakingWave /><span className="ml-2">Speaking</span></>
              : <span>{connected ? "On the call" : "Calling..."}</span>
            }
          </div>
          {callType === "audition" && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/20 border border-purple-400/30 rounded-full">
              <Shield className="w-3.5 h-3.5 text-purple-300" />
              <span className="text-purple-200 text-xs font-medium">Virtual Audition</span>
            </div>
          )}
        </div>
      </div>

      <Controls onEnd={onEnd} callType="voice" roomName={roomName} />
    </div>
  );
}

