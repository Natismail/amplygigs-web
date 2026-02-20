import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      event_id,
      selected_tiers,
      buyer_info,
      payment_method = 'paystack', // 'paystack' or 'stripe'
    } = body;

    // Validate
    if (!event_id || !selected_tiers || !buyer_info) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate total
    let totalAmount = 0;
    const tierIds = Object.keys(selected_tiers);

    const { data: tiers } = await supabase
      .from("ticket_tiers")
      .select("*")
      .in("id", tierIds);

    for (const tier of tiers) {
      const quantity = selected_tiers[tier.id];
      const available = tier.quantity_available - tier.quantity_sold;

      if (quantity > available) {
        return NextResponse.json(
          { success: false, error: `Not enough tickets for ${tier.tier_name}` },
          { status: 400 }
        );
      }

      totalAmount += tier.price * quantity;
    }

    const platformFee = totalAmount * 0.07; // 7% fee
    const total = totalAmount + platformFee;

    // Create or get guest buyer
    let guestBuyerId = null;
    if (buyer_info.email) {
      const { data: existingGuest } = await supabase
        .from("guest_ticket_buyers")
        .select("id")
        .eq("email", buyer_info.email)
        .single();

      if (existingGuest) {
        guestBuyerId = existingGuest.id;
      } else {
        const { data: newGuest } = await supabase
          .from("guest_ticket_buyers")
          .insert({
            email: buyer_info.email,
            phone: buyer_info.phone,
            full_name: buyer_info.full_name,
          })
          .select()
          .single();

        guestBuyerId = newGuest?.id;
      }
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("ticket_purchases")
      .insert({
        event_id,
        buyer_type: "guest",
        guest_buyer_id: guestBuyerId,
        guest_email: buyer_info.email,
        guest_phone: buyer_info.phone,
        guest_full_name: buyer_info.full_name,
        total_amount: total,
        platform_fee: platformFee,
        payment_status: "pending",
        payment_method, // NEW: Track payment method
        metadata: {
          selected_tiers: Object.entries(selected_tiers).map(([id, qty]) => ({
            tier_id: id,
            quantity: qty,
          })),
        },
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    // Return different response based on payment method
    if (payment_method === 'stripe') {
      // For Stripe, we'll create checkout session
      const { data: event } = await supabase
        .from('musician_events')
        .select('title')
        .eq('id', event_id)
        .single();

      const stripe = require('@/lib/stripe/server').stripe;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Tickets for ${event.title}`,
              },
              unit_amount: Math.round(total * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/tickets/${purchase.id}?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/live-events/${event_id}?canceled=true`,
        customer_email: buyer_info.email,
        metadata: {
          purchase_id: purchase.id,
        },
      });

      return NextResponse.json({
        success: true,
        purchase_id: purchase.id,
        payment_method: 'stripe',
        stripe_session_id: session.id,
        stripe_url: session.url,
      });
    }

    // Default: Paystack (existing flow)
    return NextResponse.json({
      success: true,
      purchase_id: purchase.id,
      payment_method: 'paystack',
      amount: total,
    });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}