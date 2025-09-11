// src/app/events/[id]/page.js
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import MapTracking from "@/components/MapTracking";
import Layout from "@/components/Layout";
import MusicianCard from "@/components/MusicianCard";
import Image from "next/image";

export default function EventDetailsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [interestedMusicians, setInterestedMusicians] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEventAndInterestedMusicians() {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          event_interests (
            musician_id,
            user_profiles ( id, name, bio, youtube, socials, available )
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching event details:", error?.message);
        setEvent(null);
      } else {
        // Set the main event data
        setEvent(data);
        // Extract and set the interested musicians data from the nested join
        const musicians = data.event_interests.map(interest => interest.user_profiles);
        setInterestedMusicians(musicians);
      }
      setLoading(false);
    }
    fetchEventAndInterestedMusicians();
  }, [id]);

  if (loading) {
    return <Layout><div className="p-6 text-center">Loading event...</div></Layout>;
  }

  if (!event) {
    return <Layout><p className="p-6 text-red-500">Event not found.</p></Layout>;
  }

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p>{event.description}</p>
        <p>
          <strong>Venue:</strong> {event.venue}
        </p>
        <p>
          <strong>Start:</strong> {new Date(event.start_time).toLocaleString()}
        </p>
        <p>
          <strong>End:</strong> {event.end_time ? new Date(event.end_time).toLocaleString() : "N/A"}
        </p>
        {event.media_url && (
          <Image
            src={event.media_url}
            alt="Event Media"
            className="mt-4 rounded-md w-full object-cover max-h-64"
          />
        )}

        <MapTracking />

        <div className="pt-8">
          <h2 className="text-2xl font-bold mb-4">Interested Musicians</h2>
          {interestedMusicians.length === 0 ? (
            <p className="text-gray-500">No musicians have shown interest yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interestedMusicians.map((musician) => (
                <MusicianCard key={musician.id} musician={musician} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}