// src/components/calls/IncomingCallListener.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import IncomingCallModal from "./IncomingCallModal";
import CallModal from "./CallModal";

// ✅ Helper — always gets a fresh token from localStorage session
async function getAuthHeader() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || "";
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type":  "application/json",
  };
}

export default function IncomingCallListener() {
  const { user } = useAuth();

  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall,   setActiveCall]   = useState(null);
  const [joiningCall,  setJoiningCall]  = useState(false);

  // ── Subscribe to incoming call events for this user ───────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();
    const channel  = supabase
      .channel(`incoming-calls:${user.id}`)
      .on("broadcast", { event: "incoming_call" }, ({ payload }) => {
        console.log("📞 Incoming call:", payload);
        setIncomingCall(payload);
      })
      .on("broadcast", { event: "call_ended" }, ({ payload }) => {
        if (activeCall?.roomName === payload.room_name) {
          setActiveCall(null);
        }
      })
      .on("broadcast", { event: "call_declined" }, ({ payload }) => {
        if (activeCall?.roomName === payload.room_name) {
          setActiveCall(null);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, activeCall?.roomName]);

  // ── Accept ────────────────────────────────────────────────────────────────
  const handleAccept = useCallback(async () => {
    if (!incomingCall || joiningCall) return;
    setJoiningCall(true);

    try {
      // ✅ Get fresh Bearer token before the fetch
      const headers = await getAuthHeader();

      const res  = await fetch(`/api/calls/join/${incomingCall.room_name}`, {
        method: "POST",
        headers,
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

  // ── Decline ───────────────────────────────────────────────────────────────
  const handleDecline = useCallback(async () => {
    if (!incomingCall) return;
    const roomName = incomingCall.room_name;
    setIncomingCall(null);

    try {
      // ✅ Bearer token on decline too
      const headers = await getAuthHeader();
      await fetch(`/api/calls/end/${roomName}`, {
        method: "DELETE",
        headers,
      });
    } catch (err) {
      console.warn("Decline error:", err);
    }
  }, [incomingCall]);

  // ── End active call ───────────────────────────────────────────────────────
  const handleEndCall = useCallback(async () => {
    if (!activeCall) return;
    const roomName = activeCall.roomName;
    setActiveCall(null);

    try {
      // ✅ Bearer token on end too
      const headers = await getAuthHeader();
      await fetch(`/api/calls/end/${roomName}`, {
        method: "POST",
        headers,
      });
    } catch (err) {
      console.warn("End call error:", err);
    }
  }, [activeCall]);

  return (
    <>
      <IncomingCallModal
        call={incomingCall}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
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