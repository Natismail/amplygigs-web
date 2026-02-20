import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    let query = supabase
      .from("venues")
      .select(
        `
        *,
        partnership:venue_partnerships(*)
      `
      )
      .eq("is_active", true);

    if (userId) {
      // Get venues associated with this user
      query = query.eq("created_by", userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}