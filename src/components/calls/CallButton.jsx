// src/components/calls/CallButton.jsx
// Reads/writes global call state via CallContext
// No local activeCall state — that's why calls survive navigation

"use client";

import { useState, useCallback } from "react";
import { Phone, Video, Shield, Loader2 } from "lucide-react";
import { useCall } from "@/context/CallContext";

export default function CallButton({
  targetUserId,
  targetName,
  targetAvatar,        // ✅ pass profile picture url
  callType    = "voice",
  bookingId   = null,
  variant     = "button",
  className   = "",
  disabled    = false,
}) {
  const { startCall } = useCall();
  const [calling, setCalling] = useState(false);

  const icon  = callType === "audition" ? <Shield className="w-4 h-4" />
              : callType === "video"    ? <Video  className="w-4 h-4" />
              :                          <Phone  className="w-4 h-4" />;

  const label = callType === "audition" ? "Virtual Audition"
              : callType === "video"    ? "Video Call"
              :                          "Voice Call";

  const handleCall = useCallback(async () => {
    if (calling || disabled || !targetUserId) return;
    setCalling(true);
    try {
      await startCall({ targetUserId, targetName, targetAvatar, callType, bookingId });
    } catch (err) {
      console.error("Call error:", err);
      alert("Failed to start call: " + err.message);
    } finally {
      setCalling(false);
    }
  }, [calling, disabled, targetUserId, targetName, targetAvatar, callType, bookingId, startCall]);

  let cls = "";
  if (variant === "icon") {
    cls = `p-2 rounded-full transition active:scale-95 ${
      callType === "audition" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 hover:bg-purple-200"
      : callType === "video"  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200"
      :                         "bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200"
    }`;
  } else if (variant === "full") {
    cls = `w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition active:scale-95 shadow-lg ${
      callType === "audition" ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      : callType === "video"  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      :                         "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
    }`;
  } else {
    cls = `flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition active:scale-95 ${
      callType === "audition" ? "bg-purple-600 hover:bg-purple-700 text-white"
      : callType === "video"  ? "bg-blue-600 hover:bg-blue-700 text-white"
      :                         "bg-green-600 hover:bg-green-700 text-white"
    }`;
  }

  return (
    <button
      onClick={handleCall}
      disabled={calling || disabled}
      title={label}
      className={`${cls} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {variant === "icon"
        ? (calling ? <Loader2 className="w-4 h-4 animate-spin" /> : icon)
        : calling
          ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Calling...</span></>
          : <>{icon}<span>{label}</span></>
      }
    </button>
  );
}



