// src/components/calls/ui/VideoGrid.jsx
// FIX: onlySubscribed removed — now includes LOCAL camera track
// This is why "you" weren't showing in the grid before

"use client";

import { useTracks, VideoTrack, useParticipants } from "@livekit/components-react";
import { Track } from "livekit-client";

function Avatar({ name, avatar }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-gray-900">
      {avatar
        ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
        : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
            <span className="text-3xl font-bold text-white">{initial}</span>
          </div>
        )
      }
    </div>
  );
}

function SpeakingBars() {
  return (
    <span className="flex gap-0.5 items-end h-3 ml-1.5">
      {[4, 7, 5].map((h, i) => (
        <span key={i} className="w-0.5 bg-green-400 rounded-full animate-pulse"
          style={{ height: `${h * 2}px`, animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

function Tile({ trackRef, isLocal }) {
  const pub        = trackRef?.publication;
  const participant = trackRef?.participant;
  // ✅ track is live when it has a track object and isn't muted
  const hasVideo   = pub?.track && !pub?.isMuted;
  const isSpeaking = participant?.isSpeaking;
  const isScreen   = trackRef?.source === Track.Source.ScreenShare;
  const name       = isLocal
    ? "You"
    : (participant?.name || participant?.identity || "Guest");
  const avatar     = participant?.metadata
    ? (() => { try { return JSON.parse(participant.metadata)?.avatar; } catch { return null; } })()
    : null;

  return (
    <div className={`relative bg-gray-900 rounded-2xl overflow-hidden aspect-video border-2 transition-colors ${
      isSpeaking ? "border-green-400 shadow-lg shadow-green-400/20" : "border-white/10"
    }`}>
      {hasVideo
        ? <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
        : <Avatar name={name} avatar={avatar} />
      }

      {/* Name */}
      <div className="absolute bottom-2 left-2 flex items-center">
        <span className="text-xs text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">{name}</span>
        {isSpeaking && <SpeakingBars />}
      </div>

      {/* Badges */}
      {isLocal && (
        <div className="absolute top-2 left-2 bg-purple-600/80 text-white text-xs px-2 py-0.5 rounded-full">You</div>
      )}
      {isScreen && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">Screen</div>
      )}
    </div>
  );
}

export default function VideoGrid() {
  // ✅ No onlySubscribed filter — includes local participant's own tracks
  const tracks = useTracks([
    { source: Track.Source.Camera,      withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const participants = useParticipants();

  if (!tracks || tracks.length === 0) {
    return (
      <div className={`grid gap-3 p-4 h-full content-center ${
        participants.length <= 1 ? "grid-cols-1 max-w-sm mx-auto w-full" : "grid-cols-2"
      }`}>
        {participants.map(p => (
          <div key={p.identity}
            className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video border border-white/10">
            <Avatar name={p.isLocal ? "You" : (p.name || p.identity)} />
            <div className="absolute bottom-2 left-2 flex items-center">
              <span className="text-xs text-white bg-black/60 px-2 py-0.5 rounded-md">
                {p.isLocal ? "You" : (p.name || p.identity || "Guest")}
              </span>
              {p.isSpeaking && <SpeakingBars />}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cols = tracks.length === 1 ? "grid-cols-1 max-w-2xl mx-auto w-full"
             : tracks.length === 2 ? "grid-cols-2"
             : tracks.length <= 4  ? "grid-cols-2"
             :                       "grid-cols-3";

  return (
    <div className={`grid ${cols} gap-3 p-4 h-full auto-rows-fr`}>
      {tracks.map(t => (
        <Tile
          key={`${t.participant?.identity}-${t.source}`}
          trackRef={t}
          isLocal={t.participant?.isLocal}
        />
      ))}
    </div>
  );
}

