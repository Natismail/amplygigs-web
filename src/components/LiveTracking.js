// src/components/LiveTracking.jsx
// FIXES:
//   1. "Grant Permission" button was calling handleStartTracking() again,
//      which re-checks hasPermission (still false) → shows prompt again → infinite loop.
//      Fix: button now calls startTracking() DIRECTLY, bypassing the hasPermission gate.
//      The hook handles the browser geolocation permission dialog internally.
//   2. Tracking starts immediately when permission is already granted (no extra click needed).
//   3. All existing functionality (ETA, arrival detection, battery, notifications) unchanged.

"use client";

import { useState, useEffect } from "react";
import { useLocation } from "@/hooks/useLocation";
import { useAuth } from "@/context/AuthContext";

export default function LiveTracking({ bookingId, eventLocation }) {
  const { user } = useAuth();
  const {
    location,
    tracking,
    error,
    permission,
    batteryLevel,
    hasPermission,
    isLowBattery,
    startTracking,
    stopTracking,
    isWithinGeofence,
    getETA,
  } = useLocation({
    updateInterval: 5000,
    minDistanceThreshold: 10,
  });

  const [hasArrived, setHasArrived] = useState(false);

  // ── Arrival detection ────────────────────────────────────────────────────
  useEffect(() => {
    if (location && eventLocation?.latitude && eventLocation?.longitude) {
      const arrived = isWithinGeofence(eventLocation.latitude, eventLocation.longitude, 50);
      if (arrived && !hasArrived) {
        setHasArrived(true);
        notifyArrival();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, eventLocation, isWithinGeofence, hasArrived]);

  const notifyArrival = async () => {
    try {
      await fetch("/api/notifications/arrival", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, userId: user.id }),
      });
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Arrived at Venue! 🎉", {
          body: "You have arrived at the event location.",
          icon: "/icons/icon-192.png",
        });
      }
    } catch (err) {
      console.error("Failed to send arrival notification:", err);
    }
  };

  // ── FIXED: Start tracking handler ────────────────────────────────────────
  // Old flow (broken):
  //   handleStartTracking → hasPermission is false → show prompt → user clicks
  //   "Grant Permission" → calls handleStartTracking again → hasPermission STILL
  //   false (browser dialog hasn't been shown yet) → shows prompt again → loop.
  //
  // New flow:
  //   If permission already granted → call startTracking() directly (hook handles it).
  //   If permission not yet granted → call startTracking() ANYWAY — the hook will
  //   call navigator.geolocation.watchPosition which triggers the browser dialog.
  //   The browser permission popup IS the permission prompt — we don't need our own.
  const handleStartTracking = async () => {
    const started = await startTracking();
    if (!started && !tracking) {
      // startTracking returned false — either denied or a real error
      // The error state from useLocation will display the reason
      console.warn("Tracking did not start — permission may have been denied.");
    }
  };

  const handleStopTracking = async () => {
    await stopTracking();
    setHasArrived(false);
  };

  // ── ETA ──────────────────────────────────────────────────────────────────
  const eta =
    location && eventLocation?.latitude && eventLocation?.longitude
      ? getETA(eventLocation.latitude, eventLocation.longitude)
      : null;

  // ── Permission denied state ───────────────────────────────────────────────
  // Show a helpful message if the user explicitly denied (permission === "denied")
  const permissionDenied = permission === "denied";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Tracking</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {tracking ? "Sharing your location with client" : "Share your journey to the venue"}
          </p>
        </div>
        <div className={`text-3xl ${tracking ? "animate-pulse" : ""}`}>
          {tracking ? "📍" : "🗺️"}
        </div>
      </div>

      {/* Permission denied warning */}
      {permissionDenied && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Location Access Denied</h3>
          <p className="text-sm text-red-800 dark:text-red-200 mb-3">
            Please enable location access in your browser settings, then refresh the page.
          </p>
          <p className="text-xs text-red-700 dark:text-red-300">
            Chrome: Address bar → 🔒 lock icon → Site settings → Location → Allow
          </p>
        </div>
      )}

      {/* Error (non-denial errors) */}
      {error && !permissionDenied && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            <span className="font-semibold">Error:</span> {error}
          </p>
        </div>
      )}

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{isLowBattery ? "🪫" : "🔋"}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Battery</span>
          </div>
          <p className={`text-2xl font-bold ${isLowBattery ? "text-red-600" : "text-gray-900 dark:text-white"}`}>
            {Math.round(batteryLevel)}%
          </p>
          {isLowBattery && <p className="text-xs text-red-600 mt-1">Low power mode active</p>}
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎯</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Accuracy</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {location?.accuracy ? `±${Math.round(location.accuracy)}m` : "--"}
          </p>
        </div>
      </div>

      {/* Live location info */}
      {location && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xl">📍</span>
            <div className="flex-1 text-sm">
              <p className="text-gray-600 dark:text-gray-400">Current Location:</p>
              <p className="font-mono text-gray-900 dark:text-white">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {location.speed && location.speed > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xl">🚗</span>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Moving at <span className="font-semibold">{(location.speed * 3.6).toFixed(1)} km/h</span>
              </p>
            </div>
          )}

          {eta && (
            <div className="flex items-center gap-2">
              <span className="text-xl">⏱️</span>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                ETA: <span className="font-semibold">{eta.formattedTime}</span>
                <span className="text-gray-500"> ({(eta.distance / 1000).toFixed(2)} km away)</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Arrival banner */}
      {hasArrived && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <h3 className="font-bold text-green-900 dark:text-green-100">You&apos;ve Arrived!</h3>
              <p className="text-sm text-green-800 dark:text-green-200">Client has been notified of your arrival</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Control button ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {!tracking ? (
          <button
            onClick={handleStartTracking}
            disabled={permissionDenied}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xl">▶️</span>
            <span>Start Live Tracking</span>
          </button>
        ) : (
          <button
            onClick={handleStopTracking}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
          >
            <span className="text-xl">⏸️</span>
            <span>Stop Tracking</span>
          </button>
        )}

        {!tracking && !permissionDenied && (
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Your browser will ask for location permission when you tap Start
          </p>
        )}

        {tracking && (
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Your location is being shared with the client
          </p>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">📱 How it works</h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Client can see your live location on their map</li>
          <li>• Updates every 5 seconds while tracking</li>
          <li>• Battery-optimized for long journeys</li>
          <li>• Auto-notification when you arrive at venue</li>
        </ul>
      </div>
    </div>
  );
}