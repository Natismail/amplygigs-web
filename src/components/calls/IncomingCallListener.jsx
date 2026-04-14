// src/components/calls/IncomingCallListener.jsx
// Add this ONCE to your root layout — it listens for incoming calls
// and shows IncomingCallModal + handles accept/decline globally

"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import IncomingCallModal from "./IncomingCallModal";
import CallModal from "./CallModal";

export default function IncomingCallListener() {
  const { user } = useAuth();

  const [incomingCall, setIncomingCall]   = useState(null);  // call payload from Realtime
  const [activeCall,   setActiveCall]     = useState(null);  // { roomName, token, callType, participantName }
  const [joiningCall,  setJoiningCall]    = useState(false);

  // ── Subscribe to incoming calls for this user ─────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`incoming-calls:${user.id}`)
      .on("broadcast", { event: "incoming_call" }, ({ payload }) => {
        console.log("📞 Incoming call:", payload);
        setIncomingCall(payload);
      })
      .on("broadcast", { event: "call_ended" }, ({ payload }) => {
        // Other party ended the call while we're in it
        if (activeCall?.roomName === payload.room_name) {
          setActiveCall(null);
        }
      })
      .on("broadcast", { event: "call_declined" }, ({ payload }) => {
        // Recipient declined our outgoing call
        if (activeCall?.roomName === payload.room_name) {
          setActiveCall(null);
          // Small notification could go here
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeCall?.roomName]);

  // ── Accept incoming call ─────────────────────────────────────────────────
  const handleAccept = useCallback(async () => {
    if (!incomingCall || joiningCall) return;
    setJoiningCall(true);

    try {
      const res = await fetch(`/api/calls/join/${incomingCall.room_name}`, {
        method: "POST",
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setIncomingCall(null);
      setActiveCall({
        roomName:        incomingCall.room_name,
        token:           data.token,
        callType:        incomingCall.call_type,
        participantName: `${incomingCall.initiator?.first_name || ""} ${incomingCall.initiator?.last_name || ""}`.trim(),
      });
    } catch (err) {
      console.error("Failed to join call:", err);
      alert("Failed to join call: " + err.message);
    } finally {
      setJoiningCall(false);
    }
  }, [incomingCall, joiningCall]);

  // ── Decline incoming call ────────────────────────────────────────────────
  const handleDecline = useCallback(async (reason = "declined") => {
    if (!incomingCall) return;
    setIncomingCall(null);

    try {
      await fetch(`/api/calls/end/${incomingCall.room_name}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Decline error:", err);
    }
  }, [incomingCall]);

  // ── End active call ──────────────────────────────────────────────────────
  const handleEndCall = useCallback(async () => {
    if (!activeCall) return;
    const roomName = activeCall.roomName;
    setActiveCall(null);

    try {
      await fetch(`/api/calls/end/${roomName}`, { method: "POST" });
    } catch (err) {
      console.warn("End call error:", err);
    }
  }, [activeCall]);

  return (
    <>
      {/* Incoming call modal — shown when someone calls you */}
      <IncomingCallModal
        call={incomingCall}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      {/* Active call UI — shown when in a call */}
      <CallModal
        isOpen={!!activeCall}
        roomName={activeCall?.roomName}
        token={activeCall?.token}
        callType={activeCall?.callType}
        participantName={activeCall?.participantName}
        onEnd={handleEndCall}
      />
    </>
  );
}
