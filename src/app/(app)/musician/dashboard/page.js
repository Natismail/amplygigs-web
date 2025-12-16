// // // // // src/app/musician/dashboard/page.js
// "use client"

// src/app/musician/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

import ProfileCard from "@/components/dashboard/ProfileCard";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
import EventPreviewSection from "@/components/dashboard/EventPreviewSection";
import PublicEventCard from "@/components/events/PublicEventCard";
import MusicianEvents from "@/components/MusicianEvents";

import { fetchPublicEvents } from "@/lib/google/fetchPublicEvents";

export default function MusicianDashboard() {
  const { user } = useAuth();
  const {
    profile,
    stats,
    bookings,
    events,
    fetchProfile,
    fetchBookings,
    fetchEvents
  } = useData();

  const [publicEvents, setPublicEvents] = useState([]);
  const [loadingPublicEvents, setLoadingPublicEvents] = useState(true);

  // Load public events
  useEffect(() => {
    async function loadPublicEvents() {
      setLoadingPublicEvents(true);
      try {
        const data = await fetchPublicEvents({ lat: 6.5244, lng: 3.3792 });
        setPublicEvents(data.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch public events:", error);
      } finally {
        setLoadingPublicEvents(false);
      }
    }

    loadPublicEvents();
  }, []);

  // Load user-related data
  useEffect(() => {
    if (user) {
      if (!profile) fetchProfile();
      if (!bookings || bookings.length === 0) fetchBookings();
      if (!events || events.length === 0) fetchEvents();
    }
  }, [user, profile, bookings, events, fetchProfile, fetchBookings, fetchEvents]);

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const recentGigs = bookings?.filter(b => b.musician_id === user?.id).slice(0, 3);
  const recentPostedEvents = events?.filter(e => e.creator_id === user?.id).slice(0, 3);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🎵 Musician Dashboard</h1>
        <button
          onClick={() => {
            fetchProfile(true);
            fetchBookings(true);
            fetchEvents(true);
            fetchPublicEvents({ lat: 6.5244, lng: 3.3792 }).then(data =>
              setPublicEvents(data.slice(0, 3))
            );
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Profile + Analytics */}
      <div className="grid md:grid-cols-3 gap-6">
        <ProfileCard profile={profile} />
        <div className="md:col-span-2">
          <AnalyticsCards stats={stats} />
        </div>
      </div>

      {/* Event sections */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Uploaded Gigs */}
        <EventPreviewSection
          title="Recent Bookings"
          description="Your latest gigs"
          items={recentGigs}
          link="/musician/bookings"
          renderItem={(gig) => <MusicianEvents key={gig.id} event={gig} compact />}
        />

        {/* Posted Events */}
        <EventPreviewSection
          title="Uploaded Events"
          description="Events posted on the platform"
          items={recentPostedEvents}
          link="/musician/events"
          renderItem={(event) => (
            <div key={event.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{event.location}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(event.date).toLocaleDateString()}
              </p>
            </div>
          )}
        />

        {/* Public events */}
        <EventPreviewSection
          title="Public Events"
          description="Discover external music events"
          items={publicEvents}
          loading={loadingPublicEvents}
          link="/musician/discover"
          renderItem={(event) => <PublicEventCard key={event.id} event={event} />}
        />
      </div>
    </div>
  );
}


