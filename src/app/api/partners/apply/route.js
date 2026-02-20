import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { partner_type, application_data } = body;

    const { data, error } = await supabase
      .from("partner_applications")
      .insert({
        applicant_user_id: user?.id || null,
        partner_type,
        application_data,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}