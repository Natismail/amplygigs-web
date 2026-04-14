// src/app/api/calls/create/route.js
import { NextResponse } from "next/server";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "@supabase/supabase-js";

const livekitUrl = process.env.LIVEKIT_URL;
const apiKey     = process.env.LIVEKIT_API_KEY;
const apiSecret  = process.env.LIVEKIT_API_SECRET;


// ✅ Auth helper — reads Bearer token, NOT cookies and attaches it to Supabase
async function getUserFromRequest(request) {
  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.replace("Bearer ", "").trim();

  if (!accessToken) {
    return { user: null, supabase: null };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user: error ? null : user, supabase };
}

export async function POST(request) {
  try {
    const { user, supabase } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { participant_id, call_type = "voice", booking_id = null } = await request.json();

    if (!participant_id) {
      return NextResponse.json({ success: false, error: "participant_id required" }, { status: 400 });
    }
    if (participant_id === user.id) {
      return NextResponse.json({ success: false, error: "Cannot call yourself" }, { status: 400 });
    }

    // Verify participant exists
    const { data: participant, error: partErr } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, role")
      .eq("id", participant_id)
      .single();

    if (partErr || !participant) {
      return NextResponse.json({ success: false, error: "Participant not found" }, { status: 404 });
    }

    // Get initiator profile
    const { data: initiator } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name")
      .eq("id", user.id)
      .single();

    // Unique room name
    const callId    = crypto.randomUUID();
    const roomName  = `amplygigs-${callId}`;
    const callLabel = call_type === "audition"
      ? "Virtual Audition"
      : call_type === "video"
      ? "Video Call"
      : "Voice Call";

    // Create LiveKit room
    if (livekitUrl && apiKey && apiSecret) {
      try {
        const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
        await roomService.createRoom({
          name:            roomName,
          emptyTimeout:    300,
          maxParticipants: 10,
          metadata:        JSON.stringify({ call_type, booking_id }),
        });
      } catch (lkErr) {
        console.warn("LiveKit room pre-create warning:", lkErr.message);
        // Non-fatal — room is created on first join if this fails
      }
    }

    // Generate token for initiator
    const initiatorToken = await generateToken(
      roomName, user.id,
      `${initiator?.first_name || ""} ${initiator?.last_name || ""}`.trim()
    );

    // Save call record
    const { data: call, error: callErr } = await supabase
      .from("calls")
      .insert({
        id:                callId,
        livekit_room_name: roomName,
        initiator_id:      user.id,
        participant_id,
        booking_id,
        call_type,
        status:            "ringing",
      })
      .select()
      .single();

    if (callErr) throw callErr;

    // Notify recipient via Supabase Realtime
    await supabase.channel(`incoming-calls:${participant_id}`).send({
      type:    "broadcast",
      event:   "incoming_call",
      payload: {
        call_id:    callId,
        room_name:  roomName,
        call_type,
        call_label: callLabel,
        booking_id,
        initiator: {
          id:         user.id,
          first_name: initiator?.first_name,
          last_name:  initiator?.last_name,
        },
      },
    });

    return NextResponse.json({
      success:     true,
      call_id:     callId,
      room_name:   roomName,
      token:       initiatorToken,
      call_type,
      participant: {
        id:         participant.id,
        first_name: participant.first_name,
        last_name:  participant.last_name,
      },
    });

  } catch (err) {
    console.error("Create call error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function generateToken(roomName, userId, displayName) {
  if (!apiKey || !apiSecret) throw new Error("LiveKit credentials not configured");

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
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

  return await at.toJwt();
}