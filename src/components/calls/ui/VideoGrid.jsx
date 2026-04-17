// src/components/calls/ui/VideoGrid.jsx

"use client";

import { useTracks, VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";

export default function VideoGrid() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-2 h-full">
      {tracks.map((track) => (
        <div
          key={track.publication.trackSid}
          className="relative bg-black rounded-xl overflow-hidden"
        >
          <VideoTrack
            trackRef={track}
            className="w-full h-full object-cover"
          />

          {/* Name overlay */}
          <div className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-1 rounded text-white">
            {track.participant.identity}
          </div>
        </div>
      ))}
    </div>
  );
}