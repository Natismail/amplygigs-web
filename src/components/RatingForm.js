// src/components/RatingForm.js
"use client";

import { useState } from "react";
import { Star, Loader, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function RatingForm({ musicianId, onSuccess }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError("Please login to submit a rating");
      return;
    }

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musician_id: musicianId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit rating");
      }

      setSuccess(true);
      setRating(0);
      setComment("");
      
      // Call onSuccess callback
      onSuccess?.();

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
        <Star className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Login to leave a review for this musician
        </p>
        <a
          href="/login"
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
        >
          Login to Review
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl p-6 text-center">
        <CheckCircle className="w-12 h-12 mx-auto text-green-600 dark:text-green-400 mb-3" />
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
          Thank You!
        </h3>
        <p className="text-green-700 dark:text-green-300">
          Your review has been submitted successfully
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Rating *
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={`w-10 h-10 ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </p>
        )}
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Review (Optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this musician..."
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Help others by sharing specific details about your experience
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {comment.length}/500
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
      </button>
    </form>
  );
}