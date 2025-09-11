// src/hooks/useRatings.js
"use client";
import { useState } from "react";

export function useRatings() {
  const [loading, setLoading] = useState(false);

  const submitRating = async (musician_id, user_id, rating, comment) => {
    try {
      setLoading(true);
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musician_id, user_id, rating, comment }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    } catch (err) {
      console.error("submitRating error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { submitRating, loading };
}
