// src/components/social/VoiceMessagePlayer.js
// Fixes:
// 1. iOS Safari blocks audio.play() unless called synchronously from a touch event
// 2. preload="metadata" silently fails on iOS — use preload="auto" with fallback
// 3. On small screens, the inline player is too cramped — replaced with a tap-to-open modal
// 4. Android Chrome: AudioContext requires user gesture — handled via direct event binding
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, X, Volume2, Mic } from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Waveform bars (decorative, static) ────────────────────────────────────
function WaveformBars({ count = 20, progress = 0, light = false }) {
  const heights = useRef(
    Array.from({ length: count }, () => 30 + Math.random() * 70)
  ).current;

  return (
    <div className="flex items-center gap-[2px] h-8 flex-1">
      {heights.map((h, i) => {
        const pct = (i / count) * 100;
        const filled = pct <= progress;
        return (
          <div
            key={i}
            className={`rounded-full flex-1 transition-colors duration-100 ${
              filled
                ? light
                  ? "bg-white"
                  : "bg-purple-500 dark:bg-purple-400"
                : light
                ? "bg-white/30"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
            style={{ height: `${h}%` }}
          />
        );
      })}
    </div>
  );
}

// ── Mobile Audio Player Modal ─────────────────────────────────────────────
// Rendered into a portal-like fixed overlay so it's always full-screen
// and the play button tap is a direct synchronous user gesture → audio.play()
function AudioModal({ audioUrl, isOwn, isFromAmy, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
    };
    const onCanPlay = () => {
      setLoading(false);
      // duration might now be available even if onMetadata didn't fire
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onError = () => {
      setLoadError(true);
      setLoading(false);
    };

    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    // Force load — some mobile browsers defer loading until explicitly told
    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
    };
  }, []);

  // ── CRITICAL FIX: synchronous play on the same tick as the touch event ──
  // Do NOT put audio.play() inside setState callbacks or useEffect.
  // It must be called directly inside the event handler.
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || loading) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Call play() synchronously — this preserves the user gesture context on iOS
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn("Audio play blocked:", err);
            // Retry once — sometimes the first attempt fails on cold load
            setTimeout(() => {
              audio.play()
                .then(() => setIsPlaying(true))
                .catch(() => setLoadError(true));
            }, 100);
          });
      } else {
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const bgGradient = isFromAmy
    ? "from-purple-600 via-pink-500 to-rose-500"
    : isOwn
    ? "from-purple-700 to-purple-500"
    : "from-gray-800 to-gray-700";

  return (
    // Backdrop — tap outside to close
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal sheet */}
      <div
        className={`w-full max-w-lg rounded-t-3xl bg-gradient-to-br ${bgGradient} px-6 pt-5 pb-10 shadow-2xl`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Voice Message</p>
              <p className="text-white/60 text-xs">
                {isFromAmy ? "Amy" : isOwn ? "You" : ""}
              </p>
            </div>
          </div>
          <button
            onPointerDown={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Waveform */}
        <div className="mb-4">
          <WaveformBars count={30} progress={progress} light />
        </div>

        {/* Seek bar */}
        <div
          className="h-1.5 rounded-full bg-white/20 mb-3 cursor-pointer active:h-2 transition-all"
          onPointerDown={handleSeek}
          onTouchStart={handleSeek}
        >
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time */}
        <div className="flex justify-between text-white/70 text-xs mb-6">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Play button — large, unmissable on mobile */}
        <div className="flex justify-center">
          {loadError ? (
            <p className="text-white/60 text-sm text-center py-4">
              Unable to play this audio. The file may not be supported.
            </p>
          ) : (
            <button
              onPointerDown={handlePlayPause}
              disabled={loading}
              className={`w-20 h-20 rounded-full flex items-center justify-center
                bg-white shadow-2xl active:scale-95 transition-transform
                ${loading ? "opacity-50" : "opacity-100"}`}
            >
              {loading ? (
                <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-9 h-9 text-purple-700" fill="currentColor" />
              ) : (
                <Play className="w-9 h-9 text-purple-700 ml-1" fill="currentColor" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Hidden audio — preload=auto forces mobile browsers to buffer */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        playsInline           // required on iOS to prevent fullscreen takeover
        webkit-playsinline="true"  // older iOS
      />
    </div>
  );
}

// ── Inline player (desktop / tablet) ─────────────────────────────────────
function InlinePlayer({ audioUrl, isOwn, isFromAmy }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onMeta = () => setDuration(audio.duration);
    const onCanPlay = () => {
      if (audio.duration && isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => { setIsPlaying(false); setCurrentTime(0); };
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.load();
    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.pause();
    };
  }, []);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const p = audio.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch(() => {});
      } else {
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const light = isOwn || isFromAmy;

  const colors = light
    ? { btn: "bg-white/20 hover:bg-white/30", icon: "text-white", track: "bg-white/20", fill: "bg-white", time: "text-white/80" }
    : { btn: "bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200", icon: "text-purple-600 dark:text-purple-400", track: "bg-gray-200 dark:bg-gray-700", fill: "bg-purple-600 dark:bg-purple-400", time: "text-gray-600 dark:text-gray-400" };

  return (
    <div className={`px-3 py-2.5 rounded-2xl min-w-[220px] max-w-[260px] ${
      isFromAmy
        ? "bg-gradient-to-r from-purple-500 to-pink-500"
        : isOwn
        ? "bg-purple-600"
        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    }`}>
      <audio ref={audioRef} src={audioUrl} preload="auto" playsInline />

      <div className="flex items-center gap-2 mb-2">
        <Volume2 className={`w-3.5 h-3.5 ${colors.icon}`} />
        <span className={`text-xs font-medium ${colors.time}`}>Voice Message</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePlayPause}
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition ${colors.btn}`}
        >
          {isPlaying
            ? <Pause className={`w-4 h-4 ${colors.icon}`} fill="currentColor" />
            : <Play className={`w-4 h-4 ${colors.icon} ml-0.5`} fill="currentColor" />
          }
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <WaveformBars count={20} progress={progress} light={light} />
          <div
            onClick={handleSeek}
            className={`h-1 rounded-full ${colors.track} cursor-pointer`}
          >
            <div className={`h-full rounded-full ${colors.fill} transition-all`} style={{ width: `${progress}%` }} />
          </div>
          <div className={`flex justify-between text-[10px] ${colors.time}`}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export: renders inline on desktop, tap-to-modal on mobile ─────────
export default function VoiceMessagePlayer({ audioUrl, isOwn, isFromAmy }) {
  const [isMobile, setIsMobile] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsMobile(
        window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      );
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isMobile) {
    return <InlinePlayer audioUrl={audioUrl} isOwn={isOwn} isFromAmy={isFromAmy} />;
  }

  // ── Mobile: compact tap-target → opens modal ──────────────────────────
  const light = isOwn || isFromAmy;

  return (
    <>
      {/* Compact bubble — tap to open player */}
      <button
        onPointerDown={() => setModalOpen(true)}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm w-full max-w-[220px]
          active:scale-95 transition-transform touch-manipulation
          ${isFromAmy
            ? "bg-gradient-to-r from-purple-500 to-pink-500"
            : isOwn
            ? "bg-purple-600"
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          }`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* Play icon circle */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${light ? "bg-white/20" : "bg-purple-100 dark:bg-purple-900/30"}`}>
          <Play
            className={`w-5 h-5 ml-0.5 ${light ? "text-white" : "text-purple-600 dark:text-purple-400"}`}
            fill="currentColor"
          />
        </div>

        {/* Decorative mini waveform */}
        <div className="flex items-center gap-[2px] h-6 flex-1">
          {[40, 70, 55, 90, 65, 80, 50, 75, 60, 85].map((h, i) => (
            <div
              key={i}
              className={`rounded-full flex-1 ${light ? "bg-white/50" : "bg-purple-300 dark:bg-purple-600"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>

        {/* Mic icon + label */}
        <div className="flex flex-col items-end flex-shrink-0">
          <Mic className={`w-3.5 h-3.5 ${light ? "text-white/80" : "text-gray-400"}`} />
          <span className={`text-[10px] mt-0.5 font-medium ${light ? "text-white/70" : "text-gray-500"}`}>
            Voice
          </span>
        </div>
      </button>

      {/* Full-screen modal player */}
      {modalOpen && (
        <AudioModal
          audioUrl={audioUrl}
          isOwn={isOwn}
          isFromAmy={isFromAmy}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}