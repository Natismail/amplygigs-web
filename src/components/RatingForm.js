// src/components/RatingForm.js
"use client";
import { useState } from "react";
import { FaStar } from "react-icons/fa";

export default function RatingForm({ musicianId, userId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musician_id: musicianId,
          user_id: userId,
          rating,
          comment,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit rating");

      const saved = await res.json();
      if (onSuccess) onSuccess(saved);
      setRating(0);
      setComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md"
    >
      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => {
          const value = i + 1;
          return (
            <FaStar
              key={value}
              size={28}
              className={`cursor-pointer transition ${
                value <= (hover || rating)
                  ? "text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              }`}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
            />
          );
        })}
      </div>
      <textarea
        className="w-full border rounded-md p-2 text-sm text-gray-700 dark:bg-gray-900 dark:text-white"
        rows="3"
        placeholder="Leave a comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button
        type="submit"
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        disabled={rating === 0 || loading}
      >
        {loading ? "Submitting..." : "Submit Rating"}
      </button>
    </form>
  );
}
