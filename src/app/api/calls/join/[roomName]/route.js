// src/app/api/calls/join/[roomName]/route.js
import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@supabase/supabase-js";

const apiKey    = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

function makeAuthClient(accessToken) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth:   { persistSession: false, autoRefreshToken: false },
    }
  );
}

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function POST(request, context) {
  // ✅ Next.js 15 — params is a Promise, must be awaited
  const { roomName } = await context.params;

  try {
    // Auth
    const authHeader  = request.headers.get("authorization") || "";
    const accessToken = authHeader.replace("Bearer ", "").trim();
    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await makeAuthClient(accessToken).auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Find call
    const { data: call, error: callErr } = await adminClient
      .from("calls")
      .select("*")
      .eq("livekit_room_name", roomName)
      .single();

    if (callErr || !call) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 });
    }

    if (call.initiator_id !== user.id && call.participant_id !== user.id) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    // Get display name
    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const displayName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "User";

    // Mark active when participant joins
    if (call.participant_id === user.id && call.status === "ringing") {
      await adminClient
        .from("calls")
        .update({ status: "active", answered_at: new Date().toISOString() })
        .eq("id", call.id);
    }

    // Generate LiveKit token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name:     displayName,
      ttl:      "2h",
    });
    at.addGrant({
      roomJoin:       true,
      room:           roomName,
      canPublish:     true,
      canSubscribe:   true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      success:   true,
      token,
      room_name: roomName,
      call_type: call.call_type,
      call_id:   call.id,
    });

  } catch (err) {
    console.error("Join call error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

