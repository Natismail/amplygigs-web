// src/app/api/calls/end/[roomName]/route.js
// Ends a LiveKit room and updates the call record with duration

import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";

const livekitUrl = process.env.LIVEKIT_URL;
const apiKey     = process.env.LIVEKIT_API_KEY;
const apiSecret  = process.env.LIVEKIT_API_SECRET;

export async function POST(request, { params }) {
  try {
    const supabase   = await createClient();
    const { roomName } = params;

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Find call
    const { data: call, error: callErr } = await supabase
      .from("calls")
      .select("*")
      .eq("livekit_room_name", roomName)
      .single();

    if (callErr || !call) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 });
    }

    // Must be a participant
    if (call.initiator_id !== user.id && call.participant_id !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Calculate duration
    const endedAt       = new Date();
    const answeredAt    = call.answered_at ? new Date(call.answered_at) : null;
    const durationSecs  = answeredAt ? Math.round((endedAt - answeredAt) / 1000) : 0;

    // Update call record
    await supabase
      .from("calls")
      .update({
        status:           "ended",
        ended_at:         endedAt.toISOString(),
        ended_by:         user.id,
        duration_seconds: durationSecs,
      })
      .eq("livekit_room_name", roomName);

    // Delete LiveKit room (kicks all participants)
    if (livekitUrl && apiKey && apiSecret) {
      try {
        const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
        await roomService.deleteRoom(roomName);
      } catch (lkErr) {
        console.warn("LiveKit room deletion warning:", lkErr.message);
        // Non-fatal — room will expire on its own
      }
    }

    // Notify both participants via Realtime that call ended
    const otherUserId = user.id === call.initiator_id ? call.participant_id : call.initiator_id;
    await supabase.channel(`incoming-calls:${otherUserId}`).send({
      type:    "broadcast",
      event:   "call_ended",
      payload: { room_name: roomName, duration_seconds: durationSecs },
    });

    return NextResponse.json({
      success:          true,
      duration_seconds: durationSecs,
    });

  } catch (err) {
    console.error("End call error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Also handle DECLINE (recipient rejects)
export async function DELETE(request, { params }) {
  try {
    const supabase   = await createClient();
    const { roomName } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: call } = await supabase
      .from("calls")
      .select("initiator_id, participant_id")
      .eq("livekit_room_name", roomName)
      .single();

    if (!call) return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 });

    await supabase
      .from("calls")
      .update({ status: "declined", ended_at: new Date().toISOString() })
      .eq("livekit_room_name", roomName);

    // Notify initiator that call was declined
    await supabase.channel(`incoming-calls:${call.initiator_id}`).send({
      type:    "broadcast",
      event:   "call_declined",
      payload: { room_name: roomName },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

