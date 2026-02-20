import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { purchase_id, payment_reference, paystack_signature } = body;

    // Verify Paystack webhook signature (if from webhook)
    if (paystack_signature) {
      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(body))
        .digest("hex");

      if (hash !== paystack_signature) {
        return NextResponse.json(
          { success: false, error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Get purchase details
    const { data: purchase, error: purchaseError } = await supabase
      .from("ticket_purchases")
      .select("*, metadata")
      .eq("id", purchase_id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { success: false, error: "Purchase not found" },
        { status: 404 }
      );
    }

    // Update purchase status
    await supabase
      .from("ticket_purchases")
      .update({
        payment_status: "completed",
        payment_reference,
      })
      .eq("id", purchase_id);

    // Generate tickets
    const selected_tiers = purchase.metadata?.selected_tiers || [];

    for (const { tier_id, quantity } of selected_tiers) {
      const ticketsToCreate = [];

      for (let i = 0; i < quantity; i++) {
        const ticketCode = generateTicketCode();
        const qrCode = await generateQRCodeData(purchase_id, tier_id, i);

        ticketsToCreate.push({
          purchase_id: purchase.id,
          event_id: purchase.event_id,
          ticket_tier_id: tier_id,
          original_buyer_id: purchase.buyer_id,
          current_holder_id: purchase.buyer_id,
          ticket_code: ticketCode,
          qr_code: qrCode,
          status: "valid",
        });
      }

      await supabase.from("musician_event_tickets").insert(ticketsToCreate);

      // Update tier sold count
      const { data: tier } = await supabase
        .from("ticket_tiers")
        .select("quantity_sold")
        .eq("id", tier_id)
        .single();

      await supabase
        .from("ticket_tiers")
        .update({
          quantity_sold: tier.quantity_sold + quantity,
        })
        .eq("id", tier_id);

      // Update event remaining capacity
      await supabase.rpc("decrement_event_capacity", {
        event_id: purchase.event_id,
        decrement_by: quantity,
      });
    }

    // TODO: Send confirmation email
    // await sendTicketConfirmationEmail(purchase);

    return NextResponse.json({ success: true, data: { purchase_id } });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function generateTicketCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

async function generateQRCodeData(purchaseId, tierId, index) {
  // In production, generate actual QR code with QRCode library
  // For now, return unique identifier
  return `${purchaseId}-${tierId}-${index}`;
}