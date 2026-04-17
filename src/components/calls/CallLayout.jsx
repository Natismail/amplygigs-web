// src/components/calls/CallLayout.jsx
"use client";

import { useState } from "react";
import CallHeader  from "./ui/CallHeader";
import VideoGrid   from "./ui/VideoGrid";
import Controls    from "./ui/Controls";
import SidePanel   from "./ui/SidePanel";
import VoiceCallUI from "./ui/VoiceCallUI";

export default function CallLayout({ callType, participantName, onEnd }) {
  const [showPanel, setShowPanel] = useState(false);

  // Voice-only — completely different layout
  if (callType === "voice") {
    return <VoiceCallUI participantName={participantName} callType={callType} onEnd={onEnd} />;
  }

  // Video / Audition
  return (
    <div className="flex h-full overflow-hidden">

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">

        <CallHeader callType={callType} participantName={participantName} />

        {/* Video area */}
        <div className="flex-1 overflow-hidden bg-gray-950">
          <VideoGrid />
        </div>

        <Controls
          onEnd={onEnd}
          callType={callType}
          onTogglePanel={() => setShowPanel(p => !p)}
          showPanel={showPanel}
        />
      </div>

      {/* Side panel — slides in */}
      {showPanel && (
        <SidePanel
          onClose={() => setShowPanel(false)}
          callType={callType}
        />
      )}
    </div>
  );
}