// src/app/(app)/live-events/[id]/page.js
// FIXES:
//   1. Currency: all ₦ symbols replaced with formatCurrency(amount, event.currency || 'NGN')
//   2. ticket_tiers field names: total_quantity, sold_quantity, name (not tier_name)
//   3. Organizer fields: first_name+last_name, profile_picture_url (not full_name/avatar_url)
//   4. Removed hardcoded /1600 USD conversion — event has one currency, display it consistently
//   5. createClient() moved inside functions to avoid multiple instances warning

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { formatCurrency, getCurrencyByCode } from "@/components/CurrencySelector";
import {
  Calendar, MapPin, Clock, Users, Share2,
  Heart, ChevronLeft, CheckCircle,
} from "lucide-react";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [event,         setEvent]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [purchasing,    setPurchasing]    = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [selectedTiers, setSelectedTiers] = useState({});
  const [buyerInfo,     setBuyerInfo]     = useState({ full_name: "", email: "", phone: "" });
  const [showCheckout,  setShowCheckout]  = useState(false);

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function loadEvent() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("musician_events")
        .select(`
          *,
          organizer:user_profiles!organizer_id(
            id,
            first_name, last_name, display_name,
            profile_picture_url, avatar_url,
            bio
          ),
          ticket_tiers(
            id, name, description, price,
            total_quantity, sold_quantity, max_per_order,
            sales_start_date, sales_end_date
          )
        `)
        .eq("id", params.id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (err) {
      console.error("Error loading event:", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Tier quantity controls ────────────────────────────────────────────────
  const updateTierQuantity = (tierId, quantity) => {
    if (quantity === 0) {
      const updated = { ...selectedTiers };
      delete updated[tierId];
      setSelectedTiers(updated);
    } else {
      setSelectedTiers(prev => ({ ...prev, [tierId]: quantity }));
    }
  };

  // ✅ Uses correct field names: total_quantity, sold_quantity
  const getTierAvailable = (tier) =>
    Math.max(0, (tier.total_quantity || 0) - (tier.sold_quantity || 0));

  const getTotalAmount = () => {
    if (!event) return 0;
    return Object.entries(selectedTiers).reduce((total, [tierId, qty]) => {
      const tier = event.ticket_tiers?.find(t => t.id === tierId);
      return total + (tier ? tier.price * qty : 0);
    }, 0);
  };

  const getTotalTickets = () =>
    Object.values(selectedTiers).reduce((sum, qty) => sum + qty, 0);

  // ── Currency helpers ─────────────────────────────────────────────────────
  // ✅ Dynamic — reads event.currency, falls back to NGN
  const eventCurrency = event?.currency || "NGN";
  const fmt           = (amount) => formatCurrency(amount, eventCurrency);
  const platformFee   = getTotalAmount() * 0.07;
  const grandTotal    = getTotalAmount() * 1.07;

  // ── Organizer display ────────────────────────────────────────────────────
  const org          = event?.organizer;
  const orgName      = org?.display_name || `${org?.first_name || ""} ${org?.last_name || ""}`.trim() || "Artist";
  const orgPhoto     = org?.profile_picture_url || org?.avatar_url;

  // ── Purchase ─────────────────────────────────────────────────────────────
  const handlePurchase = async (e) => {
    e.preventDefault();
    setPurchasing(true);

    try {
      const response = await fetch("/api/ticket-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id:       event.id,
          selected_tiers: selectedTiers,
          buyer_info:     buyerInfo,
          payment_method: paymentMethod,
          currency:       eventCurrency,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      if (paymentMethod === "stripe") {
        window.location.href = result.stripe_url;
      } else {
        const paystackHandler = window.PaystackPop.setup({
          key:      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email:    buyerInfo.email,
          amount:   result.amount * 100, // kobo
          currency: eventCurrency,
          ref:      result.purchase_id,
          callback: () => { window.location.href = `/tickets/${result.purchase_id}`; },
          onClose:  () => { setPurchasing(false); },
        });
        paystackHandler.openIframe();
      }
    } catch (err) {
      console.error("Purchase error:", err);
      alert("Failed to initiate purchase: " + err.message);
      setPurchasing(false);
    }
  };

  // ── Formatters ────────────────────────────────────────────────────────────
  const formatDate = (d) => new Date(d).toLocaleDateString("en-NG", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const formatTime = (d) => new Date(d).toLocaleTimeString("en-NG", {
    hour: "2-digit", minute: "2-digit",
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600" />
    </div>
  );

  if (!event) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event Not Found</h2>
        <button onClick={() => router.push("/live-events")} className="text-purple-600 hover:underline">
          Browse all events
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Sticky nav */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
            <ChevronLeft className="w-5 h-5" />Back
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-72 sm:h-96 bg-gradient-to-br from-purple-500 to-pink-500">
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-32 h-32 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-24 sm:-mt-32 relative z-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

          {/* Main */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 sm:p-8">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium rounded-full mb-3">
                  {event.category?.replace("_", " ").toUpperCase()}
                </span>
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">{event.title}</h1>

                {/* ✅ Organizer with correct field names */}
                <div className="flex items-center gap-3">
                  {orgPhoto ? (
                    <img src={orgPhoto} alt={orgName} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-500 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{orgName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Event Organizer</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{formatDate(event.event_date)}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(event.event_date)}
                      {event.doors_open_time && ` (Doors open at ${formatTime(event.doors_open_time)})`}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{event.venue_name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {event.venue_address}, {event.city}, {event.state}
                    </div>
                  </div>
                </div>
                {event.total_capacity && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Capacity: {event.total_capacity.toLocaleString()} people
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {event.remaining_capacity} tickets remaining
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {event.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About This Event</h2>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{event.description}</p>
                </div>
              )}

              {(event.refund_policy || event.terms_and_conditions) && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6 space-y-4">
                  {event.refund_policy && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Refund Policy</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{event.refund_policy}</p>
                    </div>
                  )}
                  {event.terms_and_conditions && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Terms & Conditions</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{event.terms_and_conditions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ticket sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 lg:sticky lg:top-24">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Select Tickets</h2>

              {event.ticket_tiers?.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {event.ticket_tiers.map(tier => {
                    // ✅ Correct field names
                    const available = getTierAvailable(tier);
                    const selected  = selectedTiers[tier.id] || 0;

                    return (
                      <div key={tier.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            {/* ✅ tier.name not tier.tier_name */}
                            <h3 className="font-semibold text-gray-900 dark:text-white">{tier.name}</h3>
                            {tier.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tier.description}</p>
                            )}
                          </div>
                          {/* ✅ Dynamic currency */}
                          <div className="text-xl font-bold text-gray-900 dark:text-white ml-3 flex-shrink-0">
                            {fmt(tier.price)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {available > 0 ? `${available} available` : "Sold out"}
                          </div>
                          {available > 0 && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateTierQuantity(tier.id, Math.max(0, selected - 1))}
                                disabled={selected === 0}
                                className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-40">
                                −
                              </button>
                              <span className="w-8 text-center font-medium text-gray-900 dark:text-white">{selected}</span>
                              <button
                                onClick={() => updateTierQuantity(tier.id, Math.min(available, tier.max_per_order || 10, selected + 1))}
                                disabled={selected >= available || selected >= (tier.max_per_order || 10)}
                                className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-40">
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No tickets available</div>
              )}

              {getTotalTickets() > 0 && (
                <>
                  {/* ✅ All amounts use dynamic currency */}
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal ({getTotalTickets()} tickets)</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{fmt(getTotalAmount())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Platform fee (7%)</span>
                      <span className="text-gray-900 dark:text-white">{fmt(platformFee)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-800 pt-4 mb-6">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-purple-600">{fmt(grandTotal)}</span>
                  </div>
                  <button onClick={() => setShowCheckout(true)}
                    className="w-full py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition">
                    Proceed to Checkout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Complete Your Purchase</h2>

            <form onSubmit={handlePurchase} className="space-y-4">

              {/* Payment method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "paystack", label: "Paystack", sub: `Pay in ${eventCurrency}` },
                    { id: "stripe",   label: "Stripe",   sub: "International Cards" },
                  ].map(({ id, label, sub }) => (
                    <button key={id} type="button" onClick={() => setPaymentMethod(id)}
                      className={`px-4 py-3 border-2 rounded-lg font-medium transition ${
                        paymentMethod === id
                          ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                          : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      }`}>
                      <div className="text-sm font-semibold">{label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Buyer info */}
              {[
                { label: "Full Name *",     key: "full_name", type: "text",  placeholder: "Your full name" },
                { label: "Email *",         key: "email",     type: "email", placeholder: "your@email.com", note: "Tickets will be sent here" },
                { label: "Phone Number *",  key: "phone",     type: "tel",   placeholder: "+234 800 000 0000" },
              ].map(({ label, key, type, placeholder, note }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
                  <input type={type} value={buyerInfo[key]} placeholder={placeholder} required
                    onChange={e => setBuyerInfo(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white" />
                  {note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{note}</p>}
                </div>
              ))}

              {/* ✅ Price summary — all dynamic currency */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{getTotalTickets()} ticket(s)</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{fmt(getTotalAmount())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Platform fee (7%)</span>
                  <span className="text-gray-900 dark:text-white">{fmt(platformFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-purple-200 dark:border-purple-800 pt-2">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-purple-600">{fmt(grandTotal)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCheckout(false)} disabled={purchasing}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={purchasing}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-semibold">
                  {purchasing ? "Processing..." : `Pay with ${paymentMethod === "stripe" ? "Stripe" : "Paystack"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


