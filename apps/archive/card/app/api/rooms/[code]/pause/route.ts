import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/rooms/[code]/pause — Toggle game session between 'playing' and 'paused'
// Only the host can pause/resume the game.
// Body: none (toggles based on current state)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Validate code format
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
      { error: "Only the host can pause/resume the game" },
      { status: 403 }
    );
  }

  if (!room.current_game_id) {
    return NextResponse.json(
      { error: "No active game session to pause/resume" },
      { status: 400 }
    );
  }

  // Get the current game session status
  const { data: gameSession } = await supabase
    .from("game_sessions")
    .select("id, status")
    .eq("id", room.current_game_id)
    .maybeSingle();

  if (!gameSession) {
    return NextResponse.json(
      { error: "Game session not found" },
      { status: 404 }
    );
  }

  // Toggle the status
  const newStatus =
    gameSession.status === "playing" ? "paused" : "playing";

  if (gameSession.status !== "playing" && gameSession.status !== "paused") {
    return NextResponse.json(
      { error: `Cannot pause/resume game in '${gameSession.status}' state` },
      { status: 400 }
    );
  }

  // Update the game session status
  const { error: updateError } = await supabase
    .from("game_sessions")
    .update({ status: newStatus })
    .eq("id", gameSession.id);

  if (updateError) {
    console.error("Failed to update game session status:", updateError);
    return NextResponse.json(
      { error: "Failed to pause/resume game" },
      { status: 500 }
    );
  }

  // Broadcast the pause/resume event so all players see the state change
  try {
    const channel = supabase.channel(`room:${room.id}`, {
      config: { broadcast: { self: false } },
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: newStatus === "paused" ? "game_paused" : "game_resumed",
          payload: {
            status: newStatus,
            gameSessionId: gameSession.id,
            timestamp: Date.now(),
          },
        });

        // Unsubscribe after sending to avoid lingering connections
        setTimeout(() => {
          supabase.removeChannel(channel);
        }, 1000);
      }
    });
  } catch (broadcastError) {
    console.error("Failed to broadcast pause/resume:", broadcastError);
    // Non-fatal — state is still persisted
  }

  return NextResponse.json({
    success: true,
    status: newStatus,
    roomCode: normalizedCode,
    roomId: room.id,
    gameSessionId: gameSession.id,
  });
}
