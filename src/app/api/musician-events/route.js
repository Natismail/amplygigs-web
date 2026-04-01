// src/app/api/musician-events/route.js
// FIX: createClient() is now async (Next.js 15) — must be awaited everywhere.

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city         = searchParams.get("city");
    const category     = searchParams.get("category");
    const status       = searchParams.get("status") || "published";
    const organizerId  = searchParams.get("organizer_id");

    const supabase = await createClient(); // ✅ await added

    let query = supabase
      .from("musician_events")
      .select(`
        *,
        ticket_tiers (
          id,
          name,
          description,
          price,
          total_quantity,
          sold_quantity,
          max_per_order
        )
      `)
      .order("event_date", { ascending: true });

    // status filter — "all" means no filter
    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (city)        query = query.eq("city",          city);
    if (category)    query = query.eq("category",      category);
    if (organizerId) query = query.eq("organizer_id",  organizerId);

    // Public listing: only show future published events
    if (!organizerId && status === "published") {
      query = query.gte("event_date", new Date().toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching musician events:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient(); // ✅ await added

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { data: event, error: eventError } = await supabase
      .from("musician_events")
      .insert({
        organizer_id:         user.id,
        title:                body.title,
        description:          body.description,
        category:             body.category,
        event_date:           body.event_date,
        doors_open_time:      body.doors_open_time   || null,
        event_end_time:       body.event_end_time    || null,
        venue_name:           body.venue_name,
        venue_address:        body.venue_address,
        city:                 body.city,
        state:                body.state,
        cover_image_url:      body.cover_image_url   || null,
        total_capacity:       body.total_capacity    || null,
        remaining_capacity:   body.total_capacity    || null,
        age_restriction:      body.age_restriction   || null,
        refund_policy:        body.refund_policy     || null,
        terms_and_conditions: body.terms_and_conditions || null,
        status:               "draft",
      })
      .select()
      .single();

    if (eventError) throw eventError;

    if (body.ticket_tiers?.length > 0) {
      const tiersToInsert = body.ticket_tiers.map((tier, index) => ({
        event_id:         event.id,
        name:             tier.tier_name,
        description:      tier.description,
        price:            parseFloat(tier.price),
        total_quantity:   parseInt(tier.total_quantity),
        sold_quantity:    0,
        max_per_order:    tier.max_per_order || 10,
        tier_order:       index,
        sales_start_date: tier.sales_start_date || new Date().toISOString(),
        sales_end_date:   tier.sales_end_date   || event.event_date,
      }));

      const { error: tiersError } = await supabase
        .from("ticket_tiers")
        .insert(tiersToInsert);

      if (tiersError) throw tiersError;
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


