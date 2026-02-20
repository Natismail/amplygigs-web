import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const userId = searchParams.get("user_id");

    if (!email && !userId) {
      return NextResponse.json(
        { success: false, error: "Email or user ID required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("ticket_purchases")
      .select(
        `
        *,
        event:musician_events(*),
        tickets:musician_event_tickets(*)
      `
      )
      .eq("payment_status", "completed")
      .order("created_at", { ascending: false });

    if (email) {
      query = query.eq("guest_email", email);
    } else if (userId) {
      query = query.eq("buyer_id", userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}