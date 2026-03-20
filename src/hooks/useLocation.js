// src/hooks/useLocation.js
// FIXES vs original:
//   1. startTracking() is now async and returns true/false — LiveTracking awaits it
//   2. GeolocationPositionError logged correctly (non-enumerable props read explicitly)
//      + error.code mapped to human-readable message
//   3. setTracking(true) only called AFTER first successful position (not optimistically)
//   4. batteryLevel + isLowBattery added via Battery Status API (graceful fallback to 100%)
//   5. isWithinGeofence() + getETA() added to return value (were used in LiveTracking but missing)
//   6. minDistanceThreshold option now actually filters small position changes
//   7. setError(null) used for "no error" — never setError("") which looks like an error

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

// ── GeolocationPositionError code → readable message ──────────────────────────
const GEO_ERROR_MESSAGES = {
  1: 'Location permission denied. Please allow access in your browser settings.',
  2: 'Location unavailable. Check your GPS signal or network connection.',
  3: 'Location request timed out. Please try again.',
};

function geoErrorMessage(err) {
  // GeolocationPositionError has non-enumerable props — read explicitly
  return GEO_ERROR_MESSAGES[err?.code] || err?.message || 'Unknown location error';
}

export function useLocation(options = {}) {
  const { user } = useAuth();

  const [location,     setLocation]     = useState(null);
  const [tracking,     setTracking]     = useState(false);
  const [error,        setError]        = useState(null);   // null = no error
  const [permission,   setPermission]   = useState('prompt');
  const [batteryLevel, setBatteryLevel] = useState(100);    // ✅ FIX 4: battery state
  const [isLowBattery, setIsLowBattery] = useState(false);

  const watchIdRef         = useRef(null);
  const updateIntervalRef  = useRef(null);
  const lastDbUpdateRef    = useRef(0);       // timestamp of last DB write
  const lastLocationRef    = useRef(null); // ✅ FIX 6: for minDistanceThreshold

  const {
    enableHighAccuracy    = true,
    timeout               = 10000,
    maximumAge            = 0,
    updateInterval        = 5000,
    minDistanceThreshold  = 10,    // metres — ignore updates smaller than this
  } = options;

  // ── Permission status watcher ────────────────────────────────────────────────
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermission(result.state);
        result.onchange = () => setPermission(result.state);
      }).catch(() => {}); // ignore if query not supported
    }
  }, []);

  // ── ✅ FIX 4: Battery Status API ─────────────────────────────────────────────
  useEffect(() => {
    if (!('getBattery' in navigator)) return; // not supported → stays at 100%

    navigator.getBattery().then((battery) => {
      const update = () => {
        const pct = Math.round(battery.level * 100);
        setBatteryLevel(pct);
        setIsLowBattery(pct <= 20);
      };
      update();
      battery.addEventListener('levelchange',      update);
      battery.addEventListener('chargingchange',   update);
      return () => {
        battery.removeEventListener('levelchange',    update);
        battery.removeEventListener('chargingchange', update);
      };
    }).catch(() => {}); // ignore if denied
  }, []);

  // ── Haversine distance (metres) ──────────────────────────────────────────────
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R    = 6371000; // metres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a    =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  // ── ✅ FIX 5: isWithinGeofence ───────────────────────────────────────────────
  const isWithinGeofence = useCallback((targetLat, targetLon, radiusMetres = 50) => {
    if (!location) return false;
    const dist = calculateDistance(
      location.latitude, location.longitude,
      targetLat, targetLon
    );
    return dist <= radiusMetres;
  }, [location, calculateDistance]);

  // ── ✅ FIX 5: getETA ─────────────────────────────────────────────────────────
  const getETA = useCallback((targetLat, targetLon, speedKmh = 30) => {
    if (!location) return null;
    const distMetres = calculateDistance(
      location.latitude, location.longitude,
      targetLat, targetLon
    );
    const distKm        = distMetres / 1000;
    const hours         = distKm / speedKmh;
    const totalMinutes  = Math.round(hours * 60);
    const hrs           = Math.floor(totalMinutes / 60);
    const mins          = totalMinutes % 60;
    const formattedTime = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;

    return {
      distance:      distMetres,    // metres
      distanceKm:    distKm,
      minutes:       totalMinutes,
      formattedTime,
    };
  }, [location, calculateDistance]);

  // ── Update DB ────────────────────────────────────────────────────────────────
  const updateLocationInDB = useCallback(async (locationData) => {
    if (!user) return;
    try {
      const { error: dbErr } = await supabase
        .from('user_profiles')
        .update({
          current_latitude:    locationData.latitude,
          current_longitude:   locationData.longitude,
          location_updated_at: new Date().toISOString(),
          is_live:             true,
        })
        .eq('id', user.id);

      if (dbErr) throw dbErr;

      // Broadcast to realtime channel
      const channel = supabase.channel(`location:${user.id}`);
      channel.send({
        type:    'broadcast',
        event:   'location_update',
        payload: {
          user_id:   user.id,
          latitude:  locationData.latitude,
          longitude: locationData.longitude,
          timestamp: locationData.timestamp,
        },
      });
    } catch (err) {
      console.error('DB update error:', err?.message || err);
    }
  }, [user]);

  // ── ✅ FIX 1 + 3: startTracking — async, returns bool, sets tracking only on success
  const startTracking = useCallback(() => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        setError('Geolocation is not supported by this browser.');
        resolve(false);
        return;
      }

      setError(null);
      // ✅ FIX 3: do NOT setTracking(true) here — wait for first position callback

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const locationData = {
            latitude:  position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy:  position.coords.accuracy,
            altitude:  position.coords.altitude,
            heading:   position.coords.heading,
            speed:     position.coords.speed,
            timestamp: position.timestamp,
          };

          // ✅ FIX 6: skip updates smaller than minDistanceThreshold
          if (lastLocationRef.current) {
            const moved = calculateDistance(
              lastLocationRef.current.latitude,
              lastLocationRef.current.longitude,
              locationData.latitude,
              locationData.longitude,
            );
            if (moved < minDistanceThreshold) return; // too small — ignore
          }

          lastLocationRef.current = locationData;
          setLocation(locationData);

          // ✅ FIX 3: first successful position → now mark as tracking
          setTracking(true);
          setError(null);

          // Throttle DB writes to once per updateInterval ms
          const now = Date.now();
          if (now - lastDbUpdateRef.current >= updateInterval) {
            lastDbUpdateRef.current = now;
            updateLocationInDB(locationData);
          }

          // Resolve the promise on first position (so startTracking returns true)
          resolve(true);
        },
        (err) => {
          // ✅ FIX 2: GeolocationPositionError has non-enumerable props
          const msg = geoErrorMessage(err);
          console.error('Tracking error:', { code: err?.code, message: err?.message });
          setError(msg);
          setTracking(false);

          // Clear the watch since it failed
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }

          resolve(false);
        },
        { enableHighAccuracy, timeout, maximumAge }
      );

      // DB writes are throttled inside the watchPosition success callback.
      // No second geolocation stream needed — watchPosition already fires continuously.
      // updateIntervalRef is kept for stopTracking cleanup compatibility.
    });
  }, [
    enableHighAccuracy, timeout, maximumAge,
    updateInterval, minDistanceThreshold,
    calculateDistance, updateLocationInDB,
  ]);

  // ── stopTracking ─────────────────────────────────────────────────────────────
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (updateIntervalRef.current !== null) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    lastLocationRef.current = null;
    lastDbUpdateRef.current  = 0;
    setTracking(false);
    setError(null);

    if (user) {
      await supabase
        .from('user_profiles')
        .update({ is_live: false })
        .eq('id', user.id);
    }
  }, [user]);

  // ── requestPermission (one-time position check) ───────────────────────────
  const requestPermission = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => { setPermission('granted'); resolve(position); },
        (err)      => {
          setPermission('denied');
          // ✅ FIX 2: read non-enumerable props
          const msg = geoErrorMessage(err);
          setError(msg);
          reject(new Error(msg));
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  // ── getCurrentLocation (one-time) ────────────────────────────────────────────
  const getCurrentLocation = useCallback(async () => {
    setError(null);
    try {
      const position    = await requestPermission();
      const locationData = {
        latitude:  position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy:  position.coords.accuracy,
        altitude:  position.coords.altitude,
        heading:   position.coords.heading,
        speed:     position.coords.speed,
        timestamp: position.timestamp,
      };
      setLocation(locationData);
      return locationData;
    } catch (err) {
      // error already set by requestPermission
      return null;
    }
  }, [requestPermission]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
      if (updateIntervalRef.current !== null)
        clearInterval(updateIntervalRef.current);
    };
  }, []);

  return {
    // State
    location,
    tracking,
    error,
    permission,
    batteryLevel,    // ✅ was missing
    isLowBattery,    // ✅ was missing

    // Derived
    hasPermission: permission === 'granted',

    // Actions
    startTracking,       // ✅ now async, returns Promise<boolean>
    stopTracking,
    getCurrentLocation,
    requestPermission,
    updateLocationInDB,

    // Utilities
    calculateDistance,   // returns metres
    isWithinGeofence,    // ✅ was missing
    getETA,              // ✅ was missing
  };
}