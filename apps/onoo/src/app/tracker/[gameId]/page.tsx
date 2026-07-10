"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deriveBoxScore } from "@onoo/core/stats";
import { sortEvents } from "@onoo/core/events";
import { formatClock, describeEvent } from "@onoo/core/format";
import type {
  StatEvent,
  GameRoster,
  SportConfig,
  BoxScoreLine,
  TeamBoxScoreLine,
  Json,
} from "@onoo/core/types";
import { EventQueue } from "@onoo/core/sync";

// Types
interface GameState {
  id: string;
  status: string;
  home_team_season_id: string;
  away_team_season_id: string;
  home_score: number | null;
  away_score: number | null;
  current_period: number;
  competition_id: string;
}

interface TeamInfo {
  id: string;
  name: string;
  short_code: string;
  primary_color: string | null;
}

// Constants
const DEFAULT_SPORT_CONFIG: SportConfig = {
  periods: 4,
  period_minutes: 10,
  overtime_minutes: 5,
  fouls_to_bonus: 5,
  personal_foul_limit: 5,
  players_on_court: 5,
};

export default function TrackerPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;

  // State
  const [game, setGame] = useState<GameState | null>(null);
  const [homeTeam, setHomeTeam] = useState<TeamInfo | null>(null);
  const [awayTeam, setAwayTeam] = useState<TeamInfo | null>(null);
  const [rosters, setRosters] = useState<GameRoster[]>([]);
  const [events, setEvents] = useState<StatEvent[]>([]);
  const [sportConfig, setSportConfig] = useState<SportConfig>(DEFAULT_SPORT_CONFIG);

  // Clock state
  const [clockRunning, setClockRunning] = useState(false);
  const [clockSeconds, setClockSeconds] = useState(600);
  const clockInterval = useRef<NodeJS.Timeout | null>(null);

  // UI state
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showBench, setShowBench] = useState<string | null>(null); // teamSeasonId
  const [pendingAssist, setPendingAssist] = useState<{
    eventId: string;
    assistedBy: string;
  } | null>(null);

  // Queue
  const queueRef = useRef<EventQueue | null>(null);

  // Supabase client
  const supabase = createClient();

  // Load game data
  useEffect(() => {
    async function loadGame() {
      // Load game
      const { data: gameData } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (gameData) {
        setGame(gameData);
        setClockSeconds(
          gameData.current_period > sportConfig.periods
            ? sportConfig.overtime_minutes * 60
            : sportConfig.period_minutes * 60
        );
      }

      // Load teams
      if (gameData) {
        const { data: home } = await supabase
          .from("team_seasons")
          .select("teams(*)")
          .eq("id", gameData.home_team_season_id)
          .single();
        if (home?.teams) setHomeTeam(home.teams as unknown as TeamInfo);

        const { data: away } = await supabase
          .from("team_seasons")
          .select("teams(*)")
          .eq("id", gameData.away_team_season_id)
          .single();
        if (away?.teams) setAwayTeam(away.teams as unknown as TeamInfo);
      }

      // Load rosters
      const { data: rosterData } = await supabase
        .from("game_rosters")
        .select("*")
        .eq("game_id", gameId);
      if (rosterData) setRosters(rosterData);

      // Load existing events
      const { data: existingEvents } = await supabase
        .from("stat_events")
        .select("*")
        .eq("game_id", gameId)
        .is("deleted_at", null);
      if (existingEvents) setEvents(existingEvents);

      // Load sport config
      const { data: sport } = await supabase
        .from("sports")
        .select("config")
        .eq("key", "basketball_5x5")
        .single();
      if (sport?.config) setSportConfig(sport.config as SportConfig);
    }

    loadGame();
  }, [gameId, supabase]);

  // Initialize queue
  useEffect(() => {
    queueRef.current = new EventQueue();
  }, []);

  // Clock tick
  useEffect(() => {
    if (clockRunning && clockSeconds > 0) {
      clockInterval.current = setInterval(() => {
        setClockSeconds((prev) => {
          if (prev <= 0) {
            setClockRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (clockInterval.current) clearInterval(clockInterval.current);
    };
  }, [clockRunning, clockSeconds]);

  // Derive box score
  const derived = deriveBoxScore({ events, rosters, sportConfig });

  // Get on-court players for a team
  const getOnCourt = useCallback(
    (teamSeasonId: string): string[] => {
      const starters = rosters
        .filter((r) => r.team_season_id === teamSeasonId && r.is_starter)
        .map((r) => r.player_id);

      // Apply substitutions
      const subs = sortEvents(events).filter(
        (e) => e.event_type === "substitution" && e.team_season_id === teamSeasonId
      );

      let onCourt = [...starters];
      for (const sub of subs) {
        const p = sub.payload as { in_player_id?: string; out_player_id?: string };
        if (p.in_player_id && p.out_player_id) {
          onCourt = onCourt.filter((id) => id !== p.out_player_id);
          onCourt.push(p.in_player_id);
        }
      }
      return onCourt;
    },
    [rosters, events]
  );

  // Create event
  const createEvent = useCallback(
    async (
      eventType: string,
      teamSeasonId: string | null,
      playerId: string | null,
      payload: Record<string, unknown> = {}
    ) => {
      if (!game) return;

      const clientId = crypto.randomUUID();
      const localSeq = events.length + 1;

      const newEvent: StatEvent = {
        id: clientId,
        game_id: gameId,
        tracker_session_id: "local",
        operation_id: clientId,
        client_id: clientId,
        local_seq: localSeq,
        event_type: eventType,
        period: game.current_period,
        clock_seconds: clockSeconds,
        team_season_id: teamSeasonId,
        player_id: playerId,
        payload: payload satisfies Record<string, unknown> as unknown as Json,
        created_by: "local",
        created_at: new Date().toISOString(),
        voided_at: null,
        voided_by: null,
        void_reason: null,
        superseded_by: null,
      };

      // Add to local state
      setEvents((prev) => [...prev, newEvent]);

      // Add to queue
      queueRef.current?.enqueue({ kind: "insert", event: newEvent });

      // Save to Supabase
      const { error } = await supabase.from("stat_events").insert({
        game_id: gameId,
        tracker_session_id: "local",
        operation_id: clientId,
        client_id: clientId,
        local_seq: localSeq,
        event_type: eventType,
        period: game.current_period,
        clock_seconds: clockSeconds,
        team_season_id: teamSeasonId,
        player_id: playerId,
        payload: payload satisfies Record<string, unknown> as unknown as Json,
        created_by: "local",
      });

      if (error) {
        console.error("Failed to save event:", error);
      }

      return newEvent;
    },
    [game, gameId, events.length, clockSeconds, supabase]
  );

  // Handle stat action
  const handleStat = useCallback(
    async (eventType: string) => {
      if (!selectedPlayer || !selectedTeam) return;

      const newEvent = await createEvent(eventType, selectedTeam, selectedPlayer);

      // Check if this is a made shot that needs assist follow-up
      if (newEvent && eventType.includes("made") && !eventType.includes("ft")) {
        setPendingAssist({
          eventId: newEvent.id,
          assistedBy: "",
        });
      }

      setSelectedPlayer(null);
    },
    [selectedPlayer, selectedTeam, createEvent]
  );

  // Handle assist
  const handleAssist = useCallback(
    async (assisterId: string) => {
      if (!pendingAssist) return;

      // Update the event payload with assist
      setEvents((prev) =>
        prev.map((e) =>
          e.id === pendingAssist.eventId
            ? { ...e, payload: { ...(e.payload as Record<string, unknown>), assisted_by: assisterId } }
            : e
        )
      );

      // Update in Supabase
      await supabase
        .from("stat_events")
        .update({ payload: { assisted_by: assisterId } })
        .eq("id", pendingAssist.eventId);

      setPendingAssist(null);
    },
    [pendingAssist, supabase]
  );

  // Handle substitution
  const handleSubstitution = useCallback(
    async (teamSeasonId: string, inPlayerId: string, outPlayerId: string) => {
      await createEvent("substitution", teamSeasonId, null, {
        in_player_id: inPlayerId,
        out_player_id: outPlayerId,
      });
      setShowBench(null);
    },
    [createEvent]
  );

  // Handle period transition
  const handlePeriodEnd = useCallback(async () => {
    if (!game) return;

    await createEvent("period_end", null, null);

    const nextPeriod = game.current_period + 1;
    const isOvertime = nextPeriod > sportConfig.periods;
    const periodLen = isOvertime
      ? sportConfig.overtime_minutes * 60
      : sportConfig.period_minutes * 60;

    // Update game period
    await supabase
      .from("games")
      .update({ current_period: nextPeriod })
      .eq("id", gameId);

    setGame((prev) => (prev ? { ...prev, current_period: nextPeriod } : prev));
    setClockSeconds(periodLen);
    setClockRunning(false);
  }, [game, gameId, sportConfig, createEvent, supabase]);

  // Handle game start
  const handleGameStart = useCallback(async () => {
    if (!game) return;

    // Set status to live
    await supabase
      .from("games")
      .update({ status: "live", current_period: 1 })
      .eq("id", gameId);

    setGame((prev) => (prev ? { ...prev, status: "live", current_period: 1 } : prev));

    // Create game_start event
    await createEvent("game_start", null, null);

    // Create period_start event
    await createEvent("period_start", null, null, {});

    setClockSeconds(sportConfig.period_minutes * 60);
    setClockRunning(true);
  }, [game, gameId, sportConfig, createEvent, supabase]);

  // Handle game end
  const handleGameEnd = useCallback(async () => {
    if (!game) return;

    // Stop clock
    setClockRunning(false);

    // Create period_end if clock is running
    if (clockSeconds > 0) {
      await createEvent("period_end", null, null);
    }

    // Create game_end event
    await createEvent("game_end", null, null);

    // Call derive-game Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/derive-game`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ game_id: gameId, mode: "finalize" }),
      }
    );

    if (response.ok) {
      router.push(`/games/${gameId}`);
    }
  }, [game, gameId, clockSeconds, createEvent, supabase, router]);

  // Render
  if (!game || !homeTeam || !awayTeam) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Ачаалж байна...</p>
      </div>
    );
  }

  const homeOnCourt = getOnCourt(game.home_team_season_id);
  const awayOnCourt = getOnCourt(game.away_team_season_id);

  const homeRosters = rosters.filter(
    (r) => r.team_season_id === game.home_team_season_id
  );
  const awayRosters = rosters.filter(
    (r) => r.team_season_id === game.away_team_season_id
  );

  const homeBench = homeRosters.filter(
    (r) => !homeOnCourt.includes(r.player_id)
  );
  const awayBench = awayRosters.filter(
    (r) => !awayOnCourt.includes(r.player_id)
  );

  // Handle undo (soft delete last event)
  const handleUndo = useCallback(async () => {
    if (events.length === 0) return;

    const lastEvent = events[events.length - 1];
    if (!lastEvent) return;

    // Update local state
    setEvents((prev) => prev.slice(0, -1));

    // Soft delete in Supabase
    await supabase
      .from("stat_events")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", lastEvent.id);
  }, [events, supabase]);

  const isSetup = game.status === "scheduled";
  const isLive = game.status === "live_provisional";

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      {/* Top Bar */}
      <header className="flex items-center justify-between bg-gray-800 p-4">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">{homeTeam.short_code}</span>
          <span className="text-3xl font-bold">
            {derived.homeAwayScore[game.home_team_season_id] ?? 0}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-2xl font-mono">{formatClock(clockSeconds)}</div>
          <div className="text-sm text-gray-400">
            Үе {game.current_period} | {isLive ? "Амьд" : isSetup ? "Эхлэх" : "Дууссан"}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold">
            {derived.homeAwayScore[game.away_team_season_id] ?? 0}
          </span>
          <span className="text-lg font-bold">{awayTeam.short_code}</span>
        </div>
      </header>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 bg-gray-800 p-2">
        {isSetup && (
          <button
            onClick={handleGameStart}
            className="rounded bg-green-600 px-4 py-2 font-bold hover:bg-green-700"
          >
            Эхлэх
          </button>
        )}

        {isLive && (
          <>
            <button
              onClick={() => setClockRunning(!clockRunning)}
              className={`rounded px-4 py-2 font-bold ${
                clockRunning
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {clockRunning ? "Зогсоох" : "Үргэлжлүүлэх"}
            </button>

            <button
              onClick={handlePeriodEnd}
              className="rounded bg-yellow-600 px-4 py-2 font-bold hover:bg-yellow-700"
            >
              Үе дуусгах
            </button>

            <button
              onClick={handleGameEnd}
              className="rounded bg-red-600 px-4 py-2 font-bold hover:bg-red-700"
            >
              Тоглолт дуусгах
            </button>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Home Team */}
        <div className="flex w-1/3 flex-col border-r border-gray-700">
          <div className="bg-gray-800 p-2 text-center font-bold">
            {homeTeam.name}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {homeOnCourt.map((playerId) => {
              const roster = homeRosters.find((r) => r.player_id === playerId);
              const line = derived.players.find((p) => p.playerId === playerId);
              return (
                <button
                  key={playerId}
                  onClick={() => {
                    setSelectedPlayer(playerId);
                    setSelectedTeam(game.home_team_season_id);
                  }}
                  className={`mb-2 w-full rounded p-2 text-left ${
                    selectedPlayer === playerId
                      ? "bg-blue-600"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <div className="font-bold">
                    #{(roster as any).jersey_number ?? "?"} {line?.playerId.slice(0, 8)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {line?.pts ?? 0} pts | {line?.ast ?? 0} ast
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setShowBench(game.home_team_season_id)}
            className="bg-gray-800 p-2 text-sm hover:bg-gray-700"
          >
            Суудлын тоглогчид ({homeBench.length})
          </button>
        </div>

        {/* Action Grid */}
        <div className="flex w-1/3 flex-col">
          {pendingAssist ? (
            <div className="flex-1 p-4">
              <h3 className="mb-4 text-lg font-bold">Олгосон хүн?</h3>
              <div className="grid grid-cols-2 gap-2">
                {rosters
                  .filter(
                    (r) =>
                      r.team_season_id === selectedTeam &&
                      r.player_id !== pendingAssist.eventId
                  )
                  .map((r) => (
                    <button
                      key={r.player_id}
                      onClick={() => handleAssist(r.player_id)}
                      className="rounded bg-gray-700 p-2 hover:bg-gray-600"
                    >
                      #{(r as any).jersey_number}
                    </button>
                  ))}
              </div>
              <button
                onClick={() => setPendingAssist(null)}
                className="mt-4 w-full rounded bg-gray-600 p-2 hover:bg-gray-500"
              >
                Үл хэрэгсэх
              </button>
            </div>
          ) : showBench ? (
            <div className="flex-1 p-4">
              <h3 className="mb-4 text-lg font-bold">Суудлын тоглогчид</h3>
              <div className="grid grid-cols-2 gap-2">
                {(showBench === game.home_team_season_id ? homeBench : awayBench).map(
                  (r) => (
                    <button
                      key={r.player_id}
                      onClick={() => {
                        if (selectedPlayer) {
                          handleSubstitution(
                            showBench,
                            r.player_id,
                            selectedPlayer
                          );
                        }
                      }}
                      className="rounded bg-gray-700 p-2 hover:bg-gray-600"
                    >
                      #{(r as any).jersey_number}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={() => setShowBench(null)}
                className="mt-4 w-full rounded bg-gray-600 p-2 hover:bg-gray-500"
              >
                Цуцлах
              </button>
            </div>
          ) : (
            <div className="flex-1 p-4">
              <h3 className="mb-4 text-lg font-bold">Үйлдэл</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStat("shot_2pt_made")}
                  disabled={!selectedPlayer}
                  className="rounded bg-green-600 p-3 font-bold hover:bg-green-700 disabled:opacity-50"
                >
                  2PT ✓
                </button>
                <button
                  onClick={() => handleStat("shot_2pt_missed")}
                  disabled={!selectedPlayer}
                  className="rounded bg-red-600 p-3 font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  2PT ✗
                </button>
                <button
                  onClick={() => handleStat("shot_3pt_made")}
                  disabled={!selectedPlayer}
                  className="rounded bg-green-600 p-3 font-bold hover:bg-green-700 disabled:opacity-50"
                >
                  3PT ✓
                </button>
                <button
                  onClick={() => handleStat("shot_3pt_missed")}
                  disabled={!selectedPlayer}
                  className="rounded bg-red-600 p-3 font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  3PT ✗
                </button>
                <button
                  onClick={() => handleStat("ft_made")}
                  disabled={!selectedPlayer}
                  className="rounded bg-green-600 p-3 font-bold hover:bg-green-700 disabled:opacity-50"
                >
                  FT ✓
                </button>
                <button
                  onClick={() => handleStat("ft_missed")}
                  disabled={!selectedPlayer}
                  className="rounded bg-red-600 p-3 font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  FT ✗
                </button>
                <button
                  onClick={() => handleStat("rebound_off")}
                  disabled={!selectedPlayer}
                  className="rounded bg-blue-600 p-3 font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  OREB
                </button>
                <button
                  onClick={() => handleStat("rebound_def")}
                  disabled={!selectedPlayer}
                  className="rounded bg-blue-600 p-3 font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  DREB
                </button>
                <button
                  onClick={() => handleStat("steal")}
                  disabled={!selectedPlayer}
                  className="rounded bg-purple-600 p-3 font-bold hover:bg-purple-700 disabled:opacity-50"
                >
                  STL
                </button>
                <button
                  onClick={() => handleStat("block")}
                  disabled={!selectedPlayer}
                  className="rounded bg-purple-600 p-3 font-bold hover:bg-purple-700 disabled:opacity-50"
                >
                  BLK
                </button>
                <button
                  onClick={() => handleStat("turnover")}
                  disabled={!selectedPlayer}
                  className="rounded bg-orange-600 p-3 font-bold hover:bg-orange-700 disabled:opacity-50"
                >
                  TOV
                </button>
                <button
                  onClick={() => handleStat("foul_personal")}
                  disabled={!selectedPlayer}
                  className="rounded bg-yellow-600 p-3 font-bold hover:bg-yellow-700 disabled:opacity-50"
                >
                  FOUL
                </button>
              </div>

              {/* Team actions */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    createEvent("rebound_team", selectedTeam ?? game.home_team_season_id, null)
                  }
                  className="rounded bg-gray-600 p-2 hover:bg-gray-500"
                >
                  TEAM REB
                </button>
                <button
                  onClick={() =>
                    createEvent("timeout", selectedTeam ?? game.home_team_season_id, null)
                  }
                  className="rounded bg-gray-600 p-2 hover:bg-gray-500"
                >
                  TIMEOUT
                </button>
                <button
                  onClick={() => setShowBench(selectedTeam ?? game.home_team_season_id)}
                  className="col-span-2 rounded bg-gray-600 p-2 hover:bg-gray-500"
                >
                  SUB
                </button>
              </div>
            </div>
          )}

          {/* Recent events */}
          <div className="border-t border-gray-700 p-2">
            <h4 className="mb-2 text-sm font-bold text-gray-400">Сүүлийн үйлдлүүд</h4>
            <div className="max-h-32 overflow-y-auto">
              {sortEvents(events)
                .slice(-6)
                .reverse()
                .map((e) => (
                  <div key={e.id} className="text-xs text-gray-500">
                    {formatClock(e.clock_seconds)} - {describeEvent(e as any, "mn")}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Away Team */}
              <button
                onClick={handleUndo}
                disabled={events.length === 0}
                className="mt-2 w-full rounded bg-red-600 p-2 text-sm hover:bg-red-700 disabled:opacity-50"
              >
                Цуцлах (Undo)
              </button>
        <div className="flex w-1/3 flex-col border-l border-gray-700">
          <div className="bg-gray-800 p-2 text-center font-bold">
            {awayTeam.name}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {awayOnCourt.map((playerId) => {
              const roster = awayRosters.find((r) => r.player_id === playerId);
              const line = derived.players.find((p) => p.playerId === playerId);
              return (
                <button
                  key={playerId}
                  onClick={() => {
                    setSelectedPlayer(playerId);
                    setSelectedTeam(game.away_team_season_id);
                  }}
                  className={`mb-2 w-full rounded p-2 text-left ${
                    selectedPlayer === playerId
                      ? "bg-blue-600"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <div className="font-bold">
                    #{(roster as any).jersey_number ?? "?"} {line?.playerId.slice(0, 8)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {line?.pts ?? 0} pts | {line?.ast ?? 0} ast
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setShowBench(game.away_team_season_id)}
            className="bg-gray-800 p-2 text-sm hover:bg-gray-700"
          >
            Суудлын тоглогчид ({awayBench.length})
          </button>
        </div>
      </div>
    </div>
  );
}
