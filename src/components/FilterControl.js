// src/components/FilterControl.js
"use client";
import { useState } from "react";

export default function FilterControl({ onChange, type = "musician" }) {
  const [filters, setFilters] = useState({
    location: "",
    rating: 0,
    experience: "",
    gadgets: "",
    date: "",
    price: ""
  });

  const handleChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onChange?.(updated);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md grid grid-cols-2 md:grid-cols-3 gap-4">
      {type === "musician" && (
        <>
          <input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => handleChange("location", e.target.value)}
            className="p-2 border rounded"
          />
          <select
            value={filters.rating}
            onChange={(e) => handleChange("rating", e.target.value)}
            className="p-2 border rounded"
          >
            <option value="0">All Ratings</option>
            <option value="4">4⭐ & up</option>
            <option value="3">3⭐ & up</option>
          </select>
          <input
            type="text"
            placeholder="Experience (e.g. 5yrs)"
            value={filters.experience}
            onChange={(e) => handleChange("experience", e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Gadgets (e.g. Guitar)"
            value={filters.gadgets}
            onChange={(e) => handleChange("gadgets", e.target.value)}
            className="p-2 border rounded"
          />
        </>
      )}

      {type === "gig" && (
        <>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => handleChange("location", e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.price}
            onChange={(e) => handleChange("price", e.target.value)}
            className="p-2 border rounded"
          />
        </>
      )}
    </div>
  );
}
