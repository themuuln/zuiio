import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findMutualMatch, getGameById } from "@/lib/games";
import { broadcastToRoom } from "@/lib/party-engine";

// POST /api/games/picker/vote — Submit a vote on a game
// Body: { roomCode: string, gameType: string, vote: 'yes' | 'no' }
export async function POST(request: NextRequest) {
  let body: { roomCode?: string; gameType?: string; vote?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { roomCode, gameType, vote } = body;

  if (!roomCode || typeof roomCode !== "string" || !/^[A-Z]{4}$/i.test(roomCode)) {
    return NextResponse.json({ error: "Invalid room code" }, { status: 400 });
  }

  if (!gameType || typeof gameType !== "string") {
    return NextResponse.json({ error: "Invalid game type" }, { status: 400 });
  }

  if (!vote || !["yes", "no"].includes(vote)) {
    return NextResponse.json({ error: "Vote must be 'yes' or 'no'" }, { status: 400 });
  }

  const supabase = await createClient();
  const sessionId = request.cookies.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const code = roomCode.toUpperCase();

  // Get the room
  const { data: room } = await supabase
    .from("rooms")
    .select("id, code, game_state, host_session_id")
    .eq("code", code)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Get the player
  const playerResult = await supabase.rpc("get_player_by_session", {
    p_code: code,
    p_session_id: sessionId,
  });

  const playerData =
    typeof playerResult.data === "string"
      ? JSON.parse(playerResult.data)
      : playerResult.data;

  if (!playerData || playerData.error) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const playerId = playerData.id;

  // Validate game type
  const gameDef = getGameById(gameType);
  if (!gameDef) {
    return NextResponse.json(
      { error: `Unknown game type: ${gameType}` },
      { status: 400 }
    );
  }

  // Upsert the vote using SECURITY DEFINER function
  const { error: voteError } = await supabase.rpc("upsert_vote", {
    p_room_id: room.id,
    p_player_id: playerId,
    p_game_type: gameType,
    p_vote: vote,
  });

  if (voteError) {
    console.error("Failed to record vote:", voteError);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }

  // Fetch all votes for this room using SECURITY DEFINER function
  const { data: allVotesRaw } = await supabase.rpc("get_room_votes", {
    p_room_id: room.id,
  });

  const allVotes: Array<{ player_id: string; game_type: string; vote: string }> =
    typeof allVotesRaw === "string"
      ? JSON.parse(allVotesRaw)
      : (allVotesRaw as Array<{ player_id: string; game_type: string; vote: string }>);

  // Get all non-spectator player IDs
  const { data: players } = await supabase
    .from("players")
    .select("id")
    .eq("room_id", room.id)
    .eq("is_spectator", false);

  const playerIds = (players ?? []).map((p) => p.id);

  // Check for mutual match
  const mutualMatch = findMutualMatch(playerIds, allVotes ?? []);

  let matchResult: { matched: boolean; gameType?: string; gameSessionId?: string; celebration?: string } = {
    matched: false,
  };

  if (mutualMatch) {
    // Create a game session using SECURITY DEFINER function
    const { data: sessionResult, error: sessionError } = await supabase.rpc(
      "create_game_session",
      {
        p_room_id: room.id,
        p_game_type: mutualMatch,
        p_status: "picking",
      }
    );

    if (sessionError) {
      console.error("Failed to create game session:", sessionError);
      return NextResponse.json(
        { error: "Failed to create game session" },
        { status: 500 }
      );
    }

    const sessionData =
      typeof sessionResult === "string"
        ? JSON.parse(sessionResult)
        : sessionResult;

    const matchedGame = getGameById(mutualMatch);
    matchResult = {
      matched: true,
      gameType: mutualMatch,
      gameSessionId: sessionData.id,
      celebration: `Everyone wants to play ${matchedGame?.name ?? mutualMatch}!`,
    };

    // Broadcast mutual match — await so non-host players receive the event
    try {
      await Promise.race([
        broadcastToRoom(supabase, room.id, "mutual_match", matchResult),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Broadcast timed out")), 3000)
        ),
      ]);
    } catch (broadcastError) {
      console.error("Failed to broadcast mutual match:", broadcastError);
      // Non-fatal — game state is persisted via API response
    }
  }

  // Broadcast vote update — await so non-host players see live vote tallies
  try {
    await Promise.race([
      broadcastToRoom(supabase, room.id, "vote_updated", {
        playerId,
        gameType,
        vote,
        allVotes,
        matchResult,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Broadcast timed out")), 3000)
      ),
    ]);
  } catch (broadcastError) {
    console.error("Failed to broadcast vote:", broadcastError);
    // Non-fatal — game state is persisted via API response
  }

  return NextResponse.json({
    success: true,
    vote: { gameType, vote },
    match: matchResult.matched
      ? { gameType: matchResult.gameType, gameSessionId: matchResult.gameSessionId, celebration: matchResult.celebration }
      : null,
    allVotes,
  });
}
