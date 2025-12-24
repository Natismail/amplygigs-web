// src/components/ProposalForm.js - FULLY OPTIMIZED
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { 
  Send, 
  Loader, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Calendar,
  Clock,
  FileText,
  X
} from "lucide-react";

export default function ProposalForm({ musicianId, onSuccess, onCancel }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    message: "",
    proposed_amount: "",
    event_date: "",
    event_time: "",
    duration: "",
    event_type: "",
    venue: "",
  });

  const eventTypes = [
    "Wedding", "Birthday", "Corporate Event", "Concert", 
    "Festival", "Club Night", "Private Party", "Other"
  ];

  const validateForm = () => {
    if (!form.message.trim()) {
      setError("Please write a message");
      return false;
    }
    if (!form.proposed_amount || form.proposed_amount <= 0) {
      setError("Please enter a valid amount");
      return false;
    }
    if (!form.event_date) {
      setError("Please select an event date");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!user) {
      setError("You must be logged in to send a proposal.");
      setLoading(false);
      return;
    }

    try {
      // Combine date and time
      const eventDateTime = form.event_time 
        ? `${form.event_date}T${form.event_time}:00`
        : form.event_date;

      const { error: dbError } = await supabase
        .from("proposals")
        .insert({
          client_id: user.id,
          musician_id: musicianId,
          message: form.message,
          proposed_amount: parseFloat(form.proposed_amount),
          event_date: eventDateTime,
          duration: form.duration ? parseInt(form.duration) : null,
          event_type: form.event_type,
          venue: form.venue,
          status: 'pending',
        });

      if (dbError) throw dbError;

      setSuccess(true);
      
      // Reset form
      setForm({
        message: "",
        proposed_amount: "",
        event_date: "",
        event_time: "",
        duration: "",
        event_type: "",
        venue: "",
      });

      // Call success callback after short delay
      setTimeout(() => {
        onSuccess?.();
      }, 2000);

    } catch (err) {
      setError(err.message);
      console.error("Error sending proposal:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset form
      setForm({
        message: "",
        proposed_amount: "",
        event_date: "",
        event_time: "",
        duration: "",
        event_type: "",
        venue: "",
      });
      setError(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Send Proposal</h2>
            <p className="text-purple-100 text-sm mt-1">
              Share your event details and budget
            </p>
          </div>
          {onCancel && (
            <button
              onClick={handleCancel}
              className="text-white hover:bg-white/20 rounded-full p-2 transition"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 max-h-[70vh] overflow-y-auto">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-700 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fadeIn">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="text-green-800 dark:text-green-200 font-semibold">
                Proposal sent successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                The musician will receive your proposal and respond soon.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-700 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Event Type */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              <FileText className="w-4 h-4" />
              Event Type
            </label>
            <select
              value={form.event_type}
              onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base transition"
            >
              <option value="">Select event type (optional)</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              <FileText className="w-4 h-4" />
              Your Message *
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell the musician about your event, your vision, music preferences, and any special requirements..."
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none text-base transition"
              rows={5}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {form.message.length}/500 characters
            </p>
          </div>

          {/* Event Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4" />
                Event Date *
              </label>
              <input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base transition"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                <Clock className="w-4 h-4" />
                Start Time
              </label>
              <input
                type="time"
                value={form.event_time}
                onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base transition"
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Venue / Location
            </label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="e.g., Oriental Hotel, Lagos"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base transition"
            />
          </div>

          {/* Duration & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                <Clock className="w-4 h-4" />
                Duration (hours)
              </label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g., 4"
                min="1"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base transition"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                <DollarSign className="w-4 h-4" />
                Proposed Budget (₦) *
              </label>
              <input
                type="number"
                value={form.proposed_amount}
                onChange={(e) => setForm({ ...form, proposed_amount: e.target.value })}
                placeholder="e.g., 50000"
                min="1"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base transition"
                required
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> Be specific about your event details and budget. 
              This helps the musician provide you with the best service and accurate quote.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Proposal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}