// src/app/(app)/musician/discover/page.js (KEEP AS IS - PUBLIC EVENTS)
"use client";

import { useEffect, useState } from "react";
import { fetchPublicEvents } from "@/lib/google/fetchPublicEvents";
import PublicEventCard from "@/components/events/PublicEventCard";
import { MapPin, Calendar, TrendingUp } from "lucide-react";

export default function MusicianDiscoverPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({ lat: 6.5244, lng: 3.3792 }); // Lagos default

  useEffect(() => {
    loadEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadEvents() {
    setLoading(true);
    const data = await fetchPublicEvents(location);
    setEvents(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🌍 Discover Public Events
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore music events happening around you from Google Events
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading events...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Public Events Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Check back later for events in your area
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Found {events.length} public events
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <PublicEventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}




// //src/app/(app)/musician/discover

// "use client";

// import { useEffect, useState } from "react";
// import { fetchPublicEvents } from "@/lib/google/fetchPublicEvents";
// import PublicEventCard from "@/components/events/PublicEventCard";

// export default function MusicianDiscoverPage() {
//   const [events, setEvents] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadEvents();
//   }, []);

//   async function loadEvents() {
//     setLoading(true);
//     const data = await fetchPublicEvents({
//       lat: 6.5244,
//       lng: 3.3792,
//     });
//     setEvents(data);
//     setLoading(false);
//   }

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h1 className="text-2xl font-bold mb-2">🌍 Discover Public Events</h1>
//       <p className="text-gray-600 mb-6">
//         Explore music events happening around you.
//       </p>

//       {loading ? (
//         <p>Loading events...</p>
//       ) : events.length === 0 ? (
//         <p className="text-gray-500">No public events found.</p>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {events.map((event) => (
//             <PublicEventCard key={event.id} event={event} />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
