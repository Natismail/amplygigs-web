import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get ticket
    const { data: ticket } = await supabase
      .from("musician_event_tickets")
      .select("*, event:musician_events(organizer_id)")
      .eq("ticket_code", params.ticketCode)
      .single();

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Verify user is event organizer or authorized staff
    if (ticket.event.organizer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Not authorized to check in tickets" },
        { status: 403 }
      );
    }

    // Check if already checked in
    if (ticket.checked_in) {
      return NextResponse.json(
        {
          success: false,
          error: "Ticket already checked in",
          checked_in_at: ticket.checked_in_at,
        },
        { status: 400 }
      );
    }

    // Check in ticket
    const { data, error } = await supabase
      .from("musician_event_tickets")
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
      })
      .eq("ticket_code", params.ticketCode)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error checking in ticket:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}