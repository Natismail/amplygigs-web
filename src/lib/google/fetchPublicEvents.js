// src/lib/google/fetchPublicEvents.js

export async function fetchPublicEvents({ lat, lng, keyword = "music" }) {
  /**
   * Replace this later with:
   * Google Places API
   * Ticketmaster
   * Eventbrite
   */

  // TEMP MOCK DATA (safe, predictable)
  return [
    {
      id: "google-1",
      title: "Live Jazz Night",
      venue: "Terra Kulture",
      location: "Lagos, Nigeria",
      date: "2025-01-22T19:00:00",
      image:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
      source: "google",
    },
    {
      id: "google-2",
      title: "Open Mic Friday",
      venue: "Freedom Park",
      location: "Lagos, Nigeria",
      date: "2025-01-25T18:00:00",
      image:
        "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2",
      source: "google",
    },
  ];
}
