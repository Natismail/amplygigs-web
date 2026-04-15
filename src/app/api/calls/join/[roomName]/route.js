// src/app/api/calls/join/[roomName]/route.js
import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@supabase/supabase-js";

const apiKey    = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

// ✅ Same pattern that fixed create/route.js — inject token via global headers
async function getUserFromRequest(request) {
  const authHeader  = request.headers.get("authorization") || "";
  const accessToken = authHeader.replace("Bearer ", "").trim();

  if (!accessToken) return { user: null, supabase: null };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  return { user: error ? null : user, supabase };
}

export async function POST(request, { params }) {
  try {
    const { user, supabase } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { roomName } = params;

    const { data: call, error: callErr } = await supabase
      .from("calls")
      .select("*")
      .eq("livekit_room_name", roomName)
      .single();

    if (callErr || !call) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 });
    }

    if (call.initiator_id !== user.id && call.participant_id !== user.id) {
      return NextResponse.json({ success: false, error: "Not authorized for this call" }, { status: 403 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const displayName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "User";

    // Mark as active when participant joins
    if (call.participant_id === user.id && call.status === "ringing") {
      await supabase
        .from("calls")
        .update({ status: "active", answered_at: new Date().toISOString() })
        .eq("livekit_room_name", roomName);
    }

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