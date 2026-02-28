// src/components/social/VoiceMessagePlayer.js
//
// WHY PREVIOUS FIXES FAILED:
// The modal approach mounted a NEW audio element after the user gesture.
// iOS WKWebView (used by ALL iOS browsers — Safari, Chrome, Firefox on iOS)
// only allows audio.play() in the EXACT same call stack as a user touch event.
// Mounting a new element then calling play() = different call stack = blocked.
//
// THE CORRECT FIX:
// One single <audio> element, always mounted.
// play() called directly inside onPointerDown, before any setState or re-render.
// The expanded UI overlay appears AFTER play() is already running — just chrome.

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, X, Mic } from "lucide-react";

function formatTime(s) {
  if (!s || isNaN(s) || !isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function Waveform({ count = 24, progress = 0, light = false }) {
  const bars = useRef(
    Array.from({ length: count }, (_, i) => 30 + Math.abs(Math.sin(i * 1.7 + 0.5) * 60))
  ).current;

  return (
    <div className="flex items-center gap-[2px] flex-1 h-7">
      {bars.map((h, i) => {
        const filled = (i / count) * 100 <= progress;
        return (
          <div
            key={i}
            style={{ height: `${h}%` }}
            className={`rounded-full flex-1 transition-colors duration-75 ${
              filled
                ? light ? "bg-white" : "bg-purple-500"
                : light ? "bg-white/30" : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        );
      })}
    </div>
  );
}

export default function VoiceMessagePlayer({ audioUrl, isOwn, isFromAmy }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const light = isOwn || isFromAmy;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    setIsMobile(
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      ("ontouchstart" in window && window.innerWidth < 900)
    );
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onMeta = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
      setLoading(false);
    };
    const onCanPlay = () => {
      setLoading(false);
      if (isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onError = () => { setError(true); setLoading(false); };

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    audio.load(); // force buffer on iOS

    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [audioUrl]);

  // Called synchronously inside onPointerDown — preserves iOS gesture context
  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || error) return;
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => setIsPlaying(true)).catch((err) => {
        console.warn("audio.play() blocked:", err.name);
        if (err.name === "NotSupportedError") setError(true);
      });
    } else {
      setIsPlaying(true);
    }
  }, [error]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  // Entire toggle in one synchronous handler — no async before play()
  const handleToggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play(); // ← must be first, before any setState
      if (isMobile) setShowExpanded(true); // show overlay after play started
    }
  }, [isPlaying, play, pause, isMobile]);

  const handleSeek = useCallback((clientX, containerEl) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = containerEl.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  }, [duration]);

  const bgClass = isFromAmy
    ? "bg-gradient-to-r from-purple-500 to-pink-500"
    : isOwn
    ? "bg-purple-600"
    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700";

  const iconColor = light ? "text-white" : "text-purple-600 dark:text-purple-400";

  return (
    <>
      {/* Single audio element — never unmounts or changes */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        playsInline
        // eslint-disable-next-line react/no-unknown-property
        webkit-playsinline="true"
        style={{ display: "none" }}
      />

      {/* Compact bubble */}
      <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl min-w-[200px] max-w-[260px] ${bgClass}`}>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            handleToggle();
          }}
          disabled={error}
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform
            ${light
              ? "bg-white/20 active:bg-white/30"
              : "bg-purple-100 dark:bg-purple-900/30"
            } ${error ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <div className={`w-4 h-4 rounded-full border-2 border-t-transparent animate-spin ${light ? "border-white" : "border-purple-500"}`} />
          ) : isPlaying ? (
            <Pause className={`w-4 h-4 ${iconColor}`} fill="currentColor" />
          ) : (
            <Play className={`w-4 h-4 ml-0.5 ${iconColor}`} fill="currentColor" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <Waveform count={20} progress={progress} light={light} />
          <div className={`flex justify-between text-[10px] ${light ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
            <span>{formatTime(currentTime)}</span>
            <span>{error ? "Can't play" : formatTime(duration)}</span>
          </div>
        </div>

        <Mic className={`w-3.5 h-3.5 flex-shrink-0 ${light ? "text-white/60" : "text-gray-400"}`} />
      </div>

      {/* Mobile expanded overlay — appears AFTER audio.play() is already running */}
      {isMobile && showExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              pause();
              setShowExpanded(false);
            }
          }}
        >
          <div
            className={`w-full max-w-lg rounded-t-3xl px-6 pt-4 pb-14 shadow-2xl
              bg-gradient-to-br ${isFromAmy ? "from-purple-600 to-pink-500" : isOwn ? "from-purple-700 to-purple-500" : "from-gray-800 to-gray-900"}`}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Voice Message</p>
                  <p className="text-white/60 text-xs">{isFromAmy ? "from Amy" : isOwn ? "Sent by you" : "Received"}</p>
                </div>
              </div>
              <button
                onPointerDown={() => { pause(); setShowExpanded(false); }}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="mb-3">
              <Waveform count={32} progress={progress} light />
            </div>

            {/* Seek bar with touch support */}
            <div
              className="h-2 rounded-full bg-white/20 mb-3 cursor-pointer"
              style={{ touchAction: "none" }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                handleSeek(e.clientX, e.currentTarget);
              }}
              onPointerMove={(e) => {
                if (e.buttons > 0) handleSeek(e.clientX, e.currentTarget);
              }}
            >
              <div
                className="h-full rounded-full bg-white pointer-events-none"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between text-white/60 text-xs mb-8">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Big play/pause — controls same audio element */}
            <div className="flex justify-center">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleToggle();
                }}
                style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-9 h-9 text-purple-700" fill="currentColor" />
                ) : (
                  <Play className="w-9 h-9 text-purple-700 ml-1" fill="currentColor" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}