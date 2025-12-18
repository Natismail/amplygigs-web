// src/hooks/useLocation.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export function useLocation(options = {}) {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt');
  
  const watchIdRef = useRef(null);
  const updateIntervalRef = useRef(null);

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    updateInterval = 5000, // Update DB every 5 seconds
  } = options;

  // Check permission status
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermission(result.state);
        result.onchange = () => setPermission(result.state);
      });
    }
  }, []);

  // Request location permission
  const requestPermission = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPermission('granted');
          resolve(position);
        },
        (err) => {
          setPermission('denied');
          setError(err.message);
          reject(err);
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  // Get current location (one-time)
  const getCurrentLocation = useCallback(async () => {
    setError(null);

    try {
      const position = await requestPermission();
      
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };

      setLocation(locationData);
      return locationData;
    } catch (err) {
      console.error('Location error:', err);
      setError(err.message);
      return null;
    }
  }, [requestPermission]);

  // Update location in database
  const updateLocationInDB = useCallback(async (locationData) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          current_latitude: locationData.latitude,
          current_longitude: locationData.longitude,
          location_updated_at: new Date().toISOString(),
          is_live: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Also broadcast to realtime channel
      const channel = supabase.channel(`location:${user.id}`);
      channel.send({
        type: 'broadcast',
        event: 'location_update',
        payload: {
          user_id: user.id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timestamp: locationData.timestamp,
        },
      });

    } catch (err) {
      console.error('DB update error:', err);
    }
  }, [user]);

  // Start continuous tracking
  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported');
      return;
    }

    setTracking(true);
    setError(null);

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };

        setLocation(locationData);
      },
      (err) => {
        console.error('Tracking error:', err);
        setError(err.message);
      },
      { enableHighAccuracy, timeout, maximumAge }
    );

    // Set up periodic DB updates
    updateIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          updateLocationInDB(locationData);
        },
        (err) => console.error('Update error:', err),
        { enableHighAccuracy: true }
      );
    }, updateInterval);

  }, [enableHighAccuracy, timeout, maximumAge, updateInterval, updateLocationInDB]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (updateIntervalRef.current !== null) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    setTracking(false);

    // Update DB to show offline
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ is_live: false })
        .eq('id', user.id);
    }
  }, [user]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance; // in kilometers
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    location,
    tracking,
    error,
    permission,
    getCurrentLocation,
    startTracking,
    stopTracking,
    updateLocationInDB,
    calculateDistance,
    hasPermission: permission === 'granted',
  };
}