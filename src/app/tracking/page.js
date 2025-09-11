"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { MapPin, Navigation, Clock, Phone, MessageCircle, AlertCircle, MapIcon, Bell, BellOff, LogIn } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from 'next/navigation';

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });

export default function LiveTracking() {
  const { user, loading: authLoading, session } = useAuth();
  const router = useRouter();
  
  const [booking, setBooking] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [otherPartyLocation, setOtherPartyLocation] = useState(null);
  const [eventLocation, setEventLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationPermission, setLocationPermission] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [lastNotificationDistance, setLastNotificationDistance] = useState(null);
  const previousLocations = useRef({ user: null, other: null });

  // Custom icons for different markers
  const createCustomIcon = (color, type) => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: white;
          font-weight: bold;
        ">
          ${type === 'user' ? '👤' : type === 'other' ? '🎵' : '📍'}
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  };

  useEffect(() => {
    if (!authLoading) {
      if (user && session) {
        initializeTracking();
        initializeNotifications();
        setMapReady(true);
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, user, session]);

  useEffect(() => {
    if (trackingActive && locationPermission) {
      const interval = setInterval(() => {
        getCurrentLocation();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [trackingActive, locationPermission]);

  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        const handleBatteryChange = () => {
          if (battery.level < 0.15 && trackingActive) {
            showLowBatteryWarning();
          }
        };
        battery.addEventListener('levelchange', handleBatteryChange);
        return () => battery.removeEventListener('levelchange', handleBatteryChange);
      });
    }
  }, [trackingActive]);

  useEffect(() => {
    const handleOnline = () => {
      if (trackingActive) {
        getCurrentLocation();
      }
    };
    const handleOffline = () => {
      if (trackingActive) {
        showConnectionLostNotification();
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [trackingActive]);

  const showLowBatteryWarning = () => {
    if (window.AmplyGigs?.showNotification) {
      window.AmplyGigs.showNotification('🔋 Low Battery Warning', {
        body: 'Your battery is low. Consider charging your device to continue tracking.',
        tag: 'low-battery'
      });
    }
  };

  const showConnectionLostNotification = () => {
    if (window.AmplyGigs?.showNotification) {
      window.AmplyGigs.showNotification('📵 Connection Lost', {
        body: 'Internet connection lost. Tracking will resume when reconnected.',
        tag: 'connection-lost'
      });
    }
  };

  async function initializeNotifications() {
    try {
      const permission = await window.AmplyGigs?.requestNotificationPermission();
      setNotificationsEnabled(permission || false);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  async function initializeTracking() {
    try {
      setLoading(true);
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          *,
          event_location,
          event_coordinates,
          musician:musician_id(first_name, last_name, phone),
          client_profile:client_id(first_name, last_name, phone)
        `)
        .or(`musician_id.eq.${user.id},client_id.eq.${user.id}`)
        .eq("status", "confirmed")
        .single();

      if (bookingError && bookingError.code !== "PGRST116") {
        throw bookingError;
      }

      setBooking(bookingData);
      
      if (bookingData) {
        if (bookingData.event_coordinates) {
          const coords = bookingData.event_coordinates.split(',').map(Number);
          setEventLocation({
            latitude: coords[0],
            longitude: coords[1]
          });
        }
        
        await requestLocationPermission();
        subscribeToLocationUpdates(bookingData.id);
        setTrackingActive(bookingData.tracking_active || false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function requestLocationPermission() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission(true);
          updateLocationInDB(position.coords);
        },
        (error) => {
          setError("Location permission denied. Please enable location sharing.");
        }
      );
    } catch (err) {
      setError("Error requesting location permission.");
    }
  }

  function getCurrentLocation() {
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
      (error) => {
        console.error("Error getting location:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  async function updateLocationInDB(coords) {
    if (!booking || !user) return;

    try {
      await supabase
        .from("live_locations")
        .upsert({
          booking_id: booking.id,
          user_id: user.id,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          updated_at: new Date().toISOString()
        });
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
            const newLocation = {
              latitude: payload.new.latitude,
              longitude: payload.new.longitude,
              accuracy: payload.new.accuracy,
              updated_at: payload.new.updated_at
            };
            setOtherPartyLocation(newLocation);
            if (notificationsEnabled && userLocation) {
              handleLocationUpdateNotifications(newLocation);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  function handleLocationUpdateNotifications(newOtherLocation) {
    const isMusician = user.id === booking.musician_id;
    const otherParty = isMusician ? booking.client_profile : booking.user_profiles;
    const otherPartyName = `${otherParty?.first_name} ${otherParty?.last_name}`;
    
    let distanceToEvent = null;
    if (eventLocation) {
      distanceToEvent = calculateDistance(
        newOtherLocation.latitude,
        newOtherLocation.longitude,
        eventLocation.latitude,
        eventLocation.longitude
      );
    }
    
    if (distanceToEvent && distanceToEvent < 0.1) {
      if (window.AmplyGigs?.showNotification) {
        window.AmplyGigs.showNotification('🎵 Arrival Confirmed!', {
          body: `${otherPartyName} has arrived at the venue!`,
          tag: 'arrival',
          requireInteraction: true
        });
      }
      return;
    }
    
    if (distanceToEvent && lastNotificationDistance) {
      const distanceDiff = lastNotificationDistance - distanceToEvent;
      if (distanceDiff >= 1) {
        if (window.AmplyGigs?.showNotification) {
          window.AmplyGigs.showNotification('📍 Location Update', {
            body: `${otherPartyName} is now ${distanceToEvent.toFixed(1)}km away from the venue`,
            tag: 'distance-' + Math.floor(distanceToEvent)
          });
        }
        setLastNotificationDistance(distanceToEvent);
      }
    } else if (distanceToEvent) {
      setLastNotificationDistance(distanceToEvent);
    }
  }

  async function toggleTracking() {
    if (!booking) return;

    const newStatus = !trackingActive;
    setTrackingActive(newStatus);

    try {
      await supabase
        .from("bookings")
        .update({ tracking_active: newStatus })
        .eq("id", booking.id);

      if (newStatus && locationPermission) {
        getCurrentLocation();
        
        if (notificationsEnabled && window.AmplyGigs?.showNotification) {
          // FIX: Corrected notification message to be more descriptive
          const isMusician = user.id === booking.musician_id;
          const userName = isMusician 
            ? `${booking.user_profiles?.first_name} ${booking.user_profiles?.last_name}`
            : `${booking.client_profile?.first_name} ${booking.client_profile?.last_name}`;
          
          window.AmplyGigs.showNotification('🚀 Tracking Started', {
            body: `${userName} has started sharing their location for this booking.`,
            tag: 'tracking-started'
          });
        }
      }
    } catch (err) {
      setError("Error updating tracking status");
    }
  }

  async function toggleNotifications() {
    if (!notificationsEnabled) {
      const success = await window.AmplyGigs?.requestNotificationPermission();
      setNotificationsEnabled(success || false);
      
      if (success) {
        window.AmplyGigs?.testNotification();
      }
    } else {
      setNotificationsEnabled(false);
    }
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *       Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d;
  }

  // FIX: Updated function to generate a proper Google Maps URL
  function getMapUrl() {
    if (!userLocation || !eventLocation) return "#";
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = `${eventLocation.latitude},${eventLocation.longitude}`;
    return `https://www.google.com/maps/dir/${origin}/${destination}`;
  }

  function getMapCenter() {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }
    if (eventLocation) {
      return [eventLocation.latitude, eventLocation.longitude];
    }
    return [40.7128, -74.0060];
  }

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center max-w-md mx-auto">
          <LogIn className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Authentication Required</h2>
          <p className="text-blue-700 mb-6">Please sign in to access live tracking features.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Live Tracking</h1>
        <div className="bg-gray-50 border rounded-lg p-8 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No active bookings with tracking enabled</p>
          <p className="text-sm text-gray-500">Live tracking will be available when you have confirmed bookings</p>
        </div>
      </div>
    );
  }

  const isMusician = user.id === booking.musician_id;
  const otherParty = isMusician ? booking.client_profile : booking.user_profiles;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🎵 Live Tracking</h1>

      {/* Event Details Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Event Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Event Location</p>
            <p className="font-medium">{booking.event_location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Event Date & Time</p>
            <p className="font-medium">{new Date(booking.event_date).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{isMusician ? "Client" : "Musician"}</p>
            <p className="font-medium">{otherParty?.first_name} {otherParty?.last_name}</p>
          </div>
          <div className="flex gap-2">
            <a 
              href={`tel:${otherParty?.phone}`}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
            <button className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200">
              <MessageCircle className="h-4 w-4" />
              Message
            </button>
          </div>
        </div>
      </div>

      {/* Tracking Control */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Location Tracking</h2>
          <div className="flex gap-2">
            <button
              onClick={toggleNotifications}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                notificationsEnabled
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {notificationsEnabled ? "Notifications On" : "Enable Notifications"}
            </button>
            <button
              onClick={toggleTracking}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                trackingActive
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {trackingActive ? "Stop Tracking" : "Start Tracking"}
            </button>
          </div>
        </div>

        {!locationPermission && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-amber-700 text-sm">
              Location permission is required for live tracking. Please enable location sharing.
            </p>
          </div>
        )}

        {trackingActive && locationPermission && (
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {/* Your Location */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Your Location
              </h3>
              {userLocation ? (
                <div className="space-y-1 text-sm">
                  <p><span className="text-blue-700">Accuracy:</span> ±{Math.round(userLocation.accuracy)}m</p>
                  <p><span className="text-blue-700">Updated:</span> {new Date(userLocation.timestamp).toLocaleTimeString()}</p>
                </div>
              ) : (
                <p className="text-blue-700 text-sm">Getting location...</p>
              )}
            </div>

            {/* Other Party Location */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {isMusician ? "Client" : "Musician"}
              </h3>
              {otherPartyLocation ? (
                <div className="space-y-1 text-sm">
                  <p><span className="text-green-700">Accuracy:</span> ±{Math.round(otherPartyLocation.accuracy)}m</p>
                  <p><span className="text-green-700">Updated:</span> {new Date(otherPartyLocation.updated_at).toLocaleTimeString()}</p>
                  {userLocation && (
                    <p><span className="text-green-700">Distance:</span> {calculateDistance(
                      userLocation.latitude, userLocation.longitude,
                      otherPartyLocation.latitude, otherPartyLocation.longitude
                    ).toFixed(2)} km</p>
                  )}
                </div>
              ) : (
                <p className="text-green-700 text-sm">Waiting for location...</p>
              )}
            </div>

            {/* Event Location */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                <MapIcon className="h-4 w-4" />
                Event Venue
              </h3>
              {eventLocation && userLocation && (
                <div className="space-y-1 text-sm">
                  <p><span className="text-purple-700">Distance:</span> {calculateDistance(
                    userLocation.latitude, userLocation.longitude,
                    eventLocation.latitude, eventLocation.longitude
                  ).toFixed(2)} km</p>
                  <a
                    href={getMapUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium text-sm"
                  >
                    Get Directions
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Map */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b">
          <h2 className="text-lg font-semibold">Live Map</h2>
        </div>
        <div className="h-96">
          {mapReady && (
            <MapContainer
              center={getMapCenter()}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* User Location Marker */}
              {userLocation && (
                <Marker 
                  position={[userLocation.latitude, userLocation.longitude]}
                  icon={createCustomIcon('#3B82F6', 'user')}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>Your Location</strong><br/>
                      Accuracy: ±{Math.round(userLocation.accuracy)}m<br/>
                      Updated: {new Date(userLocation.timestamp).toLocaleTimeString()}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Other Party Location Marker */}
              {otherPartyLocation && (
                <Marker 
                  position={[otherPartyLocation.latitude, otherPartyLocation.longitude]}
                  icon={createCustomIcon('#10B981', 'other')}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>{isMusician ? 'Client' : 'Musician'} Location</strong><br/>
                      Accuracy: ±{Math.round(otherPartyLocation.accuracy)}m<br/>
                      Updated: {new Date(otherPartyLocation.updated_at).toLocaleTimeString()}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* FIX: Add Event Location Marker */}
              {eventLocation && (
                <Marker
                  position={[eventLocation.latitude, eventLocation.longitude]}
                  icon={createCustomIcon('#800080', 'event')} // Purple icon for event
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>Event Venue</strong><br/>
                      {booking.event_location}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* FIX: Add a Polyline to show the path between the two parties */}
              {userLocation && otherPartyLocation && (
                <Polyline
                  positions={[
                    [userLocation.latitude, userLocation.longitude],
                    [otherPartyLocation.latitude, otherPartyLocation.longitude]
                  ]}
                  color="orange"
                  weight={5}
                />
              )}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}