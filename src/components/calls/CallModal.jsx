// src/components/calls/CallModal.jsx
// Full-screen call UI using LiveKit React components
// Handles voice, video, and virtual audition modes

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRoomContext,
  useTracks,
  TrackLoop,
  VideoTrack,
  useParticipants,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users,
  Maximize2, Clock, Shield,
} from "lucide-react";

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

// ── Call Timer ────────────────────────────────────────────────────────────────
function CallTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");
  return <span className="font-mono text-sm">{mins}:{secs}</span>;
}

// ── Minimal voice-only UI ─────────────────────────────────────────────────────
function VoiceCallUI({ participantName, onEnd, callType }) {
  const participants = useParticipants();
  const [startTime]  = useState(Date.now());
  const connected    = participants.length > 1;

  return (
    <div className="flex flex-col items-center justify-between h-full py-12 px-6">
      <RoomAudioRenderer />

      {/* Top */}
      <div className="text-center">
        <div className={`w-3 h-3 rounded-full mx-auto mb-3 ${connected ? "bg-green-400 animate-pulse" : "bg-yellow-400 animate-pulse"}`} />
        <p className="text-white/70 text-sm">{connected ? "Connected" : "Calling..."}</p>
      </div>

      {/* Avatar */}
      <div className="text-center">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-2xl ring-4 ring-white/20">
          <span className="text-4xl font-bold text-white">
            {participantName?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{participantName}</h2>
        <div className="flex items-center justify-center gap-2 text-white/60">
          <Clock className="w-4 h-4" />
          {connected ? <CallTimer startTime={Date.now()} /> : <span className="text-sm">Ringing...</span>}
        </div>
        {callType === "audition" && (
          <div className="mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/30 rounded-full border border-purple-400/30">
            <Shield className="w-4 h-4 text-purple-300" />
            <span className="text-purple-200 text-sm font-medium">Virtual Audition Mode</span>
          </div>
        )}
      </div>

      {/* End button */}
      <button
        onClick={onEnd}
        className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-2xl transition active:scale-95"
      >
        <PhoneOff className="w-7 h-7 text-white" />
      </button>
    </div>
  );
}

// ── Inner room component (has access to room context) ─────────────────────────
function CallRoomContent({ callType, participantName, onEnd }) {
  const [startTime]  = useState(Date.now());
  const participants = useParticipants();
  const connected    = participants.length > 1;

  if (callType === "voice") {
    return <VoiceCallUI participantName={participantName} onEnd={onEnd} callType={callType} />;
  }

  // Video / Audition — use LiveKit's built-in VideoConference UI
  return (
    <div className="flex flex-col h-full">
      {/* Custom header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-950/80 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-yellow-400 animate-pulse"}`} />
          <span className="text-white font-medium text-sm">
            {callType === "audition" ? "🎵 Virtual Audition" : "📹 Video Call"} — {participantName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <Users className="w-4 h-4" />
          <span>{participants.length}</span>
          <span className="mx-2">·</span>
          <Clock className="w-4 h-4" />
          {connected ? <CallTimer startTime={startTime} /> : <span>Connecting...</span>}
        </div>
      </div>

      {/* LiveKit VideoConference handles everything */}
      <div className="flex-1 overflow-hidden">
        <VideoConference />
      </div>
    </div>
  );
}

// ── Main CallModal ─────────────────────────────────────────────────────────────
export default function CallModal({
  isOpen,
  roomName,
  token,
  callType    = "voice",
  participantName,
  onEnd,
}) {
  const handleDisconnect = useCallback(() => {
    onEnd?.();
  }, [onEnd]);

  if (!isOpen || !roomName || !token) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col">
      {/* Close / End header bar */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onEnd}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 backdrop-blur rounded-full text-white text-sm font-medium transition"
        >
          <PhoneOff className="w-4 h-4" />
          End Call
        </button>
      </div>

      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect={true}
        video={callType !== "voice"}
        audio={true}
        onDisconnected={handleDisconnect}
        className="flex-1 flex flex-col"
        style={{ height: "100%" }}
      >
        <CallRoomContent
          callType={callType}
          participantName={participantName}
          onEnd={onEnd}
        />
      </LiveKitRoom>
    </div>
  );
}