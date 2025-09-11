// src/app/musician/events/page.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Image from "next/image";

// A simple component for an event card
const EventCard = ({ event, onSignifyInterest, isInterested }) => {
  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
      <h3 className="text-xl font-bold">{event.title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
      <div className="text-sm mt-2 space-y-1">
        <p><strong>Location:</strong> {event.location}</p>
        <p><strong>Proposed Amount:</strong> ${event.proposed_amount}</p>
      </div>
      {event.media_url && (
        <div className="mt-4 rounded-md w-full object-cover max-h-48 relative overflow-hidden">
          <Image
            src={event.media_url}
            alt="Event Media"
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}
      <div className="mt-4">
        {isInterested ? (
          <span className="inline-block px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded-full dark:bg-green-700 dark:text-green-100">
            ✅ Interested!
          </span>
        ) : (
          <button
            onClick={() => onSignifyInterest(event.id)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Signify Interest
          </button>
        )}
      </div>
    </div>
  );
};

export default function MusicianEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // The single, optimized function to fetch events and interest status
  const fetchEvents = async () => {
    setLoading(true);
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: allEvents, error } = await supabase
        .from("events")
        .select(`
          *,
          event_interests!inner(musician_id)
        `);

      if (error) throw error;
      
      const eventsWithInterest = allEvents.map(event => ({
        ...event,
        isInterested: event.event_interests.some(
          interest => interest.musician_id === user.id
        ),
      }));

      setEvents(eventsWithInterest);
    } catch (error) {
      console.error("Error fetching events:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const handleSignifyInterest = async (eventId) => {
    if (!user) {
      alert("You must be logged in to signify interest.");
      return;
    }
    
    // Check if the user has already signified interest
    const { data: existingInterest, error: checkError } = await supabase
      .from("event_interests")
      .select('id')
      .eq('event_id', eventId)
      .eq('musician_id', user.id)
      .single();

    if (existingInterest) {
      alert("You have already signified interest for this event.");
      return;
    }

    const { error } = await supabase
      .from("event_interests")
      .insert({
        event_id: eventId,
        musician_id: user.id,
      });

    if (error) {
      console.error("Error signifying interest:", error);
      alert("Failed to signify interest. Please try again.");
    } else {
      alert("Interest signified successfully!");
      // Update the state to reflect the change
      setEvents(prevEvents =>
        prevEvents.map(e =>
          e.id === eventId ? { ...e, isInterested: true } : e
        )
      );
    }
  };

  if (loading) {
    return <Layout><div className="p-6 text-center">Loading events...</div></Layout>;
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Explore Client Events</h1>
        {events.length === 0 ? (
          <p className="text-gray-500">No events have been posted yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSignifyInterest={handleSignifyInterest}
                isInterested={event.isInterested}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}


