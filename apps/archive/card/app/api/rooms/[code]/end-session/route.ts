import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/rooms/[code]/end-session — End the current game session and return to lobby
// Only the host can end a session.
// Body: { gameSessionId?: string }
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

  const normalizedCode = code.toUpperCase();

  // Get the room and verify host
  const { data: room } = await supabase
    .from("rooms")
    .select("id, host_session_id, current_game_id, game_state")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.host_session_id !== sessionId) {
    return NextResponse.json(
      { error: "Only the host can end the session" },
      { status: 403 }
    );
  }

  // Update the room to lobby state
  const { error: updateError } = await supabase
    .from("rooms")
    .update({
      game_state: "lobby",
      current_game_id: null,
    })
    .eq("id", room.id);

  if (updateError) {
    console.error("Failed to update room:", updateError);
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 }
    );
  }

  // If there's a current game session, mark it as ended
  if (room.current_game_id) {
    await supabase
      .from("game_sessions")
      .update({ status: "game_end" })
      .eq("id", room.current_game_id);
  }

  // Broadcast the game ended event so all players return to lobby
  try {
    const channel = supabase.channel(`room:${room.id}`, {
      config: { broadcast: { self: false } },
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "game_ended",
          payload: {
            action: "host_ended_session",
            timestamp: Date.now(),
          },
        });
      }
    });
  } catch (broadcastError) {
    console.error("Failed to broadcast end session:", broadcastError);
  }

  return NextResponse.json({
    success: true,
    roomCode: normalizedCode,
    roomId: room.id,
  });
}
