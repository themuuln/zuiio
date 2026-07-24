import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGamesForPlayerCount, findMostVotedGame } from "@/lib/games";

// GET /api/games/picker/[code] — Get game picker state for a room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const normalizedCode = code.toUpperCase();

  const supabase = await createClient();

  // Get the room
  const { data: room } = await supabase
    .from("rooms")
    .select("id, code, game_state, current_game_id")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Count non-spectator players using SECURITY DEFINER function
  const { data: playerCount } = await supabase.rpc("get_room_player_count", {
    p_room_id: room.id,
  });

  const currentCount = playerCount ?? 0;

  // Get available games for this player count
  const availableGames = getGamesForPlayerCount(currentCount);

  // Get all votes for this room using SECURITY DEFINER function
  const { data: votesRaw } = await supabase.rpc("get_room_votes", {
    p_room_id: room.id,
  });

  const votes: Array<{ player_id: string; game_type: string; vote: string }> =
    typeof votesRaw === "string"
      ? JSON.parse(votesRaw)
      : (votesRaw as Array<{ player_id: string; game_type: string; vote: string }>);

  const mostVotedGame = findMostVotedGame(votes);

  return NextResponse.json({
    roomCode: normalizedCode,
    playerCount: currentCount,
    availableGames,
    votes,
    mostVotedGame,
    gameSessionId: room.current_game_id,
    gameState: room.game_state,
    isPickerOpen: room.game_state === "picking",
  });
}
