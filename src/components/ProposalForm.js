// src/components/ProposalForm.js
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function ProposalForm({ musicianId }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [form, setForm] = useState({
    message: "",
    proposed_amount: "",
    event_time: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!user) {
      setError("You must be logged in to send a proposal.");
      setLoading(false);
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from("proposals")
        .insert({
          client_id: user.id,
          musician_id: musicianId,
          message: form.message,
          proposed_amount: parseInt(form.proposed_amount),
          event_time: form.event_time,
        });

      if (dbError) throw dbError;

      setSuccess(true);
      setForm({
        message: "",
        proposed_amount: "",
        event_time: "",
      });

    } catch (err) {
      setError(err.message);
      console.error("Error sending proposal:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner mt-6">
      <h2 className="text-2xl font-bold mb-4">Send a Direct Proposal</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">✅ Proposal sent successfully!</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="message" className="block text-sm font-medium">Message</label>
          <textarea
            id="message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            rows="4"
            required
          ></textarea>
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium">Proposed Amount</label>
          <input
            type="number"
            id="amount"
            value={form.proposed_amount}
            onChange={(e) => setForm({ ...form, proposed_amount: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium">Event Time</label>
          <input
            type="datetime-local"
            id="time"
            value={form.event_time}
            onChange={(e) => setForm({ ...form, event_time: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Proposal"}
        </button>
      </form>
    </div>
  );
}