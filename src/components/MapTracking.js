"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function MapTracking({ gigId }) {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Subscribe to location updates
    const channel = supabase
      .channel(`gig-${gigId}-tracking`)
      .on("broadcast", { event: "musician-location" }, (payload) => {
        setLocation(payload.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gigId]);

  return (
    <div className="border rounded h-96 flex items-center justify-center bg-gray-100 relative">
      {location ? (
        <p className="text-gray-700">
          🎵 Musician is at: Lat {location.lat}, Lng {location.lng}
        </p>
      ) : (
        <p className="text-gray-500">Waiting for musician location...</p>
      )}
    </div>
  );
}
