import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("ticket_purchases")
      .select(
        `
        *,
        event:musician_events(*),
        tickets:musician_event_tickets(*)
      `
      )
      .eq("id", params.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching purchase:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 404 }
    );
  }
}