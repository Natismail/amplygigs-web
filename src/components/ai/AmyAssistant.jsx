// src/components/ai/AmyAssistant.jsx
// Refactored: fully responsive (mobile-first), all existing functionality preserved.
// Changes:
//   • Modal: full-screen on mobile, centred card (max-w-lg) on sm+
//   • max-h + overflow-y-auto → no overflow on small screens
//   • Voice button: responsive size (w-24 h-24 mobile / w-28 h-28 sm+)
//   • Header collapses on very small screens to save vertical space
//   • iOS safe-area padding on bottom
//   • Quick actions: single column on xs, 2-col on sm+
//   • Transcript + response bubbles get max-h + scroll when content is long
//   • Removed onKeyPress (deprecated) → onKeyDown
//   • Removed dead commented-out processVoice block
//   • All logic (startListening, stopListening, processVoice, processText,
//     processQuery, handleQuickAction) is 100% identical to original

"use client";

import { useState, useRef } from "react";
import { Mic, X, Sparkles, Loader2, MicOff, Send } from "lucide-react";
import { aiClient } from "@/lib/ai/client";
import { useRouter } from "next/navigation";

// ── Quick action list (unchanged) ─────────────────────────────────────────────
const QUICK_ACTIONS = [
  { text: "Find Afrobeat DJs in Lagos", icon: "🎵" },
  { text: "Book a live band",           icon: "🎤" },
  { text: "Create a new event",         icon: "🎉" },
  { text: "Show available gigs",        icon: "📅" },
];

export default function AmyAssistant({ onClose }) {
  const router = useRouter();

  // ── State (unchanged) ──────────────────────────────────────────────────────
  const [isListening,  setIsListening]  = useState(false);
  const [transcript,   setTranscript]   = useState("");
  const [amyResponse,  setAmyResponse]  = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput,    setTextInput]    = useState("");

  // ── Refs (unchanged) ───────────────────────────────────────────────────────
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);
  const amyAudioRef      = useRef(null);

  // ── Logic (100% identical to original) ────────────────────────────────────

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current   = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await processVoice(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Microphone error:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoice = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const transcription = await aiClient.transcribe(audioBlob);
      setTranscript(transcription.text);
      await processQuery(transcription.text);
    } catch (error) {
      console.error("Voice processing error:", error);
      setAmyResponse("Sorry, I had trouble understanding that. Could you try again?");
    } finally {
      setIsProcessing(false);
    }
  };

  const processText = async () => {
    if (!textInput.trim()) return;
    setIsProcessing(true);
    setTranscript(textInput);
    try {
      await processQuery(textInput);
    } catch (error) {
      console.error("Text processing error:", error);
      setAmyResponse("Sorry, I encountered an error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processQuery = async (query) => {
    try {
      const intentResult = await aiClient.parseIntent(query, "quick");
      let response = "";
      const filters = intentResult.filters;

      if (intentResult.intent === "search_gigs") {
        const genre    = filters.genre    || "musicians";
        const location = filters.location || "your area";
        response = `Found ${genre} in ${location}! Let me show you the results.`;
        setTimeout(() => {
          const params = new URLSearchParams({
            genre:    filters.genre    || "",
            location: filters.location || "",
            budget:   filters.budget_max || "",
          }).toString();
          router.push(`/musicians?${params}`);
          onClose();
        }, 2000);

      } else if (intentResult.intent === "book_musician") {
        response = `I'll help you book a ${filters.genre || "musician"}! Opening booking page...`;
        setTimeout(() => { router.push("/musicians"); onClose(); }, 2000);

      } else if (intentResult.intent === "create_event") {
        response = "Let's create your event! Opening event creation page...";
        setTimeout(() => { router.push("/musician/my-events?action=create"); onClose(); }, 2000);

      } else {
        response = `I can help you:\n🎵 Find musicians\n🎤 Book gigs\n🎉 Create events\n\nWhat would you like to do?`;
      }

      setAmyResponse(response);

      const audioBlob = await aiClient.textToSpeech(response, "nova", 1.0);
      const audioURL  = URL.createObjectURL(audioBlob);
      if (amyAudioRef.current) {
        amyAudioRef.current.src = audioURL;
        amyAudioRef.current.play();
      }
    } catch (error) {
      console.error("Query processing error:", error);
      setAmyResponse("I can help with finding musicians, booking gigs, or creating events. What do you need?");
    }
  };

  // onKeyDown replaces deprecated onKeyPress
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      processText();
    }
  };

  const handleQuickAction = async (action) => {
    setTextInput(action);
    setTranscript(action);
    await processQuery(action);
  };

  // ── Derived UI states ──────────────────────────────────────────────────────
  const statusText = isProcessing
    ? "🤔 Thinking..."
    : isListening
    ? "🎤 Listening..."
    : "💬 Tap mic or type below";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    // Overlay — full-screen on mobile, centred on sm+
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/*
        Card:
          • mobile  → bottom sheet: rounded-t-2xl, full width, max-h-[92dvh]
          • sm+     → centred modal: rounded-2xl, max-w-lg, max-h-[90vh]
      */}
      <div className="
        relative w-full sm:max-w-lg
        bg-white dark:bg-gray-900
        rounded-t-2xl sm:rounded-2xl
        shadow-2xl
        flex flex-col
        max-h-[92dvh] sm:max-h-[90vh]
        animate-in slide-in-from-bottom duration-300
      ">

        {/* ── Drag handle (mobile only) ─────────────────────────────────── */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* ── Close button ──────────────────────────────────────────────── */}
        <button
          onClick={onClose}
          aria-label="Close Amy assistant"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-2 sm:px-6 sm:pt-4 sm:pb-6 space-y-4">

          {/* Header */}
          <div className="text-center pt-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Quick Assist
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Ask me anything, get instant help
            </p>
          </div>

          {/* Voice button */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
              className={`
                relative w-24 h-24 sm:w-28 sm:h-28
                rounded-full flex items-center justify-center
                transition-all duration-300 shadow-lg
                ${isListening
                  ? "bg-red-500 animate-pulse scale-110"
                  : "bg-gradient-to-br from-purple-600 to-pink-600 hover:scale-105"
                }
                ${isProcessing ? "opacity-50 cursor-not-allowed" : "active:scale-95"}
              `}
            >
              {isProcessing ? (
                <Loader2 className="w-12 h-12 sm:w-14 sm:h-14 text-white animate-spin" />
              ) : isListening ? (
                <MicOff className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
              ) : (
                <Mic className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
              )}

              {isListening && (
                <>
                  <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping" />
                  <span className="absolute inset-0 rounded-full bg-red-300 opacity-50 animate-pulse" />
                </>
              )}
            </button>

            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {statusText}
            </p>
          </div>

          {/* Text input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Or type your question here..."
              disabled={isProcessing || isListening}
              className="flex-1 min-w-0 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-sm transition"
            />
            <button
              onClick={processText}
              disabled={!textInput.trim() || isProcessing || isListening}
              aria-label="Send message"
              className="flex-shrink-0 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Transcript bubble */}
          {transcript && (
            <div className="p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-h-28 overflow-y-auto">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">You</p>
              <p className="text-sm text-gray-900 dark:text-white">{transcript}</p>
            </div>
          )}

          {/* Amy response bubble */}
          {amyResponse && (
            <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 max-h-36 overflow-y-auto">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wide">Amy</p>
              </div>
              <p className="text-sm text-purple-900 dark:text-purple-100 whitespace-pre-wrap leading-relaxed">
                {amyResponse}
              </p>
            </div>
          )}

          {/* Quick actions */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold uppercase tracking-wide">
              💡 Quick Actions
            </p>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.text}
                  onClick={() => handleQuickAction(action.text)}
                  disabled={isProcessing || isListening}
                  className="px-3 py-3 text-left bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition disabled:opacity-50 border border-gray-200 dark:border-gray-700 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                      {action.icon}
                    </span>
                    <span className="text-xs font-medium leading-snug">{action.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat redirect */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => { router.push("/messages"); onClose(); }}
              className="w-full text-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition py-1"
            >
              💬 Or chat with Amy in Messages for detailed help
            </button>
          </div>

          {/* iOS safe-area spacer */}
          <div className="h-safe-bottom sm:hidden" />
        </div>
      </div>

      {/* Hidden TTS audio player */}
      <audio ref={amyAudioRef} className="hidden" />
    </div>
  );
}