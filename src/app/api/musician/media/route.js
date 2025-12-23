// src/app/api/musician/media/route.js
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET - Fetch videos
export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const musicianId = searchParams.get("musician_id");

    if (!musicianId) {
      return NextResponse.json(
        { error: "musician_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("musician_media")
      .select("*")
      .eq("musician_id", musicianId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Upload video
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const videoFile = formData.get("video");
    const musicianId = formData.get("musician_id");
    const title = formData.get("title") || videoFile.name;
    const description = formData.get("description") || "";

    // Verify user owns this musician profile
    if (user.id !== musicianId) {
      return NextResponse.json(
        { error: "Forbidden: You can only upload videos to your own profile" },
        { status: 403 }
      );
    }

    // Upload to Supabase Storage
    const fileExt = videoFile.name.split(".").pop();
    const fileName = `${musicianId}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("musician-videos")
      .upload(fileName, videoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("musician-videos")
      .getPublicUrl(fileName);

    // Save to database
    const { data: mediaRecord, error: dbError } = await supabase
      .from("musician_media")
      .insert({
        musician_id: musicianId,
        video_url: publicUrl,
        title: title,
        description: description,
        file_size_bytes: videoFile.size,
      })
      .select()
      .single();

    if (dbError) {
      // If database insert fails, delete the uploaded file
      await supabase.storage
        .from("musician-videos")
        .remove([fileName]);
      throw dbError;
    }

    return NextResponse.json(mediaRecord, { status: 201 });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete video
export async function DELETE(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("id");

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    // Get video record
    const { data: video, error: fetchError } = await supabase
      .from("musician_media")
      .select("*")
      .eq("id", videoId)
      .single();

    if (fetchError) throw fetchError;

    // Verify ownership
    if (video.musician_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own videos" },
        { status: 403 }
      );
    }

    // Extract file path from URL
    const urlParts = video.video_url.split("/musician-videos/");
    const filePath = urlParts[1];

    // Delete from storage
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from("musician-videos")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
        // Continue even if storage deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("musician_media")
      .delete()
      .eq("id", videoId);

    if (deleteError) throw deleteError;

    return NextResponse.json(
      { message: "Video deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update video metadata
export async function PATCH(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, title, description, is_featured } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: video } = await supabase
      .from("musician_media")
      .select("musician_id")
      .eq("id", id)
      .single();

    if (video.musician_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Update
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (is_featured !== undefined) updates.is_featured = is_featured;

    const { data, error } = await supabase
      .from("musician_media")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating video:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

