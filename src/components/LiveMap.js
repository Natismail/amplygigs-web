"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LiveMap({ musicianId, eventLocation }) {
  const [musicianLocation, setMusicianLocation] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [eta, setEta] = useState(null);
  const mapRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    // Subscribe to musician's location updates
    const channel = supabase.channel(`location:${musicianId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on('broadcast', { event: 'location_update' }, (payload) => {
        console.log('📍 Location update received:', payload);
        setMusicianLocation(payload.payload);
        setIsLive(true);
        
        // Calculate ETA
        if (eventLocation?.latitude && eventLocation?.longitude) {
          const distance = calculateDistance(
            payload.payload.latitude,
            payload.payload.longitude,
            eventLocation.latitude,
            eventLocation.longitude
          );

          const speed = payload.payload.speed || 10; // Default 10 m/s (~36 km/h)
          const timeMinutes = Math.ceil((distance / speed) / 60);

          setEta({
            distance: (distance / 1000).toFixed(2),
            time: timeMinutes,
            formattedTime: timeMinutes < 60 
              ? `${timeMinutes} min` 
              : `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m`
          });
        }
      })
      .subscribe((status) => {
        console.log('📡 Channel status:', status);
      });

    channelRef.current = channel;

    // Fetch initial location from database
    fetchInitialLocation();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicianId, eventLocation]);

  const fetchInitialLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('current_latitude, current_longitude, is_live, location_updated_at')
        .eq('id', musicianId)
        .single();

      if (!error && data && data.current_latitude && data.current_longitude) {
        setMusicianLocation({
          latitude: data.current_latitude,
          longitude: data.current_longitude,
        });
        setIsLive(data.is_live);

        // Check if location is stale (older than 1 minute)
        const locationTime = new Date(data.location_updated_at).getTime();
        const isStale = Date.now() - locationTime > 60000;
        
        if (isStale) {
          setIsLive(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch initial location:', err);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // in meters
  };

  // Simple map visualization (you can replace with Google Maps/Mapbox)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Map Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Musician Location</h3>
            <p className="text-sm opacity-90">
              {isLive ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Live tracking active
                </span>
              ) : (
                'Tracking not started'
              )}
            </p>
          </div>
          <span className="text-3xl">
            {isLive ? '📍' : '🗺️'}
          </span>
        </div>
      </div>

      {/* ETA Banner */}
      {isLive && eta && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Arrival</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {eta.formattedTime}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Distance</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {eta.distance} km
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef}
        className="relative bg-gray-100 dark:bg-gray-900 h-[400px] flex items-center justify-center"
      >
        {!musicianLocation ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-gray-600 dark:text-gray-400">
              Waiting for musician to start tracking...
            </p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Simple visualization - replace with actual map */}
            <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20">
              {/* Musician Marker */}
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  animation: 'bounce 2s infinite'
                }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500 rounded-full opacity-50 animate-ping"></div>
                  <div className="relative bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg">
                    🎸
                  </div>
                </div>
              </div>

              {/* Event Location Marker */}
              {eventLocation && (
                <div className="absolute top-1/4 right-1/4">
                  <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl shadow-lg">
                    🎯
                  </div>
                </div>
              )}

              {/* Info Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">Musician</p>
                    <p className="font-mono text-xs text-gray-900 dark:text-white">
                      {musicianLocation.latitude?.toFixed(6)}, {musicianLocation.longitude?.toFixed(6)}
                    </p>
                  </div>
                  {eventLocation && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Event Venue</p>
                      <p className="font-mono text-xs text-gray-900 dark:text-white">
                        {eventLocation.latitude?.toFixed(6)}, {eventLocation.longitude?.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integration Guide */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 <strong>Tip:</strong> Replace this with Google Maps or Mapbox for full interactive map experience
        </p>
      </div>
    </div>
  );
}