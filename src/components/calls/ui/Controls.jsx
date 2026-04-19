// src/components/calls/ui/Controls.jsx
// FIX: Screen share disabled on mobile (not supported by mobile browsers)
// FIX: Mobile-responsive — wraps gracefully on small screens

"use client";

import { useLocalParticipant } from "@livekit/components-react";
import { useState, useCallback, useEffect } from "react";
import {
  Mic, MicOff, Video, VideoOff,
  Monitor, MonitorOff, PhoneOff,
  Users, MessageSquare, UserPlus,
} from "lucide-react";

function CtrlBtn({ onClick, active, danger, disabled, title, children, badge }) {
  return (
    <div className="relative flex-shrink-0">
      <button onClick={onClick} disabled={disabled} title={title}
        className={`
          w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
          transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed
          ${danger
            ? "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30"
            : active
            ? "bg-white/25 hover:bg-white/35 text-white ring-2 ring-white/40"
            : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
          }
        `}
      >
        {children}
      </button>
      {badge > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center pointer-events-none">
          <span className="text-white text-[9px] font-bold">{badge > 9 ? "9+" : badge}</span>
        </div>
      )}
    </div>
  );
}

export default function Controls({ onEnd, callType, onTogglePanel, showPanel, unreadCount = 0, onToggleChat, showChat, roomName }) {
  const { localParticipant } = useLocalParticipant();
  const [isMobile,   setIsMobile]   = useState(false);
  const [toggling,   setToggling]   = useState({});
  const [screenToast, setScreenToast] = useState(false);

  const micOn    = localParticipant?.isMicrophoneEnabled  ?? true;
  const camOn    = localParticipant?.isCameraEnabled       ?? false;
  const screenOn = localParticipant?.isScreenShareEnabled  ?? false;

  // ✅ Detect mobile — screen share not supported on mobile browsers
  useEffect(() => {
    const ua = navigator.userAgent;
    setIsMobile(/Android|iPhone|iPad|iPod|Mobile/i.test(ua));
  }, []);

  const toggle = useCallback(async (key, fn) => {
    if (toggling[key]) return;
    setToggling(p => ({ ...p, [key]: true }));
    try { await fn(); }
    catch (e) {
      if (!e.message?.includes("Permission denied") && !e.message?.includes("NotAllowed")) {
        console.error(`${key} error:`, e.message);
      }
    }
    finally { setToggling(p => ({ ...p, [key]: false })); }
  }, [toggling]);

  const handleScreenShare = useCallback(async () => {
    if (isMobile) {
      setScreenToast(true);
      setTimeout(() => setScreenToast(false), 3000);
      return;
    }
    toggle("screen", () => localParticipant.setScreenShareEnabled(!screenOn));
  }, [isMobile, toggle, localParticipant, screenOn]);

  const handleInvite = useCallback(() => {
    const link = `${window.location.origin}/call/join/${roomName}`;
    navigator.clipboard.writeText(link).then(() => {
      alert("📋 Invite link copied! Share it to add someone to this call.");
    }).catch(() => {
      prompt("Copy this invite link:", link);
    });
  }, [roomName]);

  return (
    <div className="flex-shrink-0 relative">
      {/* Screen share not supported toast */}
      {screenToast && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2 bg-gray-800 text-white text-xs rounded-xl whitespace-nowrap shadow-xl border border-white/10">
          📱 Screen sharing is not supported on mobile
        </div>
      )}

      <div className="flex items-center justify-center gap-2 sm:gap-3 px-4 py-3 sm:py-4
        bg-gray-950/95 backdrop-blur-sm border-t border-white/10 flex-wrap">

        {/* Mic */}
        <CtrlBtn onClick={() => toggle("mic", () => localParticipant.setMicrophoneEnabled(!micOn))}
          active={micOn} disabled={toggling.mic} title={micOn ? "Mute" : "Unmute"}>
          {micOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />}
        </CtrlBtn>

        {/* Camera — video/audition only */}
        {callType !== "voice" && (
          <CtrlBtn onClick={() => toggle("cam", () => localParticipant.setCameraEnabled(!camOn))}
            active={camOn} disabled={toggling.cam} title={camOn ? "Stop camera" : "Start camera"}>
            {camOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />}
          </CtrlBtn>
        )}

        {/* Screen share — always visible, toast on mobile */}
        <CtrlBtn onClick={handleScreenShare} active={screenOn && !isMobile}
          disabled={toggling.screen} title={isMobile ? "Not available on mobile" : screenOn ? "Stop sharing" : "Share screen"}>
          {screenOn && !isMobile
            ? <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5" />
            : <Monitor className="w-4 h-4 sm:w-5 sm:h-5 opacity-50" style={{ opacity: isMobile ? 0.4 : 1 }} />
          }
        </CtrlBtn>

        <div className="w-px h-7 bg-white/15 mx-0.5 flex-shrink-0" />

        {/* Chat */}
        {onToggleChat && (
          <CtrlBtn onClick={onToggleChat} active={showChat} badge={!showChat ? unreadCount : 0} title="Chat">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </CtrlBtn>
        )}

        {/* Participants */}
        {onTogglePanel && (
          <CtrlBtn onClick={onTogglePanel} active={showPanel} title="Participants">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </CtrlBtn>
        )}

        {/* Invite */}
        <CtrlBtn onClick={handleInvite} title="Copy invite link">
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
        </CtrlBtn>

        <div className="w-px h-7 bg-white/15 mx-0.5 flex-shrink-0" />

        {/* End */}
        <CtrlBtn onClick={onEnd} danger title="End call">
          <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
        </CtrlBtn>
      </div>
    </div>
  );
}


