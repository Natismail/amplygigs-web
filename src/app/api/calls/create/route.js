// src/app/api/calls/create/route.js
import { NextResponse } from "next/server";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "@supabase/supabase-js";

const livekitUrl = process.env.LIVEKIT_URL;
const apiKey     = process.env.LIVEKIT_API_KEY;
const apiSecret  = process.env.LIVEKIT_API_SECRET;

// ── Two Supabase clients ───────────────────────────────────────────────────
// authClient  — validates the user's JWT (anon key, token injected via headers)
// adminClient — reads/writes DB bypassing RLS (service role key)

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

// ── Route ─────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const user = await getUser(request);
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

    // Verify participant exists (admin — no RLS interference)
    const { data: participant, error: partErr } = await adminClient
      .from("user_profiles")
      .select("id, first_name, last_name")
      .eq("id", participant_id)
      .single();

    if (partErr || !participant) {
      return NextResponse.json({ success: false, error: "Participant not found" }, { status: 404 });
    }

    // Get initiator name
    const { data: initiator } = await adminClient
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const callId   = crypto.randomUUID();
    const roomName = `amplygigs-${callId}`;
    const callLabel = call_type === "audition" ? "Virtual Audition"
                    : call_type === "video"    ? "Video Call"
                    :                            "Voice Call";

    // Pre-create LiveKit room
    if (livekitUrl && apiKey && apiSecret) {
      try {
        const svc = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
        await svc.createRoom({ name: roomName, emptyTimeout: 300, maxParticipants: 10 });
      } catch (e) {
        console.warn("LiveKit pre-create (non-fatal):", e.message);
      }
    }

    // Generate token for initiator
    const initiatorToken = await generateToken(
      roomName, user.id,
      `${initiator?.first_name || ""} ${initiator?.last_name || ""}`.trim()
    );

    // Save call record (admin — bypasses RLS)
    const { data: call, error: callErr } = await adminClient
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

    // Notify recipient via Realtime
    await adminClient.channel(`incoming-calls:${participant_id}`).send({
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
  const at = new AccessToken(apiKey, apiSecret, { identity: userId, name: displayName, ttl: "2h" });
  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true });
  return await at.toJwt();
}


