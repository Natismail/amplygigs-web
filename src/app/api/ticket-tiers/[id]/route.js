import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify ownership through event
    const { data: tier } = await supabase
      .from("ticket_tiers")
      .select("event_id, musician_events(organizer_id)")
      .eq("id", params.id)
      .single();

    if (!tier || tier.musician_events?.organizer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("ticket_tiers")
      .update(body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating ticket tier:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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

    // Verify ownership and check if any tickets sold
    const { data: tier } = await supabase
      .from("ticket_tiers")
      .select("event_id, quantity_sold, musician_events(organizer_id)")
      .eq("id", params.id)
      .single();

    if (!tier || tier.musician_events?.organizer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    if (tier.quantity_sold > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete tier with sold tickets" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("ticket_tiers")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket tier:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}