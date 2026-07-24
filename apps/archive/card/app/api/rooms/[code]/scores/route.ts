import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/rooms/[code]/scores — Get scores for the current game session
// Returns player names, per-round scores, running totals, and winner info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: roomCode } = await params;

  const supabase = await createClient();
  const sessionId = request.cookies.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const code = roomCode.toUpperCase();

  // Get room with current game session
  const { data: room } = await supabase
    .from("rooms")
    .select("id, current_game_id, game_state")
    .eq("code", code)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (!room.current_game_id) {
    return NextResponse.json({
      scores: [],
      players: [],
      currentGameId: null,
      message: "No game session found",
    });
  }

  // Get game session info
  const { data: session } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", room.current_game_id)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({
      scores: [],
      players: [],
      currentGameId: room.current_game_id,
      message: "Game session not found",
    });
  }

  // Get all non-spectator players
  const { data: players } = await supabase
    .from("players")
    .select("id, display_name, avatar_emoji, is_host")
    .eq("room_id", room.id)
    .eq("is_spectator", false)
    .order("joined_at", { ascending: true });

  // Get scores for this game session
  const { data: scores } = await supabase
    .from("scores")
    .select("*")
    .eq("game_session_id", room.current_game_id)
    .order("round_number", { ascending: true });

  // Get the last round's winner from stored game state
  const storedConfig = session.config as Record<string, unknown> ?? {};
  const lastWinnerId = storedConfig.winnerId as string | undefined;
  const currentRound = session.round_number ?? 1;

  // Calculate running totals per player
  const runningTotals: Record<string, number> = {};
  const perRoundScores: Array<{
    roundNumber: number;
    scores: Array<{
      playerId: string;
      displayName: string;
      avatarEmoji: string;
      pointsScored: number;
      isWinner: boolean;
      runningTotal: number;
    }>;
  }> = [];

  if (scores) {
    // Group scores by round
    const roundMap = new Map<number, typeof scores>();
    for (const score of scores) {
      const existing = roundMap.get(score.round_number) ?? [];
      existing.push(score);
      roundMap.set(score.round_number, existing);
    }

    // Process each round
    for (const [roundNum, roundScores] of roundMap) {
      const roundInfo: (typeof perRoundScores)[0]["scores"] = [];

      for (const score of roundScores) {
        const player = players?.find((p) => p.id === score.player_id);
        runningTotals[score.player_id] =
          (runningTotals[score.player_id] ?? 0) + score.points_scored;

        roundInfo.push({
          playerId: score.player_id,
          displayName: player?.display_name ?? "Unknown",
          avatarEmoji: player?.avatar_emoji ?? "👤",
          pointsScored: score.points_scored,
          isWinner: score.is_winner,
          runningTotal: runningTotals[score.player_id],
        });
      }

      perRoundScores.push({
        roundNumber: roundNum,
        scores: roundInfo,
      });
    }
  }

  // Calculate current running totals for all players
  const playerRunningTotals = (players ?? []).map((p) => ({
    id: p.id,
    displayName: p.display_name,
    avatarEmoji: p.avatar_emoji,
    isHost: p.is_host,
    runningTotal: runningTotals[p.id] ?? 0,
  }));

  // Find the last round winner
  const lastRoundScores = perRoundScores[perRoundScores.length - 1];
  const lastRoundWinner = lastRoundScores?.scores.find((s) => s.isWinner);

  return NextResponse.json({
    roomId: room.id,
    currentGameId: room.current_game_id,
    gameSessionId: session.id,
    gameType: session.game_type,
    status: session.status,
    currentRound,
    players: (players ?? []).map((p) => ({
      id: p.id,
      displayName: p.display_name,
      avatarEmoji: p.avatar_emoji,
      isHost: p.is_host,
    })),
    perRoundScores,
    runningTotals: playerRunningTotals,
    lastRoundWinner: lastRoundWinner
      ? {
          playerId: lastRoundWinner.playerId,
          displayName: lastRoundWinner.displayName,
          avatarEmoji: lastRoundWinner.avatarEmoji,
          pointsScored: lastRoundWinner.pointsScored,
        }
      : lastWinnerId
        ? {
            playerId: lastWinnerId,
            displayName:
              players?.find((p) => p.id === lastWinnerId)?.display_name ??
              "Unknown",
            avatarEmoji:
              players?.find((p) => p.id === lastWinnerId)?.avatar_emoji ?? "👤",
          }
        : null,
  });
}
