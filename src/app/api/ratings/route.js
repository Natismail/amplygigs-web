// src/app/api/ratings/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // use Service Role for inserts
);

export async function POST(req) {
  try {
    const { musician_id, user_id, rating, comment } = await req.json();

    const { data, error } = await supabase
      .from("ratings")
      .insert([{ musician_id, user_id, rating, comment }])
      .select();

    if (error) throw error;

    // Update musician's average rating
    const { data: agg } = await supabase
      .from("ratings")
      .select("rating")
      .eq("musician_id", musician_id);

    const average =
      agg.reduce((sum, r) => sum + r.rating, 0) / (agg.length || 1);

    await supabase
      .from("user_profiles")
      .update({ average_rating: average })
      .eq("id", musician_id);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Rating error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
