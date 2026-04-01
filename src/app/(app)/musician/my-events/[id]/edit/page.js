// src/app/(app)/musician/my-events/[id]/edit/page.js
// FIXES:
//   1. loadEvent() uses direct Supabase query (avoids server auth session mismatch)
//   2. ticket_tiers field names corrected: name, total_quantity, sold_quantity
//   3. handleSubmit update goes directly to Supabase too

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Calendar, MapPin, DollarSign, ImagePlus, Save, X } from "lucide-react";

const toInt   = (v) => (v === "" || v == null) ? null : parseInt(v);
const toFloat = (v) => (v === "" || v == null) ? null : parseFloat(v);

export default function EditEventPage() {
  const params   = useParams();
  const router   = useRouter();
  const { user } = useAuth();

  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError,     setImageError]     = useState(null);

  const [formData, setFormData] = useState({
    title: "", description: "", category: "concert",
    event_date: "", doors_open_time: "", event_end_time: "",
    venue_name: "", venue_address: "", city: "Lagos", state: "Lagos",
    cover_image_url: "", total_capacity: "", age_restriction: "",
    refund_policy: "", terms_and_conditions: "",
  });

  const [ticketTiers, setTicketTiers] = useState([]);

  useEffect(() => {
    if (user && params.id) loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id]);

  async function loadEvent() {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data: event, error } = await supabase
        .from("musician_events")
        .select(`*, ticket_tiers(id, name, description, price, total_quantity, sold_quantity, max_per_order)`)
        .eq("id", params.id)
        .single();

      if (error) throw error;

      if (event.organizer_id !== user.id) {
        alert("Unauthorized");
        router.push("/musician/my-events");
        return;
      }

      setFormData({
        title:                event.title              || "",
        description:          event.description        || "",
        category:             event.category           || "concert",
        event_date:           event.event_date         ? new Date(event.event_date).toISOString().slice(0,16)         : "",
        doors_open_time:      event.doors_open_time    ? new Date(event.doors_open_time).toISOString().slice(0,16)    : "",
        event_end_time:       event.event_end_time     ? new Date(event.event_end_time).toISOString().slice(0,16)     : "",
        venue_name:           event.venue_name         || "",
        venue_address:        event.venue_address      || "",
        city:                 event.city               || "Lagos",
        state:                event.state              || "Lagos",
        cover_image_url:      event.cover_image_url    || "",
        total_capacity:       event.total_capacity     ?? "",
        age_restriction:      event.age_restriction    ?? "",
        refund_policy:        event.refund_policy      || "",
        terms_and_conditions: event.terms_and_conditions || "",
      });

      // ✅ Map DB field names to form-friendly shape
      setTicketTiers(
        (event.ticket_tiers || []).map(t => ({
          id:                 t.id,
          name:               t.name             || "",   // DB column is "name"
          description:        t.description      || "",
          price:              t.price            ?? "",
          total_quantity:     t.total_quantity   ?? "",   // DB column
          sold_quantity:      t.sold_quantity    ?? 0,    // DB column
          max_per_order:      t.max_per_order    ?? 10,
        }))
      );
    } catch (err) {
      console.error("Error loading event:", err);
      alert("Failed to load event: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    setImageError(null);
    try {
      const supabase = createClient();
      const ext      = file.name.split(".").pop().toLowerCase();
      const filePath = `event-covers/${user.id}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("musician-events").upload(filePath, file);
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from("musician-events").getPublicUrl(filePath);
      setFormData(p => ({ ...p, cover_image_url: publicUrl }));
    } catch (err) {
      setImageError(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const updateTier  = (i, field, value) => {
    setTicketTiers(prev => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });
  };
  const addTier     = () => setTicketTiers(p => [...p, { name: "", description: "", price: "", total_quantity: "", sold_quantity: 0, max_per_order: 10 }]);
  const removeTier  = (i) => setTicketTiers(p => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    try {
      // Update event — explicit fields only, no updated_at (trigger handles it)
      const { error: evtErr } = await supabase
        .from("musician_events")
        .update({
          title:                formData.title,
          description:          formData.description          || null,
          category:             formData.category,
          event_date:           formData.event_date,
          doors_open_time:      formData.doors_open_time      || null,
          event_end_time:       formData.event_end_time       || null,
          venue_name:           formData.venue_name,
          venue_address:        formData.venue_address,
          city:                 formData.city,
          state:                formData.state,
          cover_image_url:      formData.cover_image_url      || null,
          total_capacity:       toInt(formData.total_capacity),
          age_restriction:      toInt(formData.age_restriction),
          refund_policy:        formData.refund_policy        || null,
          terms_and_conditions: formData.terms_and_conditions || null,
        })
        .eq("id", params.id);

      if (evtErr) throw evtErr;

      // Update existing tiers
      for (const tier of ticketTiers.filter(t => t.id)) {
        const { error: tErr } = await supabase
          .from("ticket_tiers")
          .update({
            name:           tier.name,
            description:    tier.description  || null,
            price:          toFloat(tier.price),
            total_quantity: toInt(tier.total_quantity),
            max_per_order:  toInt(tier.max_per_order) || 10,
          })
          .eq("id", tier.id);
        if (tErr) console.error("Tier update error:", tErr);
      }

      // Insert new tiers
      const newTiers = ticketTiers.filter(t => !t.id);
      if (newTiers.length > 0) {
        const { error: nErr } = await supabase.from("ticket_tiers").insert(
          newTiers.map(t => ({
            event_id:       params.id,
            name:           t.name,
            description:    t.description || null,
            price:          toFloat(t.price),
            total_quantity: toInt(t.total_quantity),
            sold_quantity:  0,
            max_per_order:  toInt(t.max_per_order) || 10,
          }))
        );
        if (nErr) console.error("New tier error:", nErr);
      }

      alert("Event updated successfully!");
      router.push(`/musician/my-events/${params.id}`);
    } catch (err) {
      console.error("Error updating event:", err);
      alert("Failed to update event: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600" />
    </div>
  );

  const inputCls = "w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white";
  const smallCls = "w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Edit Event</h1>
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Event Details */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />Event Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Title *</label>
                  <input type="text" value={formData.title} required className={inputCls}
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea value={formData.description} rows={4} className={inputCls}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Type *</label>
                  <select value={formData.category} required className={inputCls}
                    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                    <option value="concert">Concert</option>
                    <option value="festival">Festival</option>
                    <option value="club_night">Club Night</option>
                    <option value="private_show">Private Show</option>
                    <option value="corporate">Corporate Event</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Event Date *", key: "event_date",     req: true },
                    { label: "Doors Open",   key: "doors_open_time", req: false },
                    { label: "Event Ends",   key: "event_end_time",  req: false },
                  ].map(({ label, key, req }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
                      <input type="datetime-local" value={formData[key]} required={req} className={inputCls}
                        onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                {/* Cover image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cover Image</label>
                  <div className="flex items-center gap-4">
                    {formData.cover_image_url
                      ? <img src={formData.cover_image_url} alt="Cover" className="w-32 h-32 object-cover rounded-lg" />
                      : <div className="w-32 h-32 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center"><ImagePlus className="w-8 h-8 text-gray-400" /></div>
                    }
                    <div>
                      <label className={`cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition ${uploadingImage ? "opacity-50" : ""}`}>
                        {uploadingImage ? "Uploading..." : "Change Image"}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                      </label>
                      {imageError && <p className="text-sm text-red-600 mt-1">{imageError}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Venue */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />Venue
              </h2>
              <div className="space-y-4">
                {[
                  { label: "Venue Name *",    key: "venue_name",    req: true },
                  { label: "Venue Address *", key: "venue_address", req: true },
                ].map(({ label, key, req }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
                    <input type="text" value={formData[key]} required={req} className={inputCls}
                      onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  {["city", "state"].map(key => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">{key} *</label>
                      <input type="text" value={formData[key]} required className={inputCls}
                        onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Capacity</label>
                  <input type="number" value={formData.total_capacity} className={inputCls}
                    onChange={e => setFormData(p => ({ ...p, total_capacity: e.target.value }))} />
                </div>
              </div>
            </section>

            {/* Ticket Tiers */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />Ticket Tiers
              </h2>
              {ticketTiers.map((tier, i) => (
                <div key={i} className="mb-6 p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Tier {i + 1}</h3>
                    {ticketTiers.length > 1 && !(tier.sold_quantity > 0) && (
                      <button type="button" onClick={() => removeTier(i)} className="text-red-600 hover:text-red-700 text-sm">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tier Name *</label>
                      {/* ✅ Uses tier.name (DB column name) */}
                      <input type="text" value={tier.name} required className={smallCls}
                        onChange={e => updateTier(i, "name", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price (₦) *</label>
                      <input type="number" value={tier.price} required className={smallCls}
                        onChange={e => updateTier(i, "price", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity Available *</label>
                      {/* ✅ Uses tier.total_quantity */}
                      <input type="number" value={tier.total_quantity} required className={smallCls}
                        disabled={tier.sold_quantity > 0}
                        onChange={e => updateTier(i, "total_quantity", e.target.value)} />
                      {tier.sold_quantity > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{tier.sold_quantity} tickets already sold</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Per Order</label>
                      <input type="number" value={tier.max_per_order} className={smallCls}
                        onChange={e => updateTier(i, "max_per_order", e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <input type="text" value={tier.description} className={smallCls}
                        onChange={e => updateTier(i, "description", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addTier}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 transition">
                + Add Ticket Tier
              </button>
            </section>

            {/* Submit */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
              <button type="button" onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
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

