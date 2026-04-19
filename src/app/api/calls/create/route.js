// src/app/api/calls/create/route.js
import { NextResponse } from "next/server";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
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

export async function POST(request) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { participant_id, call_type = "voice", booking_id = null } = await request.json();

    if (!participant_id) return NextResponse.json({ success: false, error: "participant_id required" }, { status: 400 });
    if (participant_id === user.id) return NextResponse.json({ success: false, error: "Cannot call yourself" }, { status: 400 });

    // ✅ Fetch avatar too
    const { data: participant } = await adminClient
      .from("user_profiles")
      .select("id, first_name, last_name, profile_picture_url, avatar_url")
      .eq("id", participant_id)
      .single();

    if (!participant) return NextResponse.json({ success: false, error: "Participant not found" }, { status: 404 });

    const { data: initiator } = await adminClient
      .from("user_profiles")
      .select("id, first_name, last_name, profile_picture_url, avatar_url")
      .eq("id", user.id)
      .single();

    const callId   = crypto.randomUUID();
    const roomName = `amplygigs-${callId}`;
    const callLabel = call_type === "audition" ? "Virtual Audition"
                    : call_type === "video"    ? "Video Call" : "Voice Call";

    // Resolve avatar — check both column names
    const initiatorAvatar   = initiator?.profile_picture_url || initiator?.avatar_url || null;
    const participantAvatar = participant.profile_picture_url || participant.avatar_url || null;

    if (livekitUrl && apiKey && apiSecret) {
      try {
        const svc = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
        await svc.createRoom({ name: roomName, emptyTimeout: 300, maxParticipants: 10 });
      } catch (e) { console.warn("LiveKit pre-create (non-fatal):", e.message); }
    }

    const initiatorToken = await generateToken(
      roomName, user.id,
      `${initiator?.first_name || ""} ${initiator?.last_name || ""}`.trim()
    );

    const { data: call, error: callErr } = await adminClient
      .from("calls")
      .insert({
        id: callId, livekit_room_name: roomName,
        initiator_id: user.id, participant_id,
        booking_id, call_type, status: "ringing",
      })
      .select().single();

    if (callErr) throw callErr;

    // ✅ Avatar included in broadcast so receiver sees initiator's picture
    await adminClient.channel(`incoming-calls:${participant_id}`).send({
      type: "broadcast", event: "incoming_call",
      payload: {
        call_id: callId, room_name: roomName,
        //call_type, call_label, booking_id,
         call_type,
         call_label: callLabel, booking_id,
        initiator: {
          id:         user.id,
          first_name: initiator?.first_name,
          last_name:  initiator?.last_name,
          avatar:     initiatorAvatar,  // ✅
        },
      },
    });

    return NextResponse.json({
      success: true, call_id: callId, room_name: roomName,
      token: initiatorToken, call_type,
      participant: {
        id:         participant.id,
        first_name: participant.first_name,
        last_name:  participant.last_name,
        avatar:     participantAvatar,  // ✅ returned so initiator sees receiver's picture
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




