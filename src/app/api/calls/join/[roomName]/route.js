// src/app/api/calls/join/[roomName]/route.js
// Verifies user is a valid participant, returns LiveKit token

import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";

const apiKey    = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

export async function POST(request, { params }) {
  try {
    const supabase  = await createClient();
    const { roomName } = params;

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Find call record
    const { data: call, error: callErr } = await supabase
      .from("calls")
      .select("*, initiator:initiator_id(first_name, last_name), participant:participant_id(first_name, last_name)")
      .eq("livekit_room_name", roomName)
      .single();

    if (callErr || !call) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 });
    }

    // Only initiator or participant can join
    const isParticipant = call.initiator_id === user.id || call.participant_id === user.id;
    if (!isParticipant) {
      return NextResponse.json({ success: false, error: "Not authorized for this call" }, { status: 403 });
    }

    // Get user's display name
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const displayName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "User";

    // Mark call as active when participant (not initiator) joins
    if (call.participant_id === user.id && call.status === "ringing") {
      await supabase
        .from("calls")
        .update({ status: "active", answered_at: new Date().toISOString() })
        .eq("livekit_room_name", roomName);
    }

    // Generate token
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
