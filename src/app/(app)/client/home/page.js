"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import MusicianCard from "@/components/MusicianCard";
import PostEventForm from "@/components/PostEventForm";
import SearchFilterBar from "@/components/SearchFilterBar";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ClientHome() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [view, setView] = useState("events"); // events | musicians
  const [musicians, setMusicians] = useState([]);
  const [clientEvents, setClientEvents] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);

  const [filters, setFilters] = useState({
    genres: [],
    location: "",
    availability: "",
    rating: 0,
  });

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    if (!user) return;

    supabase
      .from("user_profiles")
      .select("*")
      .eq("role", "MUSICIAN")
      .then(({ data }) => setMusicians(data || []));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("events")
      .select("*, event_interests(musician_id)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setClientEvents(data || []));
  }, [user]);

  if (loading) return <div className="p-6">Loading...</div>;

  /* ---------------- FILTER LOGIC ---------------- */

  const filteredMusicians = musicians.filter((m) => {
    if (
      filters.genres.length &&
      !filters.genres.some((g) => m.genres?.includes(g))
    )
      return false;

    if (
      filters.location &&
      !m.location?.toLowerCase().includes(filters.location.toLowerCase())
    )
      return false;

    if (filters.availability && m.availability !== filters.availability)
      return false;

    if (filters.rating && (m.average_rating || 0) < filters.rating)
      return false;

    return true;
  });

  const filteredEvents = clientEvents.filter((e) => {
    if (
      filters.genres.length &&
      !filters.genres.some((g) => e.required_genres?.includes(g))
    )
      return false;

    if (
      filters.location &&
      !e.location?.toLowerCase().includes(filters.location.toLowerCase())
    )
      return false;

    return true;
  });

  /* ---------------- UI ---------------- */

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Client Dashboard</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setView("events")}
            className={`px-4 py-2 rounded ${
              view === "events" ? "bg-purple-700 text-white" : "bg-gray-200"
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setView("musicians")}
            className={`px-4 py-2 rounded ${
              view === "musicians" ? "bg-purple-700 text-white" : "bg-gray-200"
            }`}
          >
            Musicians
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <SearchFilterBar filters={filters} setFilters={setFilters} />

      {/* EVENTS VIEW */}
      {view === "events" && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setShowPostForm(true)}
              className="bg-purple-800 text-white px-4 py-2 rounded"
            >
              ➕ Post Event
            </button>
          </div>

          {filteredEvents.length === 0 ? (
            <p className="text-gray-500">No events found.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <h3 className="font-bold">{event.title}</h3>
                  <p className="text-sm">{event.description}</p>
                  <p className="text-sm">Location: {event.location}</p>

                  {event.media_url && (
                    <Image
                      src={event.media_url}
                      alt="Event"
                      width={400}
                      height={200}
                      className="rounded mt-2"
                    />
                  )}

                  <p className="text-xs mt-2">
                    Interested Musicians: {event.event_interests.length}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MUSICIANS VIEW */}
      {view === "musicians" && (
        <>
          {filteredMusicians.length === 0 ? (
            <p className="text-gray-500">No musicians match your filters.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {filteredMusicians.map((m) => (
                <MusicianCard key={m.id} musician={m} />
              ))}
            </div>
          )}
        </>
      )}

      {/* POST EVENT MODAL */}
      {showPostForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <PostEventForm
            onSuccess={() => {
              setShowPostForm(false);
              router.refresh();
            }}
            onCancel={() => setShowPostForm(false)}
          />
        </div>
      )}
    </div>
  );
}



// // src/app/client/page.js
// "use client";
// import Image from "next/image";
// import { useState, useEffect } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import { useAuth } from "@/context/AuthContext";
// import MusicianCard from "@/components/MusicianCard";
// import PostEventForm from "@/components/PostEventForm";
// //import Layout from "@/components/Layout";
// import { useRouter } from "next/navigation";

// export default function ClientHome() {
//   const { user, loading } = useAuth();
//   const [musicians, setMusicians] = useState([]);
//   const [clientEvents, setClientEvents] = useState([]);
//   const [showPostForm, setShowPostForm] = useState(false);
//   const router = useRouter();

//   // Fetch all available musicians
//   useEffect(() => {
//     async function fetchMusicians() {
//       if (!loading && user) {
//         const { data, error } = await supabase
//           .from("user_profiles")
//           .select("id, name, bio, youtube, socials, available")
//           .eq("role", "MUSICIAN");

//         if (error) {
//           console.error("Error fetching musicians:", error.message);
//         } else {
//           setMusicians(data);
//         }
//       }
//     }
//     fetchMusicians();
//   }, [loading, user]);

//   // Fetch the current client's events
//   useEffect(() => {
//     async function fetchClientEvents() {
//       if (user) {
//         const { data, error } = await supabase
//           .from("events")
//           .select("*, event_interests(musician_id)")
//           .eq("client_id", user.id)
//           .order("created_at", { ascending: false });

//         if (error) {
//           console.error("Error fetching client events:", error.message);
//         } else {
//           setClientEvents(data);
//         }
//       }
//     }
//     fetchClientEvents();
//   }, [user]);

//   if (loading) {
//     return <div className="text-center p-6">Loading...</div>;
//   }

//   return (
//     <>
//       <div className="p-6 dark:text-white -mt-8">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-xl font-bold">🎵 Your Posted Events</h1>
//           <button
//             onClick={() => setShowPostForm(true)}
//             disabled={loading} // This is the key change
//             className="bg-purple-800 text-white px-4 py-2 rounded hover:bg-purple-900 disabled:opacity-50"
//           >
//             ➕ Post Event
//           </button>
//         </div>

//         {/* Display client's events */}
//         {clientEvents.length === 0 ? (
//           <p className="text-gray-500 mb-8">You have not posted any events yet.</p>
//         ) : (
//           <div className="mb-8 space-y-4 space-x-4 grid sm:grid-cols-1 md:grid-cols-4 lg:grid-cols-4 px-4">
//             {clientEvents.map((event) => (
//               <div key={event.id} className="p-4 border rounded-lg shadow-sm">
//                 <h3 className="text-lg font-bold">{event.title}</h3>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
//                 <p className="text-sm">Location: {event.location}</p>
//                 <p className="text-sm">Proposed Amount: ${event.proposed_amount}</p>
//                 {event.media_url && (
//                   <Image src={event.media_url} alt="Event Media" className="mt-2 rounded-md max-h-64 object-cover" width={800}
//             height={450} />
//                 )}
//                 <div className="mt-2 text-sm text-gray-500">
//                   {event.event_interests.length > 0
//                     ? `Interested Musicians: ${event.event_interests.length}`
//                     : "No musicians have shown interest yet."}
//                 </div>
//                 <a href={`/events/${event.id}`} className="text-blue-500 hover:underline mt-2 inline-block">
//                   View Details
//                 </a>
//               </div>
//             ))}
//           </div>
//         )}

//         <h1 className="text-xl font-bold mb-4">🎵 Find Musicians</h1>
//         {musicians.length === 0 ? (
//           <p className="text-gray-500">No musicians found.</p>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {musicians.map((m) => (
//               <MusicianCard key={m.id} musician={m} />
//             ))}
//           </div>
//         )}
//       </div>

//       {showPostForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="relative w-full max-w-xl mx-4">
//             <PostEventForm
//               onSuccess={() => {
//                 alert("✅ Event posted successfully!");
//                 setShowPostForm(false);
//                 router.refresh();
//               }}
//               onCancel={() => setShowPostForm(false)}
//             />
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

