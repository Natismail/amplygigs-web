// src/app/api/calls/end/[roomName]/route.js
import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "@supabase/supabase-js";

const livekitUrl = process.env.LIVEKIT_URL;
const apiKey     = process.env.LIVEKIT_API_KEY;
const apiSecret  = process.env.LIVEKIT_API_SECRET;

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

async function getUser(request) {
  const token = (request.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!token) return null;
  const { data: { user }, error } = await makeAuthClient(token).auth.getUser();
  return error ? null : user;
}

// POST — end an active call
export async function POST(request, context) {
  // ✅ Next.js 15 — await params
  const { roomName } = await context.params;

  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: call, error: callErr } = await adminClient
      .from("calls")
      .select("*")
      .eq("livekit_room_name", roomName)
      .single();

    if (callErr || !call) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 });
    }

    if (call.initiator_id !== user.id && call.participant_id !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const endedAt      = new Date();
    const answeredAt   = call.answered_at ? new Date(call.answered_at) : null;
    const durationSecs = answeredAt ? Math.round((endedAt - answeredAt) / 1000) : 0;

    await adminClient
      .from("calls")
      .update({
        status:           "ended",
        ended_at:         endedAt.toISOString(),
        ended_by:         user.id,
        duration_seconds: durationSecs,
      })
      .eq("livekit_room_name", roomName);

    // Delete LiveKit room
    if (livekitUrl && apiKey && apiSecret) {
      try {
        const svc = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
        await svc.deleteRoom(roomName);
      } catch (e) {
        console.warn("LiveKit room deletion (non-fatal):", e.message);
      }
    }

    // Notify other party
    const otherUserId = user.id === call.initiator_id ? call.participant_id : call.initiator_id;
    await adminClient.channel(`incoming-calls:${otherUserId}`).send({
      type:    "broadcast",
      event:   "call_ended",
      payload: { room_name: roomName, duration_seconds: durationSecs },
    });

    return NextResponse.json({ success: true, duration_seconds: durationSecs });

  } catch (err) {
    console.error("End call error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE — decline an incoming call
export async function DELETE(request, context) {
  // ✅ Next.js 15 — await params
  const { roomName } = await context.params;

  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: call } = await adminClient
      .from("calls")
      .select("initiator_id, participant_id")
      .eq("livekit_room_name", roomName)
      .single();

    if (!call) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 });
    }

    await adminClient
      .from("calls")
      .update({ status: "declined", ended_at: new Date().toISOString() })
      .eq("livekit_room_name", roomName);

    await adminClient.channel(`incoming-calls:${call.initiator_id}`).send({
      type:    "broadcast",
      event:   "call_declined",
      payload: { room_name: roomName },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}


