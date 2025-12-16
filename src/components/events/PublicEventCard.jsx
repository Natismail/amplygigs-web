"use client";

import Image from "next/image";
import { Calendar, MapPin, ExternalLink } from "lucide-react";

export default function PublicEventCard({ event }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="relative h-40">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-bold text-lg">{event.title}</h3>

        <p className="text-sm text-gray-500">{event.venue}</p>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          {new Date(event.date).toLocaleString()}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          {event.location}
        </div>

        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(
            event.title + " " + event.location
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm mt-2"
        >
          View Source <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
