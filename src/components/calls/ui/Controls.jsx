"use client";

import { useRoomContext } from "@livekit/components-react";
import {
  Mic, MicOff, Video, VideoOff, Monitor, PhoneOff
} from "lucide-react";
import { useState } from "react";

export default function Controls({ onEnd }) {
  const room = useRoomContext();

  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [screen, setScreen] = useState(false);

  const toggleMic = async () => {
    await room.localParticipant.setMicrophoneEnabled(!mic);
    setMic(!mic);
  };

  const toggleCam = async () => {
    await room.localParticipant.setCameraEnabled(!cam);
    setCam(!cam);
  };

  const toggleScreen = async () => {
    await room.localParticipant.setScreenShareEnabled(!screen);
    setScreen(!screen);
  };

  return (
    <div className="flex justify-center gap-4 p-4 bg-white/10 backdrop-blur border-t border-white/10">
      
      <button onClick={toggleMic} className="control-btn">
        {mic ? <Mic /> : <MicOff />}
      </button>

      <button onClick={toggleCam} className="control-btn">
        {cam ? <Video /> : <VideoOff />}
      </button>

      <button onClick={toggleScreen} className="control-btn">
        <Monitor />
      </button>

      <button onClick={onEnd} className="control-btn bg-red-500 text-white">
        <PhoneOff />
      </button>
    </div>
  );
}