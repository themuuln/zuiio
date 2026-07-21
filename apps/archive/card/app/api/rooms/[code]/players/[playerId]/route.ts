import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/rooms/[code]/players/[playerId] — Remove a player from the room
// Only the host can remove players.
// Edge cases:
//   - Cannot remove the host
//   - During active game, the removed player becomes a spectator
//   - During lobby, the player is deleted from the room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; playerId: string }> }
) {
  const { code, playerId } = await params;

  // Validate code format
  if (!/^[A-Z]{4}$/i.test(code)) {
    return NextResponse.json(
      { error: "Invalid room code format" },
      { status: 400 }
    );
  }

  if (!playerId || typeof playerId !== "string") {
    return NextResponse.json(
      { error: "Invalid player ID" },
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
    .select("id, host_session_id, game_state, current_game_id")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.host_session_id !== sessionId) {
    return NextResponse.json(
      { error: "Only the host can remove players" },
      { status: 403 }
    );
  }

  // Verify the target player exists in this room
  const { data: targetPlayer } = await supabase
    .from("players")
    .select("id, is_host, is_spectator, session_id")
    .eq("id", playerId)
    .eq("room_id", room.id)
    .maybeSingle();

  if (!targetPlayer) {
    return NextResponse.json(
      { error: "Player not found in this room" },
      { status: 404 }
    );
  }

  // Cannot remove the host
  if (targetPlayer.is_host) {
    return NextResponse.json(
      { error: "Cannot remove the host player" },
      { status: 403 }
    );
  }

  // Determine action based on game state
  const isGameActive = room.game_state !== "lobby" && room.current_game_id !== null;

  if (isGameActive) {
    // During active game, set the player as spectator (kick to spectator mode)
    const { error: updateError } = await supabase
      .from("players")
      .update({ is_spectator: true })
      .eq("id", playerId)
      .eq("room_id", room.id);

    if (updateError) {
      console.error("Failed to convert player to spectator:", updateError);
      return NextResponse.json(
        { error: "Failed to remove player" },
        { status: 500 }
      );
    }

    // Broadcast the removal event
    try {
      const channel = supabase.channel(`room:${room.id}`, {
        config: { broadcast: { self: false } },
      });

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.send({
            type: "broadcast",
            event: "player_removed",
            payload: {
              playerId,
              action: "spectator",
              roomCode: normalizedCode,
              timestamp: Date.now(),
            },
          });

          setTimeout(() => {
            supabase.removeChannel(channel);
          }, 1000);
        }
      });
    } catch (broadcastError) {
      console.error("Failed to broadcast player removal:", broadcastError);
    }

    return NextResponse.json({
      success: true,
      playerId,
      action: "spectator",
      roomCode: normalizedCode,
      roomId: room.id,
    });
  }

  // During lobby, delete the player entirely
  const { error: deleteError } = await supabase
    .from("players")
    .delete()
    .eq("id", playerId)
    .eq("room_id", room.id);

  if (deleteError) {
    console.error("Failed to delete player:", deleteError);
    return NextResponse.json(
      { error: "Failed to remove player" },
      { status: 500 }
    );
  }

  // Broadcast the removal event
  try {
    const channel = supabase.channel(`room:${room.id}`, {
      config: { broadcast: { self: false } },
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "player_removed",
          payload: {
            playerId,
            action: "removed",
            roomCode: normalizedCode,
            timestamp: Date.now(),
          },
        });

        setTimeout(() => {
          supabase.removeChannel(channel);
        }, 1000);
      }
    });
  } catch (broadcastError) {
    console.error("Failed to broadcast player removal:", broadcastError);
  }

  return NextResponse.json({
    success: true,
    playerId,
    action: "removed",
    roomCode: normalizedCode,
    roomId: room.id,
  });
}
