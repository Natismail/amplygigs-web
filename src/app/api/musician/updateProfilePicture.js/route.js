// src/app/api/musicians/updateProfilePicture/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { musician_id, profile_picture_url } = await req.json();

    const { data, error } = await supabase
      .from("musicians")
      .update({ profile_picture_url })
      .eq("id", musician_id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Update profile picture error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
