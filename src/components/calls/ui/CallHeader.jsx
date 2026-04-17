"use client";

import { useParticipants } from "@livekit/components-react";
import { useEffect, useState } from "react";

export default function CallHeader({ callType, participantName }) {
  const participants = useParticipants();
  const [time, setTime] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const mins = String(Math.floor(time / 60)).padStart(2, "0");
  const secs = String(time % 60).padStart(2, "0");

  return (
    <div className="flex justify-between items-center px-4 py-3 bg-black/70 text-white">
      <div>
        <p className="text-sm opacity-70">
          {callType === "audition" ? "🎵 Audition" : "📹 Call"}
        </p>
        <p className="font-semibold">{participantName}</p>
      </div>

      <div className="text-sm">
        {participants.length} users · {mins}:{secs}
      </div>
    </div>
  );
}