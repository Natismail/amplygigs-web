import { NextResponse } from "next/server";
import { stripe, verifyStripeWebhook } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    // Verify webhook
    const event = verifyStripeWebhook(body, signature);

    const supabase = createClient();

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        const purchaseId = session.metadata.purchase_id;

        // Update purchase status
        await supabase
          .from("ticket_purchases")
          .update({
            payment_status: "completed",
            payment_reference: session.payment_intent,
          })
          .eq("id", purchaseId);

        // Generate tickets (same logic as Paystack)
        await generateTickets(purchaseId);

        break;

      case "payment_intent.payment_failed":
        const failedIntent = event.data.object;
        const failedPurchaseId = failedIntent.metadata.purchase_id;

        await supabase
          .from("ticket_purchases")
          .update({ payment_status: "failed" })
          .eq("id", failedPurchaseId);

        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

async function generateTickets(purchaseId) {
  const supabase = createClient();

  // Get purchase details
  const { data: purchase } = await supabase
    .from("ticket_purchases")
    .select("*, event:musician_events(*)")
    .eq("id", purchaseId)
    .single();

  if (!purchase) return;

  const selectedTiers = purchase.metadata?.selected_tiers || [];

  // Generate tickets
  const ticketsToCreate = [];
  for (const { tier_id, quantity } of selectedTiers) {
    for (let i = 0; i < quantity; i++) {
      ticketsToCreate.push({
        purchase_id: purchaseId,
        event_id: purchase.event_id,
        ticket_tier_id: tier_id,
        ticket_code: `TKT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        qr_code: `${purchaseId}-${tier_id}-${i}`,
      });
    }
  }

  await supabase.from("musician_event_tickets").insert(ticketsToCreate);

  // Update tier sold count
  for (const { tier_id, quantity } of selectedTiers) {
    await supabase.rpc("increment_tier_sold", {
      tier_id,
      increment_by: quantity,
    });
  }

  // Send email (integrate with your email service)
  // await sendTicketEmail(purchase.guest_email, ticketsToCreate);
}