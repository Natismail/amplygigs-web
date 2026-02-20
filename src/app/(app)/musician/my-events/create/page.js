//app/(app)/musician/my-events/create/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
//import { createClient } from '@supabase/supabase-js';
//import { createClient } from "@/lib/supabaseClient";
import { Calendar, MapPin, Users, DollarSign, ImagePlus } from "lucide-react";

export default function CreateMusicianEventPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
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

  const [ticketTiers, setTicketTiers] = useState([
    {
      tier_name: "Regular",
      description: "",
      price: "",
      quantity_available: "",
      max_per_order: 10,
      sale_start_date: "",
      sale_end_date: "",
    },
  ]);

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

  const addTicketTier = () => {
    setTicketTiers([
      ...ticketTiers,
      {
        tier_name: "",
        description: "",
        price: "",
        quantity_available: "",
        max_per_order: 10,
        sale_start_date: "",
        sale_end_date: "",
      },
    ]);
  };

  const removeTicketTier = (index) => {
    setTicketTiers(ticketTiers.filter((_, i) => i !== index));
  };

  const updateTicketTier = (index, field, value) => {
    const updated = [...ticketTiers];
    updated[index][field] = value;
    setTicketTiers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Calculate remaining capacity
      const totalTickets = ticketTiers.reduce(
        (sum, tier) => sum + parseInt(tier.quantity_available || 0),
        0
      );

      // Create event
      const { data: event, error: eventError } = await supabase
        .from("musician_events")
        .insert({
          organizer_id: user.id,
          ...formData,
          total_capacity: parseInt(formData.total_capacity) || totalTickets,
          remaining_capacity: totalTickets,
          status: "draft",
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create ticket tiers
      const tiersToInsert = ticketTiers.map((tier) => ({
        event_id: event.id,
        tier_name: tier.tier_name,
        description: tier.description,
        price: parseFloat(tier.price),
        quantity_available: parseInt(tier.quantity_available),
        quantity_sold: 0,
        max_per_order: tier.max_per_order,
        sale_start_date: tier.sale_start_date || new Date().toISOString(),
        sale_end_date: tier.sale_end_date || event.event_date,
      }));

      const { error: tiersError } = await supabase
        .from("ticket_tiers")
        .insert(tiersToInsert);

      if (tiersError) throw tiersError;

      alert("Event created successfully! You can now publish it.");
      router.push(`/musician/events/${event.id}`);
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Live Event
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Host your own show and sell tickets directly to fans
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event Details Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Event Details
              </h2>

              <div className="space-y-4">
                {/* Title */}
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
                    placeholder="e.g., Afrobeat Night Live"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Tell fans what to expect..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Category */}
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

                {/* Date & Time Grid */}
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

                {/* Cover Image */}
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
                    placeholder="e.g., The Shrine, Ikeja"
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
                    placeholder="Full street address"
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
                    placeholder="Maximum attendees"
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
                    {ticketTiers.length > 1 && (
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
                        placeholder="e.g., VIP, Regular, Early Bird"
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
                        placeholder="5000"
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
                        placeholder="100"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                        required
                      />
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
                        placeholder="10"
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
                        placeholder="e.g., Front row access, meet & greet"
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

            {/* Additional Details */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Additional Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Age Restriction
                  </label>
                  <select
                    value={formData.age_restriction}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        age_restriction: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">No restriction</option>
                    <option value="18">18+</option>
                    <option value="21">21+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Refund Policy
                  </label>
                  <textarea
                    value={formData.refund_policy}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        refund_policy: e.target.value,
                      })
                    }
                    placeholder="e.g., No refunds after 48 hours before event"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={formData.terms_and_conditions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        terms_and_conditions: e.target.value,
                      })
                    }
                    placeholder="Add any specific rules or requirements"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
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
                disabled={loading}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Event (Draft)"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}