import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
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

    const { event_id, tiers } = body;

    // Verify event ownership
    const { data: event } = await supabase
      .from("musician_events")
      .select("organizer_id")
      .eq("id", event_id)
      .single();

    if (!event || event.organizer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Insert tiers
    const tiersToInsert = tiers.map((tier, index) => ({
      event_id,
      tier_name: tier.tier_name,
      description: tier.description,
      price: parseFloat(tier.price),
      quantity_available: parseInt(tier.quantity_available),
      quantity_sold: 0,
      max_per_order: tier.max_per_order || 10,
      tier_order: index,
      sale_start_date: tier.sale_start_date || new Date().toISOString(),
      sale_end_date: tier.sale_end_date,
    }));

    const { data, error } = await supabase
      .from("ticket_tiers")
      .insert(tiersToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating ticket tiers:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}