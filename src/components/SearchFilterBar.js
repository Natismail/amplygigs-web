"use client";
import { useState } from "react";

export default function SearchFilterBar({ filters, setFilters }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Location */}
        <input
          type="text"
          placeholder="Location"
          value={filters.location}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, location: e.target.value }))
          }
          className="border rounded-lg px-3 py-2"
        />

        {/* Genre */}
        <select
          multiple
          value={filters.genres}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              genres: [...e.target.selectedOptions].map(o => o.value),
            }))
          }
          className="border rounded-lg px-3 py-2"
        >
          <option value="Afrobeats">Afrobeats</option>
          <option value="Jazz">Jazz</option>
          <option value="Hip Hop">Hip Hop</option>
          <option value="Gospel">Gospel</option>
          <option value="Pop">Pop</option>
        </select>

        {/* Availability */}
        <select
          value={filters.availability}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, availability: e.target.value }))
          }
          className="border rounded-lg px-3 py-2"
        >
          <option value="">Any Availability</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="unavailable">Unavailable</option>
        </select>

        {/* Rating */}
        <select
          value={filters.rating}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, rating: Number(e.target.value) }))
          }
          className="border rounded-lg px-3 py-2"
        >
          <option value={0}>Any Rating</option>
          <option value={3}>3★+</option>
          <option value={4}>4★+</option>
          <option value={5}>5★</option>
        </select>

      </div>
    </div>
  );
}
