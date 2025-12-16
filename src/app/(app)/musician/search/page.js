"use client";
import { useState } from "react";
import MusicianCard from "@/components/MusicianCard";

export default function MusicianSearch() {
  const [query, setQuery] = useState("");
  const musicians = [
    { id: 1, name: "DJ Mike", role: "DJ" },
    { id: 2, name: "Sarah Keys", role: "Pianist" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Search Musicians</h1>
      <input
        type="text"
        placeholder="Search..."
        className="border p-2 w-full mb-4 rounded"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {musicians
          .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
          .map((m) => (
            <MusicianCard key={m.id} musician={m} />
          ))}
      </div>
    </div>
  );
}
