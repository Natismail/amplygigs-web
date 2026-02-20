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

    // Verify ownership
    const { data: event } = await supabase
      .from("musician_events")
      .select("organizer_id, title, ticket_tiers(id)")
      .eq("id", params.id)
      .single();

    if (!event || event.organizer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Validation: Must have at least one ticket tier
    if (!event.ticket_tiers || event.ticket_tiers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot publish event without ticket tiers",
        },
        { status: 400 }
      );
    }

    // Publish event
    const { data, error } = await supabase
      .from("musician_events")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error publishing event:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}