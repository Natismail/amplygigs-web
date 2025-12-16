"use client";

import { useEffect, useState } from "react";
import { fetchPublicEvents } from "@/lib/google/fetchPublicEvents";
import PublicEventCard from "@/components/events/PublicEventCard";

export default function MusicianDiscoverPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    const data = await fetchPublicEvents({
      lat: 6.5244,
      lng: 3.3792,
    });
    setEvents(data);
    setLoading(false);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🌍 Discover Public Events</h1>
      <p className="text-gray-600 mb-6">
        Explore music events happening around you.
      </p>

      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500">No public events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <PublicEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
