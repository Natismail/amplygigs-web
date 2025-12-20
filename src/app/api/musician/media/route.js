//src/app/api/musician/media/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   GET — fetch videos
========================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const musician_id = searchParams.get("musician_id");

    if (!musician_id) {
      return NextResponse.json(
        { success: false, data: [], error: "musician_id required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("musician_media")
      .select("*")
      .eq("musician_id", musician_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (err) {
    console.error("GET videos error:", err);
    return NextResponse.json(
      { success: false, data: [] },
      { status: 500 }
    );
  }
}

/* =========================
   POST — upload video
========================= */
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("video");
    const musician_id = formData.get("musician_id");

    if (!file || !musician_id) {
      return NextResponse.json(
        { success: false, error: "video and musician_id required" },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${musician_id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("performance-videos")
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("performance-videos")
      .getPublicUrl(fileName);

    const { data: newVideo, error: dbError } = await supabase
      .from("musician_media")
      .insert([{ musician_id, video_url: publicUrl }])
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json(
      { success: true, data: newVideo },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST video error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}


// import { NextResponse } from "next/server";
// import { supabase } from "@/lib/supabaseClient";

// // GET: list all musician's videos
// export async function GET(req) {
//   const { searchParams } = new URL(req.url);
//   const musician_id = searchParams.get("musician_id");

//   if (!musician_id) {
//     return NextResponse.json({ error: "musician_id required" }, { status: 400 });
//   }

//   const { data, error } = await supabase
//     .from("musician_media")
//     .select("*")
//     .eq("musician_id", musician_id)
//     .order("created_at", { ascending: false });

//   if (error) return NextResponse.json({ error: error.message }, { status: 500 });

//   return NextResponse.json(data);
// }

// // POST: upload a new video
// export async function POST(req) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("video");
//     const musician_id = formData.get("musician_id");

//     if (!file || !musician_id) {
//       return NextResponse.json({ error: "video file and musician_id required" }, { status: 400 });
//     }

//     // create a unique filename
//     const fileExt = file.name.split(".").pop();
//     const fileName = `${musician_id}/${Date.now()}.${fileExt}`;

//     // upload to Supabase Storage
//     const { error: uploadError } = await supabase.storage
//       .from("performance-videos")
//       .upload(fileName, file, {
//         contentType: file.type,
//         cacheControl: "3600",
//         upsert: false,
//       });

//     if (uploadError) {
//       return NextResponse.json({ error: uploadError.message }, { status: 500 });
//     }

//     // get the public URL
//     const {
//       data: { publicUrl },
//     } = supabase.storage.from("performance-videos").getPublicUrl(fileName);

//     // insert record into DB
//     const { data: newVideo, error: dbError } = await supabase
//       .from("musician_media")
//       .insert([{ musician_id, video_url: publicUrl }])
//       .select()
//       .single();

//     if (dbError) {
//       return NextResponse.json({ error: dbError.message }, { status: 500 });
//     }

//     return NextResponse.json(newVideo, { status: 201 });
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
