import {
  type FibaGameFlowStats,
  type FibaPlayerStatLine,
  type FibaTeamBoxScore,
  type FibaTextItem,
  fibaTextItemsToLines,
  type Json,
  parseFibaOfficialStats,
} from "@onoo/core";
import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_PDF_SIZE = 10 * 1024 * 1024;

/** A game roster row returned by Supabase, with a nested jersey_number via the join. */
interface GameRosterWithJersey {
  player_id: string;
  team_season_id: string;
  roster_entries:
    | Array<{ jersey_number: number | null }>
    | { jersey_number: number | null };
}

/** Shape returned by cmd_submit_official_stats RPC. */
interface SubmitOfficialStatsResult {
  submission_id: string;
  revision_id: string;
  revision_number: number;
}

/** Per-player stat line for the projection. */
interface PlayerStatLine {
  player_id: string;
  team_season_id: string;
  seconds_played: number | null;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  plus_minus: number | null;
  fouls_committed: number | null;
  fouls_drawn: number | null;
  is_starter: boolean;
  dnp: boolean;
}

/** Per-team stat line for the projection. */
interface TeamStatLine {
  team_season_id: string;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  team_reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  fouls_committed: number;
  fouls_drawn: number;
  points_from_turnovers: number | null;
  points_in_paint: number | null;
  second_chance_points: number | null;
  fast_break_points: number | null;
  bench_points: number | null;
  biggest_lead: number | null;
  biggest_scoring_run_for: number | null;
  biggest_scoring_run_against: number | null;
  time_leading_seconds: number | null;
}

function buildPlayerStats(
  players: FibaPlayerStatLine[],
  teamSeasonId: string,
  rosterMap: Map<number, string>,
  teamCode: string,
): PlayerStatLine[] {
  const stats: PlayerStatLine[] = [];

  for (const player of players) {
    const playerId = rosterMap.get(player.jerseyNumber);
    if (!playerId) {
      Sentry.captureMessage(
        `Player #${player.jerseyNumber} in team ${teamCode} not found in game roster`,
      );
    }

    const baseId = playerId ?? "00000000-0000-0000-0000-000000000000";

    if (player.dnp) {
      stats.push({
        player_id: baseId,
        team_season_id: teamSeasonId,
        seconds_played: null,
        pts: 0,
        fgm: 0,
        fga: 0,
        tpm: 0,
        tpa: 0,
        ftm: 0,
        fta: 0,
        oreb: 0,
        dreb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        tov: 0,
        pf: 0,
        plus_minus: null,
        fouls_committed: null,
        fouls_drawn: null,
        is_starter: player.isStarter,
        dnp: true,
      });
    } else {
      stats.push({
        player_id: baseId,
        team_season_id: teamSeasonId,
        seconds_played: player.secondsPlayed ?? 0,
        pts: player.pts,
        fgm: player.fgm,
        fga: player.fga,
        tpm: player.tpm,
        tpa: player.tpa,
        ftm: player.ftm,
        fta: player.fta,
        oreb: player.oreb,
        dreb: player.dreb,
        ast: player.ast,
        stl: player.stl,
        blk: player.blk,
        tov: player.tov,
        pf: player.pf,
        plus_minus: player.plusMinus,
        fouls_committed: player.foulsCommitted,
        fouls_drawn: player.foulsDrawn,
        is_starter: player.isStarter,
        dnp: false,
      });
    }
  }

  return stats;
}

/**
 * Convert "MM:SS" string to number of seconds.
 * Returns null for falsy or unparseable values.
 */
function parseTimeLeadingToSeconds(
  time: string | null | undefined,
): number | null {
  if (!time) return null;
  const parts = time.split(":");
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (!isNaN(mins) && !isNaN(secs)) return mins * 60 + secs;
  }
  return null;
}

/**
 * Build a TeamStatLine from the parser's exact team totals and flow stats,
 * rather than summing from individual player lines.
 */
function buildTeamStatsFromParser(
  fibaTeam: FibaTeamBoxScore,
  teamSeasonId: string,
  isHome: boolean,
  flow: FibaGameFlowStats | null,
): TeamStatLine {
  const t = fibaTeam.totals ?? null;
  const teamFlow = flow
    ? isHome
      ? {
          pointsFromTurnovers: flow.pointsFromTurnovers?.home ?? null,
          pointsInPaint: flow.pointsInPaint?.home ?? null,
          secondChancePoints: flow.secondChancePoints?.home ?? null,
          fastBreakPoints: flow.fastBreakPoints?.home ?? null,
          benchPoints: flow.benchPoints?.home ?? null,
          biggestLead: flow.biggestLead?.home ?? null,
          biggestScoringRunFor: flow.biggestScoringRun?.homeFor ?? null,
          biggestScoringRunAgainst: flow.biggestScoringRun?.homeAgainst ?? null,
          timeLeadingSeconds:
            flow.timeLeading?.home != null
              ? parseTimeLeadingToSeconds(flow.timeLeading.home)
              : null,
        }
      : {
          pointsFromTurnovers: flow.pointsFromTurnovers?.away ?? null,
          pointsInPaint: flow.pointsInPaint?.away ?? null,
          secondChancePoints: flow.secondChancePoints?.away ?? null,
          fastBreakPoints: flow.fastBreakPoints?.away ?? null,
          benchPoints: flow.benchPoints?.away ?? null,
          biggestLead: flow.biggestLead?.away ?? null,
          biggestScoringRunFor: flow.biggestScoringRun?.awayFor ?? null,
          biggestScoringRunAgainst: flow.biggestScoringRun?.awayAgainst ?? null,
          timeLeadingSeconds:
            flow.timeLeading?.away != null
              ? parseTimeLeadingToSeconds(flow.timeLeading.away)
              : null,
        }
    : null;

  return {
    team_season_id: teamSeasonId,
    pts: t?.pts ?? 0,
    fgm: t?.fgm ?? 0,
    fga: t?.fga ?? 0,
    tpm: t?.threePgm ?? 0,
    tpa: t?.threePga ?? 0,
    ftm: t?.ftm ?? 0,
    fta: t?.fta ?? 0,
    oreb: t?.oreb ?? 0,
    dreb: t?.dreb ?? 0,
    team_reb: fibaTeam.teamReb ?? 0,
    ast: t?.ast ?? 0,
    stl: t?.stl ?? 0,
    blk: t?.blk ?? 0,
    tov: t?.tov ?? 0,
    pf: t?.pf ?? 0,
    fouls_committed: t?.foulsCommitted ?? 0,
    fouls_drawn: t?.foulsDrawn ?? 0,
    points_from_turnovers: teamFlow?.pointsFromTurnovers ?? null,
    points_in_paint: teamFlow?.pointsInPaint ?? null,
    second_chance_points: teamFlow?.secondChancePoints ?? null,
    fast_break_points: teamFlow?.fastBreakPoints ?? null,
    bench_points: teamFlow?.benchPoints ?? null,
    biggest_lead: teamFlow?.biggestLead ?? null,
    biggest_scoring_run_for: teamFlow?.biggestScoringRunFor ?? null,
    biggest_scoring_run_against: teamFlow?.biggestScoringRunAgainst ?? null,
    time_leading_seconds: teamFlow?.timeLeadingSeconds ?? null,
  };
}

/** Extract the jersey number from a roster_entries value that may be an object or array. */
function getJerseyNumber(entry: GameRosterWithJersey): number | null {
  const val = entry.roster_entries;
  if (Array.isArray(val)) {
    return val[0]?.jersey_number ?? null;
  }
  return val?.jersey_number ?? null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: gameId } = await params;

  const formData = await request.formData();
  const file = formData.get("file");
  const rightsConfirmed = formData.get("rightsConfirmed") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDF файл оруулна уу" }, { status: 400 });
  }
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return NextResponse.json(
      { error: "Зөвхөн PDF файл хүлээн авна" },
      { status: 400 },
    );
  }
  if (file.size > MAX_PDF_SIZE) {
    return NextResponse.json(
      { error: "Файлын хэмжээ 10MB-с хэтэрсэн байна" },
      { status: 400 },
    );
  }
  if (!rightsConfirmed) {
    return NextResponse.json(
      { error: "Эрхээ баталгаажуулна уу" },
      { status: 400 },
    );
  }
  try {
    // Dynamic import unpdf — only loaded when this route is hit, saving 1.6 MB from the critical server bundle
    const { extractTextItems, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(
      new Uint8Array(await file.arrayBuffer()),
    );
    const { items } = await extractTextItems(pdf);

    const totalTextItems = items.reduce(
      (sum: number, page: unknown) => sum + (page as unknown[]).length,
      0,
    );
    if (totalTextItems === 0) {
      return NextResponse.json(
        {
          error:
            "Энэ PDF-д текст байхгүй байна. Зөвхөн текстэн FIBA statistics файл оруулна уу.",
        },
        { status: 422 },
      );
    }

    const allTextItems = items.flatMap((page: unknown) => {
      const typedPage = page as FibaTextItem[];
      return fibaTextItemsToLines(typedPage);
    });
    const boxScore = parseFibaOfficialStats(allTextItems);

    // ── 2. Fetch game + rosters for player mapping ──────────────────
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("home_team_season_id, away_team_season_id")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Тоглолт олдсонгүй" }, { status: 404 });
    }

    const { data: rosterEntries, error: rosterError } = await supabase
      .from("game_rosters")
      .select(`
        player_id,
        team_season_id,
        roster_entries!inner(jersey_number)
      `)
      .eq("game_id", gameId);

    if (rosterError) {
      Sentry.captureException(rosterError, { extra: { gameId } });
      return NextResponse.json(
        { error: "Тоглогчдын жагсаалт дуудахад алдаа гарлаа" },
        { status: 500 },
      );
    }

    const typedRosterEntries = (rosterEntries ?? []) as GameRosterWithJersey[];
    const teamRosterMap = new Map<string, Map<number, string>>();
    for (const entry of typedRosterEntries) {
      const jerseyNum = getJerseyNumber(entry);
      if (jerseyNum == null) continue;
      let map = teamRosterMap.get(entry.team_season_id);
      if (!map) {
        map = new Map<number, string>();
        teamRosterMap.set(entry.team_season_id, map);
      }
      map.set(jerseyNum, entry.player_id);
    }

    // ── 3. Build player and team stats ──────────────────────────────
    const allPlayerStats: PlayerStatLine[] = [];
    const allTeamStats: TeamStatLine[] = [];
    const unmatchedPlayers: Array<{
      teamCode: string;
      jerseyNumber: number;
      name: string;
    }> = [];

    for (const fibaTeam of boxScore.teams) {
      const isHome = boxScore.teams.indexOf(fibaTeam) === 0;
      const teamSeasonId = isHome
        ? game.home_team_season_id
        : game.away_team_season_id;

      const rosterMap =
        teamRosterMap.get(teamSeasonId) ?? new Map<number, string>();

      const teamPlayerStats = buildPlayerStats(
        fibaTeam.players,
        teamSeasonId,
        rosterMap,
        fibaTeam.code,
      );

      for (const player of fibaTeam.players) {
        if (!player.dnp && !rosterMap.has(player.jerseyNumber)) {
          unmatchedPlayers.push({
            teamCode: fibaTeam.code,
            jerseyNumber: player.jerseyNumber,
            name: player.name,
          });
        }
      }

      allPlayerStats.push(...teamPlayerStats);
      allTeamStats.push(
        buildTeamStatsFromParser(fibaTeam, teamSeasonId, isHome, boxScore.flow),
      );
    }

    // ── 4. Upload evidence PDF ──────────────────────────────────────
    const evidencePath = `${gameId}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("evidence")
      .upload(evidencePath, file, {
        cacheControl: "31536000",
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      Sentry.captureException(uploadError, { extra: { gameId } });
      return NextResponse.json(
        { error: "Нотлох PDF хадгалж чадсангүй" },
        { status: 500 },
      );
    }

    // ── 5. Build unified projection ────────────────────────────────
    const projection: Json = {
      players: allPlayerStats,
      teams: allTeamStats,
      summary: boxScore.flow
        ? {
            lead_changes: boxScore.flow.leadChanges ?? null,
            times_tied: boxScore.flow.timesTied ?? null,
          }
        : null,
      period_scores:
        boxScore.periodScores.length > 0
          ? boxScore.periodScores.map((ps) => ({
              period: ps.period,
              home_points: ps.homePoints,
              away_points: ps.awayPoints,
            }))
          : null,
      scoring_checkpoints:
        boxScore.scoringCheckpoints.length > 0
          ? boxScore.scoringCheckpoints.map((sc) => ({
              elapsed_seconds: sc.elapsedSeconds,
              home_score: sc.homeScore,
              away_score: sc.awayScore,
            }))
          : null,
    };

    // ── 6. Submit and materialize via RPC ───────────────────────────
    const normalizedPayload: Json = JSON.parse(JSON.stringify(boxScore));
    const homeScore = boxScore.score.home;
    const awayScore = boxScore.score.away;

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "cmd_submit_official_stats",
      {
        p_game_id: gameId,
        p_evidence_url: evidencePath,
        p_normalized_payload: normalizedPayload,
        p_projection: projection,
        p_home_score: homeScore,
        p_away_score: awayScore,
      },
    );

    if (rpcError) {
      await supabase.storage.from("evidence").remove([evidencePath]);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    // ── 6. Return result ────────────────────────────────────────────
    const typedResult = rpcResult as SubmitOfficialStatsResult | null;
    return NextResponse.json(
      {
        synced: true,
        submissionId: typedResult?.submission_id,
        revisionId: typedResult?.revision_id,
        revisionNumber: typedResult?.revision_number,
        boxScore,
        unmatchedPlayers:
          unmatchedPlayers.length > 0 ? unmatchedPlayers : undefined,
      },
      { status: 201 },
    );
  } catch (error) {
    Sentry.captureException(error, { extra: { gameId } });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `PDF-г FIBA албан ёсны статистик хэлбэрээр уншиж чадсангүй: ${error.message}`
            : "PDF-г FIBA албан ёсны статистик хэлбэрээр уншиж чадсангүй",
      },
      { status: 422 },
    );
  }
}
