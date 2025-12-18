"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function PostEventForm({ onSuccess, onCancel }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    proposed_amount: "",
    media_file: null,
  });

  // Handle file change & preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm({ ...form, media_file: file });

    // Preview for images/videos
    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!user) {
      setError("You must be logged in to post an event.");
      setLoading(false);
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      setLoading(false);
      return;
    }

    const proposedAmount = form.proposed_amount
      ? parseInt(form.proposed_amount, 10)
      : null;
    if (form.proposed_amount && isNaN(proposedAmount)) {
      setError("Proposed amount must be a valid number.");
      setLoading(false);
      return;
    }

    try {
      let mediaUrl = null;
      if (form.media_file) {
        const file = form.media_file;
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("event-media")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw new Error("Failed to upload file.");

        const { data } = supabase.storage.from("event-media").getPublicUrl(filePath);
        mediaUrl = data.publicUrl;
      }

      const { error: dbError } = await supabase.from("events").insert([
        {
          client_id: user.id,
          title: form.title,
          description: form.description,
          venue: form.location,
          proposed_amount: proposedAmount,
          media_url: mediaUrl,
        },
      ]);

      if (dbError) throw new Error(dbError.message);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);

      setForm({
        title: "",
        description: "",
        location: "",
        proposed_amount: "",
        media_file: null,
      });
      setMediaPreview(null);

      onSuccess?.();
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-8 bg-black/50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg sm:max-w-xl lg:max-w-2xl rounded-lg shadow-xl relative p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4">Post a New Event</h2>

        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Success / Error Messages */}
        {success && (
          <p className="bg-green-100 text-green-800 p-2 rounded mb-4 text-center">
            ✅ Event posted successfully!
          </p>
        )}
        {error && (
          <p className="bg-red-100 text-red-800 p-2 rounded mb-4 text-center">
            ❌ {error}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium">Event Title *</label>
            <input
              type="text"
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium">Description *</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
              rows="3"
              required
            ></textarea>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium">Location</label>
            <input
              type="text"
              id="location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium">Proposed Amount</label>
            <input
              type="number"
              id="amount"
              value={form.proposed_amount}
              onChange={(e) => setForm({ ...form, proposed_amount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label htmlFor="media" className="block text-sm font-medium">Upload Media</label>
            <input
              type="file"
              id="media"
              accept="image/*,video/*"
              capture="user"
              onChange={handleFileChange}
              className="mt-1 block w-full"
            />
            {mediaPreview && (
              <div className="mt-2">
                {form.media_file.type.startsWith("image") ? (
                  <Image src={mediaPreview} alt="Preview" className="max-h-48 rounded-md" width={800}  height={450} />
                ) : (
                  <video src={mediaPreview} controls className="max-h-48 rounded-md" />
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-800 text-white px-4 py-2 rounded-md hover:bg-purple-900 disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post Event"}
          </button>
        </form>
      </div>
    </div>
  );
}

