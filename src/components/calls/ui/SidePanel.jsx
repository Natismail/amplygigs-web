// src/components/calls/ui/SidePanel.jsx
"use client";

import { useParticipants } from "@livekit/components-react";
import { X, Mic, MicOff, Video, VideoOff, Shield } from "lucide-react";

export default function SidePanel({ onClose, callType }) {
  const participants = useParticipants();

  return (
    <div className="w-64 flex-shrink-0 flex flex-col bg-gray-900 border-l border-white/10">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-white font-semibold text-sm">Participants ({participants.length})</h3>
        <button onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Participant list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {participants.map(p => (
          <div key={p.identity}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition">

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {(p.name || p.identity || "?").charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {p.name || p.identity || "Guest"}
                {p.isLocal && <span className="text-white/40 ml-1">(You)</span>}
              </p>
              {p.isSpeaking && (
                <p className="text-green-400 text-[10px]">Speaking...</p>
              )}
            </div>

            {/* Media status icons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {p.isMicrophoneEnabled
                ? <Mic className="w-3 h-3 text-white/40" />
                : <MicOff className="w-3 h-3 text-red-400" />
              }
              {p.isCameraEnabled
                ? <Video className="w-3 h-3 text-white/40" />
                : <VideoOff className="w-3 h-3 text-red-400" />
              }
            </div>
          </div>
        ))}
      </div>

      {/* Audition mode note */}
      {callType === "audition" && (
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <Shield className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-purple-300 text-xs leading-relaxed">
              Virtual Audition mode — musician's camera and mic are on by default.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

