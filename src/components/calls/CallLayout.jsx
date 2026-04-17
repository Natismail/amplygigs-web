"use client";

import VideoGrid from "./ui/VideoGrid";
import Controls from "./ui/Controls";
import CallHeader from "./ui/CallHeader";
import SidePanel from "./ui/SidePanel";
import { useState } from "react";

export default function CallLayout({
  callType,
  participantName,
  onEnd,
}) {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="flex h-full">

      {/* Main */}
      <div className="flex flex-col flex-1">
        <CallHeader
          callType={callType}
          participantName={participantName}
        />

        <div className="flex-1">
          <VideoGrid />
        </div>

        <Controls onEnd={onEnd} />
      </div>

      {/* Optional side panel */}
      {showPanel && <SidePanel />}
    </div>
  );
}