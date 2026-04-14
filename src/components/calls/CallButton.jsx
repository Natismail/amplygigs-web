// src/components/calls/CallButton.jsx
"use client";

import { useState, useCallback } from "react";
import { Phone, Video, Shield, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CallModal from "./CallModal";

export default function CallButton({
  targetUserId,
  targetName,
  callType    = "voice",
  bookingId   = null,
  variant     = "button",
  className   = "",
  disabled    = false,
}) {
  const [calling,    setCalling]    = useState(false);
  const [activeCall, setActiveCall] = useState(null);

  const icon = callType === "audition"
    ? <Shield className="w-4 h-4" />
    : callType === "video"
    ? <Video className="w-4 h-4" />
    : <Phone className="w-4 h-4" />;

  const label = callType === "audition"
    ? "Virtual Audition"
    : callType === "video"
    ? "Video Call"
    : "Voice Call";

  const handleCall = useCallback(async () => {
    if (calling || disabled || !targetUserId) return;
    setCalling(true);

    try {
      // ✅ Read session from localStorage via browser client
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated — please log in again");
      }

      const res = await fetch("/api/calls/create", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          participant_id: targetUserId,
          call_type:      callType,
          booking_id:     bookingId,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setActiveCall({
        roomName:        data.room_name,
        token:           data.token,
        callType:        data.call_type,
        participantName: targetName ||
          `${data.participant?.first_name || ""} ${data.participant?.last_name || ""}`.trim(),
      });
    } catch (err) {
      console.error("Call error:", err);
      alert("Failed to start call: " + err.message);
    } finally {
      setCalling(false);
    }
  }, [calling, disabled, targetUserId, callType, bookingId, targetName]);

  const handleEndCall = useCallback(async () => {
    if (!activeCall) return;
    const roomName = activeCall.roomName;
    setActiveCall(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`/api/calls/end/${roomName}`, {
        method:  "POST",
        headers: { "Authorization": `Bearer ${session?.access_token || ""}` },
      });
    } catch (err) {
      console.warn("End call error:", err);
    }
  }, [activeCall]);

  const isDisabled = calling || disabled;

  let buttonClass = "";
  if (variant === "icon") {
    buttonClass = `p-2 rounded-full transition active:scale-95 ${
      callType === "audition"
        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 hover:bg-purple-200"
        : callType === "video"
        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200"
        : "bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200"
    }`;
  } else if (variant === "full") {
    buttonClass = `w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition active:scale-95 shadow-lg ${
      callType === "audition"
        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        : callType === "video"
        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
    }`;
  } else {
    buttonClass = `flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition active:scale-95 ${
      callType === "audition"
        ? "bg-purple-600 hover:bg-purple-700 text-white"
        : callType === "video"
        ? "bg-blue-600 hover:bg-blue-700 text-white"
        : "bg-green-600 hover:bg-green-700 text-white"
    }`;
  }

  return (
    <>
      <button
        onClick={handleCall}
        disabled={isDisabled}
        title={label}
        className={`${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {variant === "icon"
          ? (calling ? <Loader2 className="w-4 h-4 animate-spin" /> : icon)
          : calling
            ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Calling...</span></>
            : <>{icon}<span>{label}</span></>
        }
      </button>

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