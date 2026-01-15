// src/app/api/ratings/route.js - IMPROVED VERSION
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role key - more powerful
);

/* ===========================
   POST — Create rating
=========================== */
export async function POST(req) {
  try {
    const { musician_id, user_id, rating, comment } = await req.json();

    // ✅ BETTER: More detailed validation
    if (!musician_id) {
      return NextResponse.json(
        { success: false, error: "Musician ID is required" },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: "User ID is required (please login)" },
        { status: 401 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // ✅ IMPROVEMENT: Check for duplicate rating
    const { data: existingRating } = await supabase
      .from("ratings")
      .select("id")
      .eq("musician_id", musician_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingRating) {
      return NextResponse.json(
        { success: false, error: "You have already rated this musician" },
        { status: 409 }
      );
    }

    // Insert rating
    const { data, error: insertError } = await supabase
      .from("ratings")
      .insert([{ 
        musician_id, 
        user_id, 
        rating, 
        comment: comment?.trim() || null // Comment is optional
      }])
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    // ✅ IMPROVEMENT: Better average calculation with error handling
    const { data: allRatings, error: aggError } = await supabase
      .from("ratings")
      .select("rating")
      .eq("musician_id", musician_id);

    if (aggError) {
      console.error("Aggregate error:", aggError);
      // Don't fail the whole request if we can't update average
    } else if (allRatings && allRatings.length > 0) {
      const average = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

      await supabase
        .from("user_profiles")
        .update({ average_rating: parseFloat(average.toFixed(2)) })
        .eq("id", musician_id);
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: "Rating submitted successfully"
    }, { status: 201 });

  } catch (err) {
    console.error("POST rating error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to submit rating" },
      { status: 500 }
    );
  }
}

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

    // ✅ IMPROVEMENT: Better query with user details
    const { data, error } = await supabase
      .from("ratings")
      .select(`
        id,
        rating,
        comment,
        created_at,
        user_id,
        user_profiles!ratings_user_id_fkey (
          first_name,
          last_name,
          display_name,
          profile_picture_url
        )
      `)
      .eq("musician_id", musician_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET error:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (err) {
    console.error("GET ratings error:", err);
    return NextResponse.json(
      { success: false, error: err.message, data: [] },
      { status: 500 }
    );
  }
}

/* ===========================
   DELETE — Delete rating (optional)
=========================== */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rating_id = searchParams.get("rating_id");
    const user_id = searchParams.get("user_id");

    if (!rating_id || !user_id) {
      return NextResponse.json(
        { success: false, error: "rating_id and user_id are required" },
        { status: 400 }
      );
    }

    // Only allow users to delete their own ratings
    const { error } = await supabase
      .from("ratings")
      .delete()
      .eq("id", rating_id)
      .eq("user_id", user_id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: "Rating deleted successfully"
    });

  } catch (err) {
    console.error("DELETE rating error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}