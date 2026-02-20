import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("musician_event_tickets")
      .select(
        `
        *,
        purchase:ticket_purchases(*),
        event:musician_events(*),
        tier:ticket_tiers(*)
      `
      )
      .eq("ticket_code", params.ticketCode)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 404 }
    );
  }
}