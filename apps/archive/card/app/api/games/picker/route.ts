import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGamesForPlayerCount } from "@/lib/games";
import { broadcastToRoom } from "@/lib/party-engine";

// POST /api/games/picker — Open the game picker for a room (host only)
// Body: { roomCode: string }
export async function POST(request: NextRequest) {
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
    .select("id, code, host_session_id, game_state")
    .eq("code", code)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Verify the requester is the host
  if (room.host_session_id !== sessionId) {
    return NextResponse.json(
      { error: "Only the host can open the game picker" },
      { status: 403 }
    );
  }

  // Count non-spectator players using SECURITY DEFINER function
  const { data: playerCount } = await supabase.rpc("get_room_player_count", {
    p_room_id: room.id,
  });

  const currentCount = playerCount ?? 0;

  if (currentCount < 2) {
    return NextResponse.json(
      { error: "Need at least 2 players to pick a game" },
      { status: 400 }
    );
  }

  // Clear any existing votes for this room
  const { error: deleteError } = await supabase.rpc("clear_room_votes", {
    p_room_id: room.id,
  });

  if (deleteError) {
    console.error("Failed to clear previous votes:", deleteError);
  }

  // Mark the room as "picking" so non-host players can detect the picker is open
  // via polling when the broadcast is missed. This also prevents new players from
  // joining mid-picker.
  await supabase
    .from("rooms")
    .update({ game_state: "picking" })
    .eq("id", room.id);

  // Get filtered games for this player count
  const availableGames = getGamesForPlayerCount(currentCount);

  // Broadcast to the room channel that the picker is opened.
  // Await the broadcast so non-host players receive the event before
  // the serverless function terminates. Time out after 3s so a slow
  // broadcast doesn't hang the API response.
  try {
    await Promise.race([
      broadcastToRoom(supabase, room.id, "game_picker_opened", {
        availableGames,
        playerCount: currentCount,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Broadcast timed out")), 3000)
      ),
    ]);
  } catch (broadcastError) {
    console.error("Failed to broadcast picker opened:", broadcastError);
    // Non-fatal — game state is persisted via API response
  }

  return NextResponse.json({
    availableGames,
    playerCount: currentCount,
  });
}
