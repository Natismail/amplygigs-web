// // src/app/api/ratings/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role is OK here (server only)
);

/* ===========================
   GET — Fetch ratings
=========================== */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const musician_id = searchParams.get("musician_id");

    if (!musician_id) {
      return NextResponse.json(
        { success: false, error: "musician_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ratings")
      .select(
        `
        id,
        rating,
        comment,
        created_at,
        user_profiles (
          name
        )
      `
      )
      .eq("musician_id", musician_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [], // ALWAYS return array
    });
  } catch (err) {
    console.error("GET ratings error:", err);
    return NextResponse.json(
      { success: false, data: [] }, // STILL valid JSON
      { status: 500 }
    );
  }
}

/* ===========================
   POST — Create rating
=========================== */
export async function POST(req) {
  try {
    const { musician_id, user_id, rating, comment } = await req.json();

    if (!musician_id || !user_id || !rating) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert rating
    const { error: insertError } = await supabase
      .from("ratings")
      .insert([{ musician_id, user_id, rating, comment }]);

    if (insertError) throw insertError;

    // Recalculate average rating
    const { data: agg, error: aggError } = await supabase
      .from("ratings")
      .select("rating")
      .eq("musician_id", musician_id);

    if (aggError) throw aggError;

    const average =
      agg.reduce((sum, r) => sum + r.rating, 0) / (agg.length || 1);

    await supabase
      .from("user_profiles")
      .update({ average_rating: average })
      .eq("id", musician_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST rating error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}





// import { NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY // use Service Role for inserts
// );

// export async function POST(req) {
//   try {
//     const { musician_id, user_id, rating, comment } = await req.json();

//     const { data, error } = await supabase
//       .from("ratings")
//       .insert([{ musician_id, user_id, rating, comment }])
//       .select();

//     if (error) throw error;

//     // Update musician's average rating
//     const { data: agg } = await supabase
//       .from("ratings")
//       .select("rating")
//       .eq("musician_id", musician_id);

//     const average =
//       agg.reduce((sum, r) => sum + r.rating, 0) / (agg.length || 1);

//     await supabase
//       .from("user_profiles")
//       .update({ average_rating: average })
//       .eq("id", musician_id);

//     return NextResponse.json({ success: true, data });
//   } catch (err) {
//     console.error("Rating error:", err.message);
//     return NextResponse.json({ success: false, error: err.message }, { status: 500 });
//   }
// }
