// src/components/calls/CallModal.jsx
"use client";

import { useCallback } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import CallLayout from "./CallLayout";

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

export default function CallModal({ isOpen, roomName, token, callType = "voice", participantName = "Unknown", participantAvatar, onEnd }) {
  const handleDisconnect = useCallback(() => onEnd?.(), [onEnd]);

  if (!isOpen || !roomName || !token) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col">
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect={true}
        video={false}   // camera starts OFF — user enables via Controls (mobile safe)
        audio={true}
        onDisconnected={handleDisconnect}
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <CallLayout
          callType={callType}
          participantName={participantName}
          participantAvatar={participantAvatar}
          onEnd={onEnd}
          roomName={roomName}
        />
      </LiveKitRoom>
    </div>
  );
}


