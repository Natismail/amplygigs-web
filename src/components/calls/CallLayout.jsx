// src/components/calls/CallLayout.jsx
"use client";

import { useState, useCallback } from "react";
import { RoomAudioRenderer } from "@livekit/components-react";
import CallHeader  from "./ui/CallHeader";
import VideoGrid   from "./ui/VideoGrid";
import Controls    from "./ui/Controls";
import SidePanel   from "./ui/SidePanel";
import VoiceCallUI from "./ui/VoiceCallUI";

export default function CallLayout({ callType, participantName, participantAvatar, onEnd, roomName }) {
  const [showPanel,  setShowPanel]  = useState(false);
  const [panelTab,   setPanelTab]   = useState("participants");
  const [unreadChat, setUnreadChat] = useState(0);

  const handleNewMessage = useCallback(() => {
    if (panelTab !== "chat" || !showPanel) setUnreadChat(c => c + 1);
  }, [panelTab, showPanel]);

  const handleToggleChat = useCallback(() => {
    setUnreadChat(0); setPanelTab("chat"); setShowPanel(true);
  }, []);

  const handleTogglePanel = useCallback(() => {
    if (showPanel && panelTab === "participants") setShowPanel(false);
    else { setPanelTab("participants"); setShowPanel(true); }
  }, [showPanel, panelTab]);

  if (callType === "voice") {
    return (
      <VoiceCallUI
        participantName={participantName}
        participantAvatar={participantAvatar}
        callType={callType}
        onEnd={onEnd}
        roomName={roomName}
      />
    );
  }

  return (
    <div className="flex h-full overflow-hidden relative">
      <RoomAudioRenderer />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <CallHeader callType={callType} participantName={participantName} />
        <div className="flex-1 overflow-hidden bg-gray-950"><VideoGrid /></div>
        <Controls
          onEnd={onEnd} callType={callType}
          onTogglePanel={handleTogglePanel} showPanel={showPanel && panelTab === "participants"}
          onToggleChat={handleToggleChat}   showChat={showPanel && panelTab === "chat"}
          unreadCount={unreadChat} roomName={roomName}
        />
      </div>

      {showPanel && (
        <SidePanel
          onClose={() => setShowPanel(false)}
          callType={callType}
          activeTab={panelTab}
          onTabChange={(tab) => { setPanelTab(tab); if (tab === "chat") setUnreadChat(0); }}
          onNewMessage={handleNewMessage}
        />
      )}
    </div>
  );
}


