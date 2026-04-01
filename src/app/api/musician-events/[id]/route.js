// src/app/api/musician-events/[id]/route.js
// FIXES:
//   1. All handlers: createClient() → await createClient()
//   2. PATCH: strip updated_at from body before update (trigger manages it)

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const supabase = await createClient(); // ✅

    const { data, error } = await supabase
      .from("musician_events")
      .select(`
        *,
        ticket_tiers (
          id, name, description, price,
          total_quantity, sold_quantity, max_per_order,
          sales_start_date, sales_end_date
        )
      `)
      .eq("id", params.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 404 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient(); // ✅

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: event } = await supabase
      .from("musician_events")
      .select("organizer_id")
      .eq("id", params.id)
      .single();

    if (!event || event.organizer_id !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // ✅ Strip updated_at — the DB trigger manages it, sending it causes conflicts
    const { updated_at, ...safeBody } = body;

    const { data, error } = await supabase
      .from("musician_events")
      .update(safeBody)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient(); // ✅

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: event } = await supabase
      .from("musician_events")
      .select("organizer_id")
      .eq("id", params.id)
      .single();

    if (!event || event.organizer_id !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("musician_events")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}