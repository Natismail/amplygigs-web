// src/app/api/calls/create/route.js
// Creates a LiveKit room + Supabase call record + notifies recipient

import { NextResponse } from "next/server";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";

const livekitUrl    = process.env.LIVEKIT_URL;
const apiKey        = process.env.LIVEKIT_API_KEY;
const apiSecret     = process.env.LIVEKIT_API_SECRET;

export async function POST(request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
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

    // Create unique room name
    const callId          = crypto.randomUUID();
    const roomName        = `amplygigs-${callId}`;
    const callLabel       = call_type === "audition" ? "Virtual Audition" : call_type === "video" ? "Video Call" : "Voice Call";

    // Create LiveKit room via RoomServiceClient
    if (livekitUrl && apiKey && apiSecret) {
      try {
        const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
        await roomService.createRoom({
          name:                    roomName,
          emptyTimeout:            300,      // auto-delete after 5 min empty
          maxParticipants:         10,
          metadata:                JSON.stringify({ call_type, booking_id }),
        });
      } catch (lkErr) {
        console.error("LiveKit room creation error:", lkErr);
        // Continue — room will be created on first participant join if not pre-created
      }
    }

    // Generate token for initiator
    const initiatorToken = await generateToken(roomName, user.id, `${initiator?.first_name} ${initiator?.last_name}`, call_type);

    // Create call record in Supabase
    const { data: call, error: callErr } = await supabase
      .from("calls")
      .insert({
        id:                 callId,
        livekit_room_name:  roomName,
        initiator_id:       user.id,
        participant_id,
        booking_id,
        call_type,
        status:             "ringing",
      })
      .select()
      .single();

    if (callErr) throw callErr;

    // Notify recipient via Supabase Realtime broadcast
    await supabase.channel(`incoming-calls:${participant_id}`).send({
      type:    "broadcast",
      event:   "incoming_call",
      payload: {
        call_id:        callId,
        room_name:      roomName,
        call_type,
        call_label:     callLabel,
        booking_id,
        initiator: {
          id:         user.id,
          first_name: initiator?.first_name,
          last_name:  initiator?.last_name,
        },
      },
    });

    return NextResponse.json({
      success:    true,
      call_id:    callId,
      room_name:  roomName,
      token:      initiatorToken,
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

async function generateToken(roomName, userId, displayName, callType) {
  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials not configured");
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name:     displayName,
    ttl:      "2h",
  });

  at.addGrant({
    roomJoin:         true,
    room:             roomName,
    canPublish:       true,
    canSubscribe:     true,
    // Audition: participant (viewer/client) can't publish video by default
    // — they override this client-side if needed
    canPublishData:   true,
  });

  return await at.toJwt();
}

