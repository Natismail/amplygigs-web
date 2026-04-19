// src/components/calls/IncomingCallListener.jsx
// Now a thin consumer of CallContext — no logic here, just renders modals
// CallContext handles all state and API calls

"use client";

import { useCall } from "@/context/CallContext";
import IncomingCallModal from "./IncomingCallModal";
import CallModal         from "./CallModal";

export default function IncomingCallListener() {
  const {
    incomingCall,
    activeCall,
    joiningCall,
    acceptCall,
    declineCall,
    endCall,
  } = useCall();

  return (
    <>
      {/* Shown when someone calls you */}
      <IncomingCallModal
        call={incomingCall}
        onAccept={acceptCall}
        onDecline={declineCall}
        accepting={joiningCall}
      />

      {/* ✅ Rendered in ROOT LAYOUT — survives navigation */}
      <CallModal
        isOpen={!!activeCall}
        roomName={activeCall?.roomName}
        token={activeCall?.token}
        callType={activeCall?.callType}
        participantName={activeCall?.participantName}
        participantAvatar={activeCall?.participantAvatar}
        onEnd={endCall}
      />
    </>
  );
}


