//app/(app)/musician/my-events/[id]/edit/page.js

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  MapPin,
  DollarSign,
  ImagePlus,
  Save,
  X,
} from "lucide-react";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "concert",
    event_date: "",
    doors_open_time: "",
    event_end_time: "",
    venue_name: "",
    venue_address: "",
    city: "Lagos",
    state: "Lagos",
    cover_image_url: "",
    total_capacity: "",
    age_restriction: "",
    refund_policy: "",
    terms_and_conditions: "",
  });

  const [ticketTiers, setTicketTiers] = useState([]);

  useEffect(() => {
    if (user && params.id) {
      loadEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id]);

  async function loadEvent() {
    setLoading(true);
    try {
      const response = await fetch(`/api/musician-events/${params.id}`);
      const result = await response.json();

      if (result.success) {
        const event = result.data;

        // Verify ownership
        if (event.organizer_id !== user.id) {
          alert("Unauthorized");
          router.push("/musician/my-events");
          return;
        }

        // Format dates for datetime-local input
        setFormData({
          title: event.title || "",
          description: event.description || "",
          category: event.category || "concert",
          event_date: event.event_date
            ? new Date(event.event_date).toISOString().slice(0, 16)
            : "",
          doors_open_time: event.doors_open_time
            ? new Date(event.doors_open_time).toISOString().slice(0, 16)
            : "",
          event_end_time: event.event_end_time
            ? new Date(event.event_end_time).toISOString().slice(0, 16)
            : "",
          venue_name: event.venue_name || "",
          venue_address: event.venue_address || "",
          city: event.city || "Lagos",
          state: event.state || "Lagos",
          cover_image_url: event.cover_image_url || "",
          total_capacity: event.total_capacity || "",
          age_restriction: event.age_restriction || "",
          refund_policy: event.refund_policy || "",
          terms_and_conditions: event.terms_and_conditions || "",
        });

        setTicketTiers(event.ticket_tiers || []);
      }
    } catch (error) {
      console.error("Error loading event:", error);
      alert("Failed to load event");
    } finally {
      setLoading(false);
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `event-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("event-images").getPublicUrl(filePath);

      setFormData({ ...formData, cover_image_url: publicUrl });
    } catch (error) {
      alert("Error uploading image: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const updateTicketTier = (index, field, value) => {
    const updated = [...ticketTiers];
    updated[index][field] = value;
    setTicketTiers(updated);
  };

  const addTicketTier = () => {
    setTicketTiers([
      ...ticketTiers,
      {
        tier_name: "",
        description: "",
        price: "",
        quantity_available: "",
        max_per_order: 10,
      },
    ]);
  };

  const removeTicketTier = (index) => {
    setTicketTiers(ticketTiers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update event
      const response = await fetch(`/api/musician-events/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update ticket tiers (delete old, insert new - simplified approach)
      // In production, you'd want to update existing tiers individually
      const tiersToUpdate = ticketTiers.filter((t) => t.id);
      const tiersToCreate = ticketTiers.filter((t) => !t.id);

      // Update existing tiers
      for (const tier of tiersToUpdate) {
        await fetch(`/api/ticket-tiers/${tier.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier_name: tier.tier_name,
            description: tier.description,
            price: parseFloat(tier.price),
            quantity_available: parseInt(tier.quantity_available),
            max_per_order: tier.max_per_order,
          }),
        });
      }

      // Create new tiers
      if (tiersToCreate.length > 0) {
        await fetch("/api/ticket-tiers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: params.id,
            tiers: tiersToCreate,
          }),
        });
      }

      alert("Event updated successfully!");
      router.push(`/musician/my-events/${params.id}`);
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Event
            </h1>
            <button
              onClick={() => router.back()}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event Details Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Event Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Type *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    required
                  >
                    <option value="concert">Concert</option>
                    <option value="festival">Festival</option>
                    <option value="club_night">Club Night</option>
                    <option value="private_show">Private Show</option>
                    <option value="corporate">Corporate Event</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) =>
                        setFormData({ ...formData, event_date: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Doors Open
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.doors_open_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          doors_open_time: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Ends
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.event_end_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          event_end_time: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Cover Image
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.cover_image_url ? (
                      <img
                        src={formData.cover_image_url}
                        alt="Event cover"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <ImagePlus className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <label className="cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* Venue Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Venue Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    value={formData.venue_name}
                    onChange={(e) =>
                      setFormData({ ...formData, venue_name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venue Address *
                  </label>
                  <input
                    type="text"
                    value={formData.venue_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        venue_address: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.total_capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_capacity: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </section>

            {/* Ticket Tiers Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Ticket Tiers
              </h2>

              {ticketTiers.map((tier, index) => (
                <div
                  key={index}
                  className="mb-6 p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Tier {index + 1}
                    </h3>
                    {ticketTiers.length > 1 && !tier.quantity_sold && (
                      <button
                        type="button"
                        onClick={() => removeTicketTier(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tier Name *
                      </label>
                      <input
                        type="text"
                        value={tier.tier_name}
                        onChange={(e) =>
                          updateTicketTier(index, "tier_name", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Price (₦) *
                      </label>
                      <input
                        type="number"
                        value={tier.price}
                        onChange={(e) =>
                          updateTicketTier(index, "price", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quantity Available *
                      </label>
                      <input
                        type="number"
                        value={tier.quantity_available}
                        onChange={(e) =>
                          updateTicketTier(
                            index,
                            "quantity_available",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                        required
                        disabled={tier.quantity_sold > 0}
                      />
                      {tier.quantity_sold > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {tier.quantity_sold} tickets already sold
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Per Order
                      </label>
                      <input
                        type="number"
                        value={tier.max_per_order}
                        onChange={(e) =>
                          updateTicketTier(
                            index,
                            "max_per_order",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={tier.description}
                        onChange={(e) =>
                          updateTicketTier(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addTicketTier}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 transition"
              >
                + Add Another Ticket Tier
              </button>
            </section>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}