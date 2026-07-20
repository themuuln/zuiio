import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: activeSessions, error: sessionsErr },
    { count: pendingSubmissions, error: subsErr },
    { count: pendingRevisions, error: revErr },
    { data: auditRows, error: auditErr },
    { data: staleGames, error: staleErr },
  ] = await Promise.all([
    supabase
      .from("tracker_sessions")
      .select(
        "id, game_id, scorer_id, role, started_at, last_acknowledged_sequence, profiles!tracker_sessions_scorer_id_fkey(display_name), games!tracker_sessions_game_id_fkey(scheduled_at)",
      )
      .eq("status", "active"),
    supabase
      .from("source_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("game_revisions")
      .select("*", { count: "exact", head: true })
      .eq("state", "pending"),
    supabase
      .from("audit_log")
      .select("id, actor_id, action, entity, entity_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("games")
      .select("id, scheduled_at, created_at")
      .eq("status", "final_pending_review")
      .lt("created_at", cutoff),
  ]);

  if (sessionsErr || subsErr || revErr || auditErr || staleErr) {
    const msg = [
      sessionsErr?.message,
      subsErr?.message,
      revErr?.message,
      auditErr?.message,
      staleErr?.message,
    ]
      .filter(Boolean)
      .join("; ");
    Sentry.captureException(new Error(msg));
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({
    activeSessions: activeSessions ?? [],
    pendingSubmissions: pendingSubmissions ?? 0,
    pendingRevisions: pendingRevisions ?? 0,
    auditLog: auditRows ?? [],
    staleGames: staleGames ?? [],
  });
}
