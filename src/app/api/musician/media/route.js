import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: list all musician's videos
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const musician_id = searchParams.get("musician_id");

  if (!musician_id) {
    return NextResponse.json({ error: "musician_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("musician_media")
    .select("*")
    .eq("musician_id", musician_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// POST: upload a new video
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("video");
    const musician_id = formData.get("musician_id");

    if (!file || !musician_id) {
      return NextResponse.json({ error: "video file and musician_id required" }, { status: 400 });
    }

    // create a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${musician_id}/${Date.now()}.${fileExt}`;

    // upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("performance-videos")
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("performance-videos").getPublicUrl(fileName);

    // insert record into DB
    const { data: newVideo, error: dbError } = await supabase
      .from("musician_media")
      .insert([{ musician_id, video_url: publicUrl }])
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json(newVideo, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
