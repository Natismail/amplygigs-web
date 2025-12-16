// src/app/musician/events/page.js

"use client";

import { useEffect, useState } from "react";
import { useData } from "@/context/DataContext";
import PublicEventCard from "@/components/events/PublicEventCard";
import MusicianEvents from "@/components/MusicianEvents";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function MusicianEventsPage() {
  const { user } = useAuth();
  const { events, fetchEvents, externalEvents, fetchExternalEvents, loading } = useData();

  const [publicEvents, setPublicEvents] = useState([]);
  const [loadingPublicEvents, setLoadingPublicEvents] = useState(true);
  const [interestedEventIds, setInterestedEventIds] = useState([]);

  // Load events on mount
  useEffect(() => {
    if (!events || events.length === 0) fetchEvents();
    if (!externalEvents || externalEvents.length === 0) fetchExternalEvents();

    loadMockPublicEvents();
  }, [events, externalEvents, fetchEvents, fetchExternalEvents]);

  // Mock public events for now
  async function loadMockPublicEvents() {
    setLoadingPublicEvents(true);
    const mockData = [
      {
        id: "1",
        title: "Jazz Night Live",
        venue: "Blue Note Club",
        location: "Lagos, Nigeria",
        date: new Date().toISOString(),
        image: "/mock/jazz-night.jpg",
      },
      {
        id: "2",
        title: "Acoustic Open Mic",
        venue: "Harmony Hall",
        location: "Abuja, Nigeria",
        date: new Date().toISOString(),
        image: "/mock/acoustic-openmic.jpg",
      },
      {
        id: "3",
        title: "Summer Beats Festival",
        venue: "Lekki Stage",
        location: "Lagos, Nigeria",
        date: new Date().toISOString(),
        image: "/mock/summer-beats.jpg",
      },
    ];
    setPublicEvents(mockData);
    setLoadingPublicEvents(false);
  }

  // Signify interest in a gig
  async function handleExpressInterest(eventId) {
    if (!user) return alert("Please log in to express interest.");

    // Avoid double marking
    if (interestedEventIds.includes(eventId)) return;

    try {
      await supabase.from("gig_interests").insert({
        event_id: eventId,
        musician_id: user.id,
        created_at: new Date().toISOString(),
      });
      setInterestedEventIds([...interestedEventIds, eventId]);
      alert("Interest expressed successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to express interest. Try again later.");
    }
  }

  const EventCard = ({ evt }) => (
    <div className="p-6 border rounded-xl shadow-sm bg-white dark:bg-gray-800 space-y-3 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold flex-1">{evt.title}</h3>
        {evt.event_type && (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
            {evt.event_type}
          </span>
        )}
      </div>

      {evt.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {evt.description}
        </p>
      )}

      <div className="space-y-1 text-sm">
        <p className="flex items-center gap-2">
          <span>📍</span>
          <strong>{evt.venue || evt.location || "TBA"}</strong>
        </p>
        <p className="flex items-center gap-2">
          <span>🗓</span>
          {new Date(evt.start_time || evt.date).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {evt.end_time && (
          <p className="text-xs text-gray-500">Ends: {new Date(evt.end_time).toLocaleString()}</p>
        )}
      </div>

      {/* Links */}
      <div className="flex gap-3 pt-2">
        {evt.link && (
          <a
            href={evt.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            More Info →
          </a>
        )}
        {evt.image && (
          <a
            href={evt.image}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:underline text-sm font-medium"
          >
            View Flyer
          </a>
        )}
      </div>

      <button
        onClick={() => handleExpressInterest(evt.id)}
        disabled={interestedEventIds.includes(evt.id)}
        className={`mt-3 w-full px-3 py-2 rounded ${
          interestedEventIds.includes(evt.id)
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {interestedEventIds.includes(evt.id) ? "Interest Expressed" : "Express Interest"}
      </button>
    </div>
  );

  const isLoading =
    (loading.events && (!events || events.length === 0)) ||
    (loading.externalEvents && (!externalEvents || externalEvents.length === 0));

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🎵 Events</h1>
        <button
          onClick={() => {
            fetchEvents(true);
            fetchExternalEvents(true);
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          🔄 Refresh Events
        </button>
      </div>

      {/* AmplyGigs Events */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold">AmplyGigs Events</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Client gigs you can apply for
            </p>
          </div>
          {loading.events && <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>}
        </div>

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <EventCard key={evt.id} evt={evt} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500">No AmplyGigs events available.</p>
            <p className="text-sm text-gray-400 mt-2">Check back later for new opportunities!</p>
          </div>
        )}
      </section>

      {/* Public Events */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold">🌍 Public Events</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Discover music events in your area
            </p>
          </div>
          {loadingPublicEvents && <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>}
        </div>

        {publicEvents && publicEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicEvents.map((evt) => (
              <PublicEventCard key={evt.id} event={evt} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500">No public events found.</p>
            <p className="text-sm text-gray-400 mt-2">We&apos;re constantly updating this section!</p>
          </div>
        )}
      </section>
    </div>
  );
}

