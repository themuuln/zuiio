import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/rooms/[code]/transfer-host — Transfer host role to another player
// Only the current host can transfer host.
// Body: { targetPlayerId: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!/^[A-Z]{4}$/i.test(code)) {
    return NextResponse.json(
      { error: "Invalid room code format" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const sessionId = request.cookies.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  let body: { targetPlayerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { targetPlayerId } = body;
  if (!targetPlayerId || typeof targetPlayerId !== "string") {
    return NextResponse.json(
      { error: "Target player ID is required" },
      { status: 400 }
    );
  }

  const normalizedCode = code.toUpperCase();

  // Get the room and verify current host
  const { data: room } = await supabase
    .from("rooms")
    .select("id, host_session_id")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.host_session_id !== sessionId) {
    return NextResponse.json(
      { error: "Only the host can transfer host role" },
      { status: 403 }
    );
  }

  // Verify the target player exists in this room
  const { data: targetPlayer } = await supabase
    .from("players")
    .select("id, session_id")
    .eq("id", targetPlayerId)
    .eq("room_id", room.id)
    .maybeSingle();

  if (!targetPlayer) {
    return NextResponse.json(
      { error: "Target player not found in this room" },
      { status: 404 }
    );
  }

  // Transfer host: update players table
  // Set current host to non-host, set target to host
  const { error: updateError } = await supabase
    .from("players")
    .update({ is_host: false })
    .eq("room_id", room.id)
    .eq("session_id", sessionId);

  if (updateError) {
    console.error("Failed to remove host status:", updateError);
    return NextResponse.json(
      { error: "Failed to transfer host" },
      { status: 500 }
    );
  }

  const { error: setHostError } = await supabase
    .from("players")
    .update({ is_host: true })
    .eq("id", targetPlayerId)
    .eq("room_id", room.id);

  if (setHostError) {
    console.error("Failed to set new host:", setHostError);
    // Rollback
    const { error: rollbackError1 } = await supabase
      .from("players")
      .update({ is_host: true })
      .eq("room_id", room.id)
      .eq("session_id", sessionId);
    const { error: rollbackError2 } = await supabase
      .from("players")
      .update({ is_host: false })
      .eq("id", targetPlayerId)
      .eq("room_id", room.id);

    if (rollbackError1 || rollbackError2) {
      console.error("Host transfer rollback failed:", { rollbackError1, rollbackError2 });
    }

    return NextResponse.json(
      { error: "Failed to transfer host" },
      { status: 500 }
    );
  }

  // Update the room's host_session_id
  const { error: roomUpdateError } = await supabase
    .from("rooms")
    .update({ host_session_id: targetPlayer.session_id })
    .eq("id", room.id);

  if (roomUpdateError) {
    console.error("Failed to update room host:", roomUpdateError);
    return NextResponse.json(
      { error: "Failed to transfer host" },
      { status: 500 }
    );
  }

  // Broadcast the host transfer event
  try {
    const channel = supabase.channel(`room:${room.id}`, {
      config: { broadcast: { self: false } },
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "host_transferred",
          payload: {
            newHostPlayerId: targetPlayerId,
            previousHostSessionId: sessionId,
            timestamp: Date.now(),
          },
        });
      }
    });
  } catch (broadcastError) {
    console.error("Failed to broadcast host transfer:", broadcastError);
  }

  return NextResponse.json({
    success: true,
    newHostPlayerId: targetPlayerId,
  });
}
