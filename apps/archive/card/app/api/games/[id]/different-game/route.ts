import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/games/[id]/different-game — Return to game picker
// Resets the room state back to "lobby" so players can pick a different game.
// Body: { roomCode: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameSessionId } = await params;

  let body: { roomCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { roomCode } = body;
  if (!roomCode || typeof roomCode !== "string" || !/^[A-Z]{4}$/i.test(roomCode)) {
    return NextResponse.json(
      { error: "Invalid room code" },
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

  const code = roomCode.toUpperCase();

  // Get the room
  const { data: room } = await supabase
    .from("rooms")
    .select("id, code, host_session_id")
    .eq("code", code)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Verify the requester is the host
  if (room.host_session_id !== sessionId) {
    return NextResponse.json(
      { error: "Only the host can choose a different game" },
      { status: 403 }
    );
  }

  // Reset the room to lobby state and clear the current game
  const { error: updateRoomError } = await supabase
    .from("rooms")
    .update({
      game_state: "lobby",
      current_game_id: null,
    })
    .eq("id", room.id);

  if (updateRoomError) {
    console.error("Failed to update room:", updateRoomError);
    return NextResponse.json(
      { error: "Failed to reset room" },
      { status: 500 }
    );
  }

  // Update the game session status to "game_end"
  const { error: updateGameError } = await supabase
    .from("game_sessions")
    .update({ status: "game_end" })
    .eq("id", gameSessionId);

  if (updateGameError) {
    console.error("Failed to update game session:", updateGameError);
    // Non-fatal
  }

  // Broadcast the different-game event
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
            gameSessionId,
            action: "different_game",
          },
        });
      }
    });
  } catch (broadcastError) {
    console.error("Failed to broadcast:", broadcastError);
  }

  return NextResponse.json({
    success: true,
    roomCode: code,
    roomId: room.id,
  });
}
