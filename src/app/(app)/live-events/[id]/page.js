// app/(app)/live-events/[id]/page.js

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Share2,
  Heart,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paystack'); // Add state

  // Checkout state
  const [selectedTiers, setSelectedTiers] = useState({}); // {tierId: quantity}
  const [buyerInfo, setBuyerInfo] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function loadEvent() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("musician_events")
        .select(
          `
          *,
          organizer:user_profiles!organizer_id(
            id,
            full_name,
            avatar_url,
            stage_name,
            bio
          ),
          ticket_tiers(*)
        `
        )
        .eq("id", params.id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error("Error loading event:", error);
    } finally {
      setLoading(false);
    }
  }

  const updateTierQuantity = (tierId, quantity) => {
    if (quantity === 0) {
      const updated = { ...selectedTiers };
      delete updated[tierId];
      setSelectedTiers(updated);
    } else {
      setSelectedTiers({ ...selectedTiers, [tierId]: quantity });
    }
  };

  const getTotalAmount = () => {
    if (!event) return 0;
    return Object.entries(selectedTiers).reduce((total, [tierId, quantity]) => {
      const tier = event.ticket_tiers.find((t) => t.id === tierId);
      return total + (tier ? tier.price * quantity : 0);
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTiers).reduce((sum, qty) => sum + qty, 0);
  };

  // const handlePurchase = async (e) => {
  //   e.preventDefault();
  //   setPurchasing(true);

  //   try {
  //     // Create ticket purchase record
  //     const purchaseData = {
  //       event_id: event.id,
  //       buyer_type: "guest",
  //       guest_email: buyerInfo.email,
  //       guest_phone: buyerInfo.phone,
  //       guest_full_name: buyerInfo.full_name,
  //       total_amount: getTotalAmount(),
  //       platform_fee: getTotalAmount() * 0.07, // 7% platform fee
  //       payment_status: "pending",
  //     };

  //     const { data: purchase, error: purchaseError } = await supabase
  //       .from("ticket_purchases")
  //       .insert(purchaseData)
  //       .select()
  //       .single();

  //     if (purchaseError) throw purchaseError;

  //     // Initialize Paystack payment
  //     const paystackHandler = window.PaystackPop.setup({
  //       key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  //       email: buyerInfo.email,
  //       amount: getTotalAmount() * 100, // Convert to kobo
  //       currency: "NGN",
  //       ref: purchase.id,
  //       metadata: {
  //         custom_fields: [
  //           {
  //             display_name: "Event",
  //             variable_name: "event_name",
  //             value: event.title,
  //           },
  //           {
  //             display_name: "Buyer Name",
  //             variable_name: "buyer_name",
  //             value: buyerInfo.full_name,
  //           },
  //         ],
  //       },
  //       callback: async function (response) {
  //         // Payment successful
  //         await handlePaymentSuccess(purchase.id, response.reference);
  //       },
  //       onClose: function () {
  //         setPurchasing(false);
  //       },
  //     });

  //     paystackHandler.openIframe();
  //   } catch (error) {
  //     console.error("Purchase error:", error);
  //     alert("Failed to initiate purchase: " + error.message);
  //     setPurchasing(false);
  //   }
  // };

  // Update handlePurchase
const handlePurchase = async (e) => {
  e.preventDefault();
  setPurchasing(true);

  try {
    const response = await fetch("/api/ticket-purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: event.id,
        selected_tiers: selectedTiers,
        buyer_info: buyerInfo,
        payment_method: paymentMethod, // NEW
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    if (paymentMethod === 'stripe') {
      // Redirect to Stripe Checkout
      window.location.href = result.stripe_url;
    } else {
      // Use Paystack (existing flow)
      const paystackHandler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: buyerInfo.email,
        amount: result.amount * 100,
        currency: "NGN",
        ref: result.purchase_id,
        callback: function (response) {
          window.location.href = `/tickets/${result.purchase_id}`;
        },
        onClose: function () {
          setPurchasing(false);
        },
      });

      paystackHandler.openIframe();
    }
  } catch (error) {
    console.error("Purchase error:", error);
    alert("Failed to initiate purchase: " + error.message);
    setPurchasing(false);
  }
};


  const handlePaymentSuccess = async (purchaseId, paymentReference) => {
    try {
      // Update purchase status
      await supabase
        .from("ticket_purchases")
        .update({
          payment_status: "completed",
          payment_reference: paymentReference,
        })
        .eq("id", purchaseId);

      // Generate tickets
      for (const [tierId, quantity] of Object.entries(selectedTiers)) {
        const ticketsToCreate = [];
        for (let i = 0; i < quantity; i++) {
          ticketsToCreate.push({
            purchase_id: purchaseId,
            event_id: event.id,
            ticket_tier_id: tierId,
            original_buyer_id: null, // Guest purchase
            ticket_code: generateTicketCode(),
            qr_code: await generateQRCode(purchaseId, tierId, i),
          });
        }

        await supabase.from("musician_event_tickets").insert(ticketsToCreate);

        // Update tier sold count
        const tier = event.ticket_tiers.find((t) => t.id === tierId);
        await supabase
          .from("ticket_tiers")
          .update({
            quantity_sold: tier.quantity_sold + quantity,
          })
          .eq("id", tierId);
      }

      // Send confirmation email (would integrate with email service)
      // await sendTicketConfirmationEmail(buyerInfo.email, purchaseId);

      router.push(`/tickets/${purchaseId}`);
    } catch (error) {
      console.error("Error finalizing purchase:", error);
      alert("Payment successful but ticket generation failed. Please contact support.");
    }
  };

  const generateTicketCode = () => {
    return `TKT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  };

  const generateQRCode = async (purchaseId, tierId, index) => {
    // In production, you'd generate actual QR code data
    // For now, return a unique identifier
    return `${purchaseId}-${tierId}-${index}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NG", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Event Not Found
          </h2>
          <button
            onClick={() => router.push("/events")}
            className="text-purple-600 hover:underline"
          >
            Browse all events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-96 bg-gradient-to-br from-purple-500 to-pink-500">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-32 h-32 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
              {/* Event Title */}
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium rounded-full mb-3">
                  {event.category.replace("_", " ").toUpperCase()}
                </span>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {event.title}
                </h1>

                {/* Organizer */}
                <div className="flex items-center gap-3">
                  {event.organizer?.avatar_url ? (
                    <img
                      src={event.organizer.avatar_url}
                      alt={event.organizer.stage_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-500"></div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {event.organizer?.stage_name ||
                        event.organizer?.full_name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Event Organizer
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Info */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatDate(event.event_date)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(event.event_date)}
                      {event.doors_open_time &&
                        ` (Doors open at ${formatTime(event.doors_open_time)})`}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {event.venue_name}
                    </div>
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
                        Capacity: {event.total_capacity} people
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {event.remaining_capacity} tickets remaining
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    About This Event
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Terms & Refund Policy */}
              {(event.refund_policy || event.terms_and_conditions) && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  {event.refund_policy && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Refund Policy
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {event.refund_policy}
                      </p>
                    </div>
                  )}

                  {event.terms_and_conditions && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Terms & Conditions
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {event.terms_and_conditions}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ticket Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Select Tickets
              </h2>

              {event.ticket_tiers && event.ticket_tiers.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {event.ticket_tiers.map((tier) => {
                    const available =
                      tier.quantity_available - tier.quantity_sold;
                    const selected = selectedTiers[tier.id] || 0;

                    return (
                      <div
                        key={tier.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {tier.tier_name}
                            </h3>
                            {tier.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {tier.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              ₦{tier.price.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {available > 0
                              ? `${available} available`
                              : "Sold out"}
                          </div>

                          {available > 0 && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateTierQuantity(tier.id, Math.max(0, selected - 1))
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                disabled={selected === 0}
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                                {selected}
                              </span>
                              <button
                                onClick={() =>
                                  updateTierQuantity(
                                    tier.id,
                                    Math.min(
                                      available,
                                      tier.max_per_order,
                                      selected + 1
                                    )
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                disabled={
                                  selected >= available ||
                                  selected >= tier.max_per_order
                                }
                              >
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
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No tickets available
                </div>
              )}

              {getTotalTickets() > 0 && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Subtotal ({getTotalTickets()} tickets)
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₦{getTotalAmount().toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Platform fee (7%)
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        ₦{(getTotalAmount() * 0.07).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-purple-600">
                        ₦{(getTotalAmount() * 1.07).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
                  >
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
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Complete Your Purchase
      </h2>

      <form onSubmit={handlePurchase} className="space-y-4">
        {/* ✅ PAYMENT METHOD SELECTOR - NOW INSIDE THE FORM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment Method
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('paystack')}
              className={`flex-1 px-4 py-3 border-2 rounded-lg font-medium transition ${
                paymentMethod === 'paystack'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                  : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">Paystack</span>
                <span className="text-xs">Pay in Naira (NGN)</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('stripe')}
              className={`flex-1 px-4 py-3 border-2 rounded-lg font-medium transition ${
                paymentMethod === 'stripe'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                  : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">Stripe</span>
                <span className="text-xs">International Cards</span>
              </div>
            </button>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={buyerInfo.full_name}
            onChange={(e) =>
              setBuyerInfo({ ...buyerInfo, full_name: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={buyerInfo.email}
            onChange={(e) =>
              setBuyerInfo({ ...buyerInfo, email: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Your tickets will be sent to this email
          </p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={buyerInfo.phone}
            onChange={(e) =>
              setBuyerInfo({ ...buyerInfo, phone: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            placeholder="+234 800 000 0000"
            required
          />
        </div>

        {/* Price Summary */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              {getTotalTickets()} ticket(s)
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {paymentMethod === 'stripe' ? '$' : '₦'}
              {paymentMethod === 'stripe' 
                ? (getTotalAmount() / 1600).toFixed(2) // Approx USD conversion
                : getTotalAmount().toLocaleString()
              }
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              Platform fee (7%)
            </span>
            <span className="text-gray-900 dark:text-white">
              {paymentMethod === 'stripe' ? '$' : '₦'}
              {paymentMethod === 'stripe'
                ? ((getTotalAmount() * 0.07) / 1600).toFixed(2)
                : (getTotalAmount() * 0.07).toLocaleString()
              }
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-purple-200 dark:border-purple-800 pt-2">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-purple-600">
              {paymentMethod === 'stripe' ? '$' : '₦'}
              {paymentMethod === 'stripe'
                ? ((getTotalAmount() * 1.07) / 1600).toFixed(2)
                : (getTotalAmount() * 1.07).toLocaleString()
              }
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => setShowCheckout(false)}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            disabled={purchasing}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={purchasing}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {purchasing ? "Processing..." : `Pay with ${paymentMethod === 'stripe' ? 'Stripe' : 'Paystack'}`}
          </button>
        </div>
      </form>
    </div>
  </div>
      )}
    </div>
  );
}