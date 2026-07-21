import { createClient } from "@/lib/supabase/client";

export async function createGameSession(coupleId: string, gameType: string, creatorId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      couple_id: coupleId,
      game_type: gameType,
      current_turn: creatorId,
      status: "active",
      score_a: 0,
      score_b: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function recordGameMove(
  sessionId: string,
  playerId: string,
  selectedAnswer: string,
  isCorrect: boolean,
  questionText?: string,
) {
  const supabase = createClient();
  const { error } = await supabase.from("game_moves").insert({
    game_session_id: sessionId,
    player_id: playerId,
    selected_answer: selectedAnswer,
    text_answer: questionText || null,
    is_correct: isCorrect,
  });
  if (error) throw error;
}

export async function updateGameScore(sessionId: string, scoreA: number, scoreB: number) {
  const supabase = createClient();
  await supabase
    .from("game_sessions")
    .update({ score_a: scoreA, score_b: scoreB })
    .eq("id", sessionId);
}

export async function completeGameSession(sessionId: string) {
  const supabase = createClient();
  await supabase
    .from("game_sessions")
    .update({ status: "completed" })
    .eq("id", sessionId);
}

export async function getActiveSessions(coupleId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("game_sessions")
    .select()
    .eq("couple_id", coupleId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getSessionMoves(sessionId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("game_moves")
    .select()
    .eq("game_session_id", sessionId)
    .order("created_at", { ascending: true });
  return data || [];
}
