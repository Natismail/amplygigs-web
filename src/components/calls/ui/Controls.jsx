// src/components/calls/ui/Controls.jsx
"use client";

import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { useState, useCallback } from "react";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, MessageSquare, Users,
} from "lucide-react";

// ── Single control button ────────────────────────────────────────────────────
function CtrlBtn({ onClick, active, danger, disabled, title, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 disabled:opacity-40
        ${danger
          ? "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30"
          : active
          ? "bg-white/20 hover:bg-white/30 text-white ring-2 ring-white/30"
          : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
        }
      `}
    >
      {children}
    </button>
  );
}

// ── Controls bar ─────────────────────────────────────────────────────────────
export default function Controls({ onEnd, onTogglePanel, showPanel, callType }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  // Read actual state from room — never desync
  const micEnabled    = localParticipant?.isMicrophoneEnabled    ?? true;
  const camEnabled    = localParticipant?.isCameraEnabled         ?? true;
  const screenEnabled = localParticipant?.isScreenShareEnabled    ?? false;

  const [toggling, setToggling] = useState({ mic: false, cam: false, screen: false });

  const toggleMic = useCallback(async () => {
    if (toggling.mic) return;
    setToggling(p => ({ ...p, mic: true }));
    try {
      await localParticipant.setMicrophoneEnabled(!micEnabled);
    } catch (e) {
      console.error("Mic toggle error:", e);
    } finally {
      setToggling(p => ({ ...p, mic: false }));
    }
  }, [localParticipant, micEnabled, toggling.mic]);

  const toggleCam = useCallback(async () => {
    if (toggling.cam) return;
    setToggling(p => ({ ...p, cam: true }));
    try {
      await localParticipant.setCameraEnabled(!camEnabled);
    } catch (e) {
      console.error("Camera toggle error:", e);
    } finally {
      setToggling(p => ({ ...p, cam: false }));
    }
  }, [localParticipant, camEnabled, toggling.cam]);

  const toggleScreen = useCallback(async () => {
    if (toggling.screen) return;
    setToggling(p => ({ ...p, screen: true }));
    try {
      await localParticipant.setScreenShareEnabled(!screenEnabled);
    } catch (e) {
      // User denied permission — not a crash
      if (!e.message?.includes("Permission denied")) {
        console.error("Screen share error:", e);
      }
    } finally {
      setToggling(p => ({ ...p, screen: false }));
    }
  }, [localParticipant, screenEnabled, toggling.screen]);

  return (
    <div className="flex-shrink-0 flex items-center justify-center gap-3 px-4 py-4 bg-gray-950/90 backdrop-blur-sm border-t border-white/10">

      {/* Mic */}
      <CtrlBtn onClick={toggleMic} active={micEnabled} disabled={toggling.mic} title={micEnabled ? "Mute" : "Unmute"}>
        {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </CtrlBtn>

      {/* Camera — only for video/audition */}
      {callType !== "voice" && (
        <CtrlBtn onClick={toggleCam} active={camEnabled} disabled={toggling.cam} title={camEnabled ? "Stop camera" : "Start camera"}>
          {camEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </CtrlBtn>
      )}

      {/* Screen share */}
      <CtrlBtn onClick={toggleScreen} active={screenEnabled} disabled={toggling.screen} title={screenEnabled ? "Stop sharing" : "Share screen"}>
        {screenEnabled ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
      </CtrlBtn>

      {/* Participants / side panel toggle */}
      {onTogglePanel && (
        <CtrlBtn onClick={onTogglePanel} active={showPanel} title="Participants">
          <Users className="w-5 h-5" />
        </CtrlBtn>
      )}

      {/* Spacer */}
      <div className="w-px h-8 bg-white/10 mx-1" />

      {/* End call */}
      <CtrlBtn onClick={onEnd} danger title="End call">
        <PhoneOff className="w-5 h-5" />
      </CtrlBtn>
    </div>
  );
}