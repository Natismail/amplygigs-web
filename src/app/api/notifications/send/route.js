// src/app/api/notifications/send/route.js
// Server-side notification sender using service role key.
// This bypasses RLS so any authenticated user can trigger notifications for others.
// Used by: proposal accept/decline, booking confirm, payment events, etc.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role client — never expose this on the client side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify the calling user is authenticated
async function getCallingUser(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function POST(request) {
  try {
    // 1. Verify caller is authenticated
    const caller = await getCallingUser(request);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,          // recipient user ID (required)
      title,           // notification title (required)
      message,         // notification body (required)
      type,            // notification type string
      action_url,      // where to navigate on click
      data,            // extra JSON metadata
      related_user_id, // optional: the user who triggered this
      related_post_id, // optional: related post
    } = body;

    // 2. Validate required fields
    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: "userId, title, and message are required" },
        { status: 400 }
      );
    }

    // 3. Insert notification using service role (bypasses RLS)
    const { data: notification, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type: type || "general",
        action_url: action_url || null,
        data: data || null,
        related_user_id: related_user_id || caller.id, // default to caller
        related_post_id: related_post_id || null,
        is_read: false,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Notification insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (err) {
    console.error("Send notification error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── Batch send (optional) — notify multiple users at once ─────────────────
// POST /api/notifications/send with { recipients: [userId1, userId2], title, message, ... }
// Falls through to single send if `userId` is provided instead.