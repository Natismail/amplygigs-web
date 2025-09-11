// Path: src/components/MusicianOfferView.js

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// This component receives the specific gig details as a prop
export default function MusicianOfferView({ gig }) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState("");

  // This function is triggered when the musician clicks the "Accept" button
  const handleAcceptAndTrack = () => {
    // 1. First, check if the browser supports geolocation
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser or device.");
      return;
    }

    // 2. Update the UI to show the offer has been accepted
    setIsAccepted(true);
    setIsTracking(true);

    // TODO: You would also update your database here to mark the gig as 'accepted'
    // await supabase.from('gigs').update({ status: 'accepted' }).eq('id', gig.id);

    console.log(`Starting location tracking for gig: ${gig.id}`);

    // 3. Start watching the position
    navigator.geolocation.watchPosition(
      (position) => {
        // This function runs every time the location updates
        const { latitude, longitude } = position.coords;

        // 4. Create the Supabase channel for this specific gig's tracking
        const channel = supabase.channel(`gig-${gig.id}-tracking`);

        // 5. Send the location payload over the channel
        channel.send({
          type: "broadcast",
          event: "musician-location",
          payload: { lat: latitude, lng: longitude },
        });
      },
      (err) => {
        // Handle errors, like the user denying permission
        setError(`Location access denied: ${err.message}`);
        setIsTracking(false);
      },
      {
        // Options for high accuracy, useful for tracking
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-2">New Gig Offer!</h2>
      <p><strong>Event:</strong> {gig.eventName}</p>
      <p><strong>Date:</strong> {new Date(gig.date).toLocaleDateString()}</p>
      <p className="font-bold text-lg mt-2">Agreed Fee: ₦{gig.amount.toLocaleString()}</p>

      <div className="mt-4 flex gap-4">
        {!isAccepted ? (
          <>
            <button
              onClick={handleAcceptAndTrack}
              className="bg-green-600 text-white font-bold px-6 py-2 rounded hover:bg-green-700"
            >
              Accept Offer & Start Tracking
            </button>
            <button className="bg-red-600 text-white font-bold px-6 py-2 rounded hover:bg-red-700">
              Decline
            </button>
          </>
        ) : (
          <p className="font-bold text-green-600">
            {isTracking ? "✅ Offer accepted! Live location tracking is active." : "Offer accepted!"}
          </p>
        )}
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}