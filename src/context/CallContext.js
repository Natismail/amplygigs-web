// src/context/CallContext.js
// Root-level call state — survives navigation because it lives in layout.js
// CallButton reads from here, CallModal renders from here
// This is why calls don't end when you navigate between pages

"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const { user } = useAuth();

  const [incomingCall, setIncomingCall] = useState(null); // payload from broadcast
  const [activeCall,   setActiveCall]   = useState(null); // { roomName, token, callType, participantName, participantAvatar }
  const [joiningCall,  setJoiningCall]  = useState(false);

  // ── Helper: get fresh Bearer token ────────────────────────────────────────
  async function getHeaders() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${session?.access_token || ""}`,
    };
  }

  // ── Subscribe to incoming call events ─────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();
    const channel  = supabase
      .channel(`incoming-calls:${user.id}`)
      .on("broadcast", { event: "incoming_call" }, ({ payload }) => {
        // Don't show incoming call if already in a call
        if (!activeCall) {
          setIncomingCall(payload);
        }
      })
      .on("broadcast", { event: "call_ended" }, ({ payload }) => {
        // Remote party ended the call — clear everything
        setActiveCall(prev => {
          if (prev?.roomName === payload.room_name) return null;
          return prev;
        });
        setIncomingCall(null);
      })
      .on("broadcast", { event: "call_declined" }, ({ payload }) => {
        // Recipient declined — clear the active call on initiator's side
        setActiveCall(prev => {
          if (prev?.roomName === payload.room_name) return null;
          return prev;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Start a call (called by CallButton) ───────────────────────────────────
  const startCall = useCallback(async ({ targetUserId, targetName, targetAvatar, callType, bookingId }) => {
    const headers = await getHeaders();
    const res     = await fetch("/api/calls/create", {
      method: "POST",
      headers,
      body:   JSON.stringify({ participant_id: targetUserId, call_type: callType, booking_id: bookingId }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    setActiveCall({
      roomName:         data.room_name,
      token:            data.token,
      callType:         data.call_type,
      participantName:  targetName  || `${data.participant?.first_name || ""} ${data.participant?.last_name || ""}`.trim(),
      participantAvatar: targetAvatar || data.participant?.avatar,
    });

    return data;
  }, []);

  // ── Accept incoming call ───────────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall || joiningCall) return;
    setJoiningCall(true);
    try {
      const headers = await getHeaders();
      const res     = await fetch(`/api/calls/join/${incomingCall.room_name}`, {
        method: "POST", headers,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setIncomingCall(null);
      setActiveCall({
        roomName:          incomingCall.room_name,
        token:             data.token,
        callType:          incomingCall.call_type,
        participantName:   `${incomingCall.initiator?.first_name || ""} ${incomingCall.initiator?.last_name || ""}`.trim(),
        participantAvatar: incomingCall.initiator?.avatar,
      });
    } catch (err) {
      console.error("Accept call error:", err);
      alert("Failed to join call: " + err.message);
    } finally {
      setJoiningCall(false);
    }
  }, [incomingCall, joiningCall]);

  // ── Decline incoming call ──────────────────────────────────────────────────
  const declineCall = useCallback(async () => {
    if (!incomingCall) return;
    const roomName = incomingCall.room_name;
    setIncomingCall(null);
    try {
      const headers = await getHeaders();
      await fetch(`/api/calls/end/${roomName}`, { method: "DELETE", headers });
    } catch (err) {
      console.warn("Decline error:", err);
    }
  }, [incomingCall]);

  // ── End active call ────────────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    if (!activeCall) return;
    const roomName = activeCall.roomName;
    setActiveCall(null);
    try {
      const headers = await getHeaders();
      await fetch(`/api/calls/end/${roomName}`, { method: "POST", headers });
    } catch (err) {
      console.warn("End call error:", err);
    }
  }, [activeCall]);

  return (
    <CallContext.Provider value={{
      incomingCall,
      activeCall,
      joiningCall,
      startCall,
      acceptCall,
      declineCall,
      endCall,
    }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used inside <CallProvider>");
  return ctx;
}