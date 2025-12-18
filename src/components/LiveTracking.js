"use client";

import { useState, useEffect } from 'react';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/context/AuthContext';

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

  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);

  // Check if arrived at venue (within 50m)
  useEffect(() => {
    if (location && eventLocation?.latitude && eventLocation?.longitude) {
      const arrived = isWithinGeofence(
        eventLocation.latitude,
        eventLocation.longitude,
        50 // 50 meters radius
      );
      
      if (arrived && !hasArrived) {
        setHasArrived(true);
        // Trigger arrival notification
        notifyArrival();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, eventLocation, isWithinGeofence, hasArrived]);

  const notifyArrival = async () => {
    // Send notification to client
    try {
      await fetch('/api/notifications/arrival', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, userId: user.id }),
      });
      
      // Show local notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Arrived at Venue! 🎉', {
          body: 'You have arrived at the event location.',
          icon: '/icons/icon-192.png',
        });
      }
    } catch (err) {
      console.error('Failed to send arrival notification:', err);
    }
  };

  const handleStartTracking = async () => {
    if (!hasPermission) {
      setShowPermissionPrompt(true);
      return;
    }

    const started = await startTracking();
    if (!started) {
      alert('Failed to start tracking. Please check your location permissions.');
    }
  };

  const handleStopTracking = async () => {
    await stopTracking();
    setHasArrived(false);
  };

  // Calculate ETA if event location is provided
  const eta = location && eventLocation?.latitude && eventLocation?.longitude
    ? getETA(eventLocation.latitude, eventLocation.longitude)
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Live Tracking
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {tracking ? 'Sharing your location' : 'Track your journey'}
          </p>
        </div>
        <div className={`text-3xl ${tracking ? 'animate-pulse' : ''}`}>
          {tracking ? '📍' : '🗺️'}
        </div>
      </div>

      {/* Permission Prompt */}
      {showPermissionPrompt && !hasPermission && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            Location Permission Required
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
            Allow AmplyGigs to access your location to share your journey with the client.
          </p>
          <button
            onClick={() => {
              setShowPermissionPrompt(false);
              handleStartTracking();
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Grant Permission
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            <span className="font-semibold">Error:</span> {error}
          </p>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Battery Status */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">
              {isLowBattery ? '🪫' : '🔋'}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Battery
            </span>
          </div>
          <p className={`text-2xl font-bold ${
            isLowBattery ? 'text-red-600' : 'text-gray-900 dark:text-white'
          }`}>
            {Math.round(batteryLevel)}%
          </p>
          {isLowBattery && (
            <p className="text-xs text-red-600 mt-1">Low power mode active</p>
          )}
        </div>

        {/* Accuracy Status */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎯</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Accuracy
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {location?.accuracy ? `±${Math.round(location.accuracy)}m` : '--'}
          </p>
        </div>
      </div>

      {/* Location Info */}
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

      {/* Arrival Status */}
      {hasArrived && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <h3 className="font-bold text-green-900 dark:text-green-100">
                You&apos;ve Arrived!
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200">
                Client has been notified of your arrival
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="space-y-3">
        {!tracking ? (
          <button
            onClick={handleStartTracking}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
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

        {tracking && (
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Your location is being shared with the client
          </p>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">
          📱 How it works
        </h4>
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