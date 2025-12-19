"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function PostEventForm({ onSuccess, onCancel }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "",
    venue: "",
    event_date: "",
    event_time: "",
    duration: "",
    expected_attendees: "",
    proposed_amount: "",
    requirements: "",
    media_file: null,
  });

  const eventTypes = [
    "Wedding", "Birthday", "Corporate Event", "Concert", 
    "Festival", "Club Night", "Private Party", "Other"
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setForm({ ...form, media_file: file });

    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    // Validate step 1
    if (currentStep === 1) {
      if (!form.title.trim() || !form.description.trim() || !form.event_type) {
        setError("Please fill in all required fields");
        return;
      }
    }
    
    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
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

    // Combine date and time
    const eventDateTime = form.event_date && form.event_time 
      ? `${form.event_date}T${form.event_time}:00`
      : null;

    const proposedAmount = form.proposed_amount
      ? parseInt(form.proposed_amount, 10)
      : null;

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
          creator_id: user.id,
          title: form.title,
          description: form.description,
          event_type: form.event_type,
          venue: form.venue,
          event_date: eventDateTime,
          duration: form.duration ? parseInt(form.duration) : null,
          expected_attendees: form.expected_attendees ? parseInt(form.expected_attendees) : null,
          proposed_amount: proposedAmount,
          requirements: form.requirements,
          media_url: mediaUrl,
          status: 'open',
        },
      ]);

      if (dbError) throw new Error(dbError.message);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);

      // Reset form
      setForm({
        title: "",
        description: "",
        event_type: "",
        venue: "",
        event_date: "",
        event_time: "",
        duration: "",
        expected_attendees: "",
        proposed_amount: "",
        requirements: "",
        media_file: null,
      });
      setMediaPreview(null);
      setCurrentStep(1);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Post a New Event</h2>
              <p className="text-purple-100 text-sm mt-1">
                Step {currentStep} of 3
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:bg-white/20 rounded-full p-2 transition"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-purple-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Success / Error Messages */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <p className="text-green-800 dark:text-green-200 font-medium">
                Event posted successfully!
              </p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 flex items-center gap-3">
              <span className="text-2xl">❌</span>
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Birthday Celebration, Corporate Dinner"
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring focus:ring-purple-200 dark:bg-gray-700 dark:text-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Event Type *
                  </label>
                  <select
                    value={form.event_type}
                    onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                    required
                  >
                    <option value="">Select event type</option>
                    {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Description *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe your event, the atmosphere you want, music style preferences..."
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring focus:ring-purple-200 dark:bg-gray-700 dark:text-white transition"
                    rows="4"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Event Details */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Venue / Location
                  </label>
                  <input
                    type="text"
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    placeholder="e.g., Oriental Hotel, Lagos"
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={form.event_date}
                      onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={form.event_time}
                      onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                      className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      placeholder="e.g., 4"
                      min="1"
                      className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Expected Attendees
                    </label>
                    <input
                      type="number"
                      value={form.expected_attendees}
                      onChange={(e) => setForm({ ...form, expected_attendees: e.target.value })}
                      placeholder="e.g., 100"
                      className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Proposed Budget (₦)
                  </label>
                  <input
                    type="number"
                    value={form.proposed_amount}
                    onChange={(e) => setForm({ ...form, proposed_amount: e.target.value })}
                    placeholder="e.g., 50000"
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This helps musicians provide appropriate quotes
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Additional Info */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Special Requirements
                  </label>
                  <textarea
                    value={form.requirements}
                    onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                    placeholder="Any specific requirements? (e.g., specific songs, equipment needs, dress code)"
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Upload Media (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Add photos or videos of the venue (max 5MB)
                  </p>
                  
                  {mediaPreview && (
                    <div className="mt-4 relative">
                      {form.media_file?.type.startsWith("image") ? (
                        <Image 
                          src={mediaPreview} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-xl" 
                          width={800} 
                          height={450} 
                        />
                      ) : (
                        <video 
                          src={mediaPreview} 
                          controls 
                          className="w-full h-48 rounded-xl" 
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ ...form, media_file: null });
                          setMediaPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  ← Back
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition shadow-lg"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Posting...
                    </span>
                  ) : (
                    "Post Event"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}