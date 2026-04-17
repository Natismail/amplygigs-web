// src/components/calls/ui/VideoGrid.jsx
"use client";

import {
  useTracks,
  VideoTrack,
  useParticipants,
} from "@livekit/components-react";
import { Track } from "livekit-client";

// ── Avatar fallback when camera is off ───────────────────────────────────────
function ParticipantAvatar({ identity }) {
  const initial = (identity || "?").charAt(0).toUpperCase();
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-gray-900">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
        <span className="text-3xl font-bold text-white">{initial}</span>
      </div>
    </div>
  );
}

// ── Single participant tile ───────────────────────────────────────────────────
function ParticipantTile({ trackRef, isLocal }) {
  const { participant, publication } = trackRef;
  const isCameraEnabled = publication?.isMuted === false && publication?.isSubscribed !== false;
  const isSpeaking      = participant?.isSpeaking;

  return (
    <div className={`relative bg-gray-900 rounded-2xl overflow-hidden aspect-video border-2 transition-colors ${
      isSpeaking ? "border-green-400" : "border-white/10"
    }`}>
      {/* Video or avatar */}
      {isCameraEnabled
        ? <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
        : <ParticipantAvatar identity={participant?.identity} />
      }

      {/* Name tag */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="text-xs text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
          {isLocal ? "You" : (participant?.name || participant?.identity || "Guest")}
        </span>
        {isSpeaking && (
          <span className="flex gap-0.5 items-end h-3">
            {[1, 2, 3].map(i => (
              <span key={i}
                className="w-0.5 bg-green-400 rounded-full animate-pulse"
                style={{ height: `${i * 4}px`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </span>
        )}
      </div>

      {/* Screen share badge */}
      {trackRef.source === Track.Source.ScreenShare && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
          Screen
        </div>
      )}
    </div>
  );
}

// ── Grid layout ───────────────────────────────────────────────────────────────
export default function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera,      withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Fallback: show avatar tiles for all participants when no tracks
  const participants = useParticipants();

  if (tracks.length === 0) {
    return (
      <div className={`grid gap-3 p-4 h-full place-content-center ${
        participants.length <= 1 ? "grid-cols-1" : "grid-cols-2"
      }`}>
        {participants.map(p => (
          <div key={p.identity}
            className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video border border-white/10">
            <ParticipantAvatar identity={p.identity} />
            <div className="absolute bottom-2 left-2">
              <span className="text-xs text-white bg-black/60 px-2 py-0.5 rounded-md">
                {p.name || p.identity || "Guest"}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const colClass = tracks.length === 1 ? "grid-cols-1"
                 : tracks.length === 2 ? "grid-cols-2"
                 : tracks.length <= 4  ? "grid-cols-2"
                 :                       "grid-cols-3";

  return (
    <div className={`grid ${colClass} gap-3 p-4 h-full auto-rows-fr`}>
      {tracks.map(track => (
        <ParticipantTile
          key={`${track.participant.identity}-${track.source}`}
          trackRef={track}
          isLocal={track.participant.isLocal}
        />
      ))}
    </div>
  );
}