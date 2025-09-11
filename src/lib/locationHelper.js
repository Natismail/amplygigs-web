// lib/locationHelper.js

/**
 * Geocode an address to get coordinates
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
export async function geocodeAddress(address) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        display_name: result.display_name
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    
    const data = await response.json();
    
    if (data) {
      return {
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        state: data.address?.state,
        country: data.address?.country
      };
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Calculate distance between two points in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in kilometers
  return d;
}

/**
 * Get estimated travel time (very basic estimation)
 * For real-time traffic, you'd want to use Google Maps API or similar
 */
export function estimateTravelTime(distanceKm, mode = 'driving') {
  const speeds = {
    walking: 5, // km/h
    cycling: 15, // km/h
    driving: 50, // km/h (city average)
    transit: 25 // km/h (public transport average)
  };
  
  const speed = speeds[mode] || speeds.driving;
  const timeHours = distanceKm / speed;
  const timeMinutes = Math.round(timeHours * 60);
  
  return {
    minutes: timeMinutes,
    formatted: timeMinutes < 60 
      ? `${timeMinutes} minutes`
      : `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m`
  };
}