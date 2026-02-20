import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("referrals")
      .select(
        `
        *,
        referrer:user_profiles!referrer_id(
          id,
          full_name,
          stage_name
        )
      `
      )
      .eq("referral_code", params.code)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching referral:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 404 }
    );
  }
}