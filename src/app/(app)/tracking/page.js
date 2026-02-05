// src/app/(app)/tracking/page.js - COMPLETELY REDESIGNED
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { MapPin, Navigation, Phone, MessageCircle, AlertCircle, Bell, BellOff, Radio, RadioTower } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from 'next/navigation';

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then((mod) => mod.Circle), { ssr: false });

export default function LiveTracking() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingIdFromUrl = searchParams.get('bookingId');
  const mapRef = useRef(null);
  
  const [allBookings, setAllBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [otherPartyLocation, setOtherPartyLocation] = useState(null);
  const [eventLocation, setEventLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationPermission, setLocationPermission] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Custom icons
  const createCustomIcon = (color, emoji) => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return L.divIcon({
      html: `
        <div style="
          background: ${color};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        ">
          ${emoji}
        </div>
      `,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  useEffect(() => {
    if (user) {
      loadUserBookings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (bookingIdFromUrl && allBookings.length > 0) {
      const booking = allBookings.find(b => b.id === bookingIdFromUrl);
      if (booking) {
        handleSelectBooking(booking);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingIdFromUrl, allBookings]);

  useEffect(() => {
    if (selectedBooking && userLocation && eventLocation && mapRef.current) {
      // Center map on musician + event
      const bounds = [];
      bounds.push([userLocation.latitude, userLocation.longitude]);
      bounds.push([eventLocation.latitude, eventLocation.longitude]);
      if (otherPartyLocation) {
        bounds.push([otherPartyLocation.latitude, otherPartyLocation.longitude]);
      }
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [selectedBooking, userLocation, eventLocation, otherPartyLocation]);

  async function loadUserBookings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          musician:musician_id(first_name, last_name, phone),
          client:client_id(first_name, last_name, phone),
          events:event_id(title)
        `)
        .or(`musician_id.eq.${user.id},client_id.eq.${user.id}`)
        .in('status', ['confirmed', 'completed'])
        .order('event_date', { ascending: false }); // Show recent first

      if (error) throw error;

      console.log('📊 Loaded bookings:', data?.length || 0);
      console.log('📍 Bookings data:', data);
      
      setAllBookings(data || []);
      setMapReady(true);
    } catch (err) {
      console.error('❌ Error loading bookings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectBooking(booking) {
    console.log('🎯 Selected booking:', booking);
    
    setSelectedBooking(booking);
    setError("");

    // Set event location
    if (booking.event_latitude && booking.event_longitude) {
      const eventLoc = {
        latitude: booking.event_latitude,
        longitude: booking.event_longitude
      };
      console.log('📍 Event location set:', eventLoc);
      setEventLocation(eventLoc);
    } else {
      console.warn('⚠️ No event coordinates found in booking:', {
        event_latitude: booking.event_latitude,
        event_longitude: booking.event_longitude
      });
      setError("This booking doesn't have location coordinates. Please update the event location.");
      return;
    }

    // Request location permission and start tracking
    console.log('📱 Requesting location permission...');
    await requestLocationPermission();
    subscribeToLocationUpdates(booking.id);
    setTrackingActive(true);
    console.log('✅ Tracking started');

    // Start sharing location
    getCurrentLocation();
  }

  async function requestLocationPermission() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission(true);
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        });
        updateLocationInDB(position.coords);
      },
      (error) => {
        setError("Location permission denied. Please enable location sharing.");
        setLocationPermission(false);
      },
      { enableHighAccuracy: true }
    );
  }

  function getCurrentLocation() {
    if (!selectedBooking || !locationPermission) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = position.coords;
        setUserLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          timestamp: new Date().toISOString()
        });
        updateLocationInDB(coords);
      },
      (error) => console.error("Error getting location:", error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function updateLocationInDB(coords) {
    if (!selectedBooking || !user) return;

    try {
      // First, check if a record already exists
      const { data: existing, error: checkError } = await supabase
        .from("live_locations")
        .select('id')
        .eq('booking_id', selectedBooking.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing location:", checkError);
        return;
      }

      const locationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("live_locations")
          .update(locationData)
          .eq('id', existing.id);

        if (updateError) {
          console.error("Error updating location:", updateError);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from("live_locations")
          .insert({
            booking_id: selectedBooking.id,
            user_id: user.id,
            ...locationData
          });

        if (insertError) {
          console.error("Error inserting location:", insertError);
        }
      }
    } catch (err) {
      console.error("Error updating location:", err);
    }
  }

  function subscribeToLocationUpdates(bookingId) {
    const channel = supabase
      .channel(`live_tracking_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_locations',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          if (payload.new && payload.new.user_id !== user.id) {
            setOtherPartyLocation({
              latitude: payload.new.latitude,
              longitude: payload.new.longitude,
              accuracy: payload.new.accuracy,
              updated_at: payload.new.updated_at
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  useEffect(() => {
    if (trackingActive && locationPermission) {
      const interval = setInterval(getCurrentLocation, 10000); // Update every 10s
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingActive, locationPermission]);

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function getMapCenter() {
    if (userLocation && eventLocation) {
      // Center between user and event
      return [
        (userLocation.latitude + eventLocation.latitude) / 2,
        (userLocation.longitude + eventLocation.longitude) / 2
      ];
    }
    if (userLocation) return [userLocation.latitude, userLocation.longitude];
    if (eventLocation) return [eventLocation.latitude, eventLocation.longitude];
    return [9.0765, 7.3986]; // Abuja, Nigeria default
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access live tracking</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const isMusician = selectedBooking && user.id === selectedBooking.musician_id;
  const otherParty = selectedBooking && (isMusician ? selectedBooking.client : selectedBooking.musician);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <RadioTower className="w-6 h-6 text-purple-600" />
              Live Tracking
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Real-time location sharing</p>
          </div>
          {selectedBooking && trackingActive && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 rounded-full">
              <Radio className="w-4 h-4 text-green-600 animate-pulse" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Live</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Gig Selector */}
        {!selectedBooking && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Select a Gig to Track
            </h2>
            
            {allBookings.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">No active bookings found</p>
                <p className="text-sm text-gray-500">Live tracking is available for confirmed bookings</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {allBookings.map(booking => (
                  <button
                    key={booking.id}
                    onClick={() => handleSelectBooking(booking)}
                    className="w-full text-left p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {booking.events?.title || 'Event'}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {booking.event_location}
                          </p>
                          <p>{new Date(booking.event_date).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tracking View */}
        {selectedBooking && (
          <>
            {/* Selected Gig Info */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">
                    {selectedBooking.events?.title || 'Event'}
                  </h2>
                  <p className="text-purple-100 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedBooking.event_location}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setTrackingActive(false);
                    setUserLocation(null);
                    setOtherPartyLocation(null);
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium"
                >
                  Change Gig
                </button>
              </div>

              {/* Contact Info */}
              {otherParty && (
                <div className="flex items-center gap-3 pt-4 border-t border-purple-500">
                  <div className="flex-1">
                    <p className="text-xs text-purple-200 mb-1">{isMusician ? 'Client' : 'Musician'}</p>
                    <p className="font-semibold">{otherParty.first_name} {otherParty.last_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${otherParty.phone}`}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                    <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Location Stats */}
            {trackingActive && locationPermission && (
              <div className="grid md:grid-cols-3 gap-4">
                {/* Your Location */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Navigation className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Your Location</h3>
                  </div>
                  {userLocation ? (
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        Accuracy: <span className="font-medium text-gray-900 dark:text-white">±{Math.round(userLocation.accuracy)}m</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Updated: {new Date(userLocation.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Getting location...</p>
                  )}
                </div>

                {/* Other Party Location */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{isMusician ? 'Client' : 'Musician'}</h3>
                  </div>
                  {otherPartyLocation ? (
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        Accuracy: <span className="font-medium text-gray-900 dark:text-white">±{Math.round(otherPartyLocation.accuracy)}m</span>
                      </p>
                      {userLocation && (
                        <p className="text-gray-600 dark:text-gray-400">
                          Distance: <span className="font-medium text-gray-900 dark:text-white">
                            {calculateDistance(
                              userLocation.latitude, userLocation.longitude,
                              otherPartyLocation.latitude, otherPartyLocation.longitude
                            ).toFixed(2)} km
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Waiting for location...</p>
                  )}
                </div>

                {/* Event Distance */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Event Venue</h3>
                  </div>
                  {eventLocation && userLocation ? (
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        Distance: <span className="font-bold text-purple-600 text-lg">
                          {calculateDistance(
                            userLocation.latitude, userLocation.longitude,
                            eventLocation.latitude, eventLocation.longitude
                          ).toFixed(2)} km
                        </span>
                      </p>
                      <a
                        href={`https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${eventLocation.latitude},${eventLocation.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-purple-600 hover:text-purple-700 font-medium text-sm"
                      >
                        Get Directions →
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Calculating...</p>
                  )}
                </div>
              </div>
            )}

            {/* Map */}
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="h-[500px] relative">
                {!mapReady ? (
                  <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
                    </div>
                  </div>
                ) : !eventLocation ? (
                  <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700">
                    <div className="text-center p-6">
                      <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">No event location set</p>
                      <p className="text-sm text-gray-500">This booking is missing GPS coordinates</p>
                    </div>
                  </div>
                ) : (
                  <MapContainer
                    ref={mapRef}
                    center={getMapCenter()}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='© OpenStreetMap contributors'
                    />

                    {/* Your Location */}
                    {userLocation && (
                      <>
                        <Marker
                          position={[userLocation.latitude, userLocation.longitude]}
                          icon={createCustomIcon('#3B82F6', '👤')}
                        >
                          <Popup>
                            <strong>Your Location</strong><br />
                            Accuracy: ±{Math.round(userLocation.accuracy)}m
                          </Popup>
                        </Marker>
                        <Circle
                          center={[userLocation.latitude, userLocation.longitude]}
                          radius={userLocation.accuracy}
                          pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.1 }}
                        />
                      </>
                    )}

                    {/* Other Party Location */}
                    {otherPartyLocation && (
                      <>
                        <Marker
                          position={[otherPartyLocation.latitude, otherPartyLocation.longitude]}
                          icon={createCustomIcon('#10B981', '🎵')}
                        >
                          <Popup>
                            <strong>{isMusician ? 'Client' : 'Musician'} Location</strong><br />
                            Accuracy: ±{Math.round(otherPartyLocation.accuracy)}m
                          </Popup>
                        </Marker>
                        <Circle
                          center={[otherPartyLocation.latitude, otherPartyLocation.longitude]}
                          radius={otherPartyLocation.accuracy}
                          pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.1 }}
                        />
                      </>
                    )}

                    {/* Event Location */}
                    <Marker
                      position={[eventLocation.latitude, eventLocation.longitude]}
                      icon={createCustomIcon('#9333EA', '📍')}
                    >
                      <Popup>
                        <strong>Event Venue</strong><br />
                        {selectedBooking.event_location}
                      </Popup>
                    </Marker>

                    {/* Path Lines */}
                    {userLocation && otherPartyLocation && (
                      <Polyline
                        positions={[
                          [userLocation.latitude, userLocation.longitude],
                          [otherPartyLocation.latitude, otherPartyLocation.longitude]
                        ]}
                        pathOptions={{ color: '#F59E0B', weight: 3, dashArray: '10, 10' }}
                      />
                    )}
                    {userLocation && eventLocation && (
                      <Polyline
                        positions={[
                          [userLocation.latitude, userLocation.longitude],
                          [eventLocation.latitude, eventLocation.longitude]
                        ]}
                        pathOptions={{ color: '#9333EA', weight: 3 }}
                      />
                    )}
                  </MapContainer>
                )}
              </div>

              {/* Map Legend */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">You</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">{isMusician ? 'Client' : 'Musician'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                    <span className="text-gray-700 dark:text-gray-300">Event Venue</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}