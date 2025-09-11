// src/components/MusicianEvents.js
"use client";
import { useEffect, useState } from "react";

export default function MusicianEvents() {
  const [talentBridgeEvents, setTalentBridgeEvents] = useState([]);
  const [externalEvents, setExternalEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [res1, res2] = await Promise.all([
          fetch("/api/events").then((r) => r.json()),
          fetch("/api/external-events").then((r) => r.json()),
        ]);
        setTalentBridgeEvents(res1.events || []);
        setExternalEvents(res2.events || []);
      } catch (err) {
        console.error("Error loading events:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="p-6">Loading events…</p>;

  const EventCard = ({ evt }) => (
    <div className="p-4 border rounded-xl shadow bg-white dark:bg-gray-900 space-y-2 hover:shadow-md transition">
      <h3 className="text-lg font-bold">{evt.title}</h3>
      {evt.description && <p className="text-sm text-gray-600 dark:text-gray-400">{evt.description}</p>}
      <p className="text-sm font-medium">📍 {evt.venue || "TBA"}</p>
      <p className="text-sm">🗓 {new Date(evt.start_time).toLocaleString()}</p>
      {evt.end_time && <p className="text-xs text-gray-500">Ends: {new Date(evt.end_time).toLocaleString()}</p>}

      {/* Primary link */}
      {evt.link && (
        <a
          href={evt.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-blue-600 hover:underline"
        >
          More Info
        </a>
      )}

      {/* Media links array */}
      {evt.media_links?.length > 0 && (
        <div className="mt-3">
          <p className="font-medium">Media Links:</p>
          <ul className="list-disc ml-5 space-y-1">
            {evt.media_links.map((link, idx) => (
              <li key={idx}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline break-words"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-10 dark:text-white">
      {/* AmplyGigs Events */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">🎵 AmplyGigs Events</h2>
        {talentBridgeEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {talentBridgeEvents.map((evt) => (
              <EventCard key={evt.id} evt={evt} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No internal events yet.</p>
        )}
      </section>

      {/* External Public Events */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">🌍 Public Live Events</h2>
        {externalEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {externalEvents.map((evt) => (
              <EventCard key={evt.id} evt={evt} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No external events available.</p>
        )}
      </section>
    </div>
  );
}



