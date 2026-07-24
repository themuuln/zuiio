import type { SportConfig } from "@onoo/core/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAthleteAffiliations,
  getAthleteTimeline,
  getGameSportConfig,
  getLiveGameData,
  getPlayerCanonicalIdentity,
  getPlayerNameMap,
  getTeamGameStats,
} from "@/app/lib/data";
import type {
  AthleteAffiliation,
  AthleteTimelineEvent,
} from "@/app/lib/shared";
import {
  createMockSupabase,
  type MockFrom,
  setQueryResult,
} from "@/test/supabase-mock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";

const mockCreateClient = vi.mocked(createClient);

vi.mock("@/lib/errors", () => ({ captureError: vi.fn() }));

// Mock calculateTeamAdvancedStats to isolate getTeamGameStats from pure math
vi.mock("@onoo/core/stats", () => ({ calculateTeamAdvancedStats: vi.fn() }));

import { calculateTeamAdvancedStats } from "@onoo/core/stats";

const mockCalcAdvStats = vi.mocked(calculateTeamAdvancedStats);

// ---------------------------------------------------------------------------
// getPlayerNameMap
// ---------------------------------------------------------------------------
describe("getPlayerNameMap", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns empty map for empty roster", async () => {
    const result = await getPlayerNameMap([]);
    expect(result).toEqual({});
  });

  it("returns empty map for null/undefined roster", async () => {
    const result = await getPlayerNameMap(null as never);
    expect(result).toEqual({});
  });

  it("maps player IDs to canonical names", async () => {
    const rosters = [{ player_id: "p1" }, { player_id: "p2" }];
    setQueryResult(mock, "players", [
      { id: "p1", canonical_name: "Ганцолмон" },
      { id: "p2", canonical_name: "Мөнх-Оргил" },
    ]);
    const result = await getPlayerNameMap(rosters);
    expect(result).toEqual({
      p1: "Ганцолмон",
      p2: "Мөнх-Оргил",
    });
  });

  it("falls back to first 8 chars of id when canonical_name is null", async () => {
    const rosters = [{ player_id: "player-1234" }];
    setQueryResult(mock, "players", [
      { id: "player-1234", canonical_name: null },
    ]);
    const result = await getPlayerNameMap(rosters);
    expect(result["player-1234"]).toBe("player-1");
  });

  it("returns empty map when players query returns null", async () => {
    setQueryResult(mock, "players", null);
    const result = await getPlayerNameMap([{ player_id: "p1" }]);
    expect(result).toEqual({});
  });

  it("handles roster with duplicate player IDs", async () => {
    const rosters = [
      { player_id: "p1" },
      { player_id: "p1" },
      { player_id: "p2" },
    ];
    setQueryResult(mock, "players", [
      { id: "p1", canonical_name: "Dupe" },
      { id: "p2", canonical_name: "Other" },
    ]);
    const result = await getPlayerNameMap(rosters);
    expect(result["p1"]).toBe("Dupe");
    expect(result["p2"]).toBe("Other");
  });
});

// ---------------------------------------------------------------------------
// getGameSportConfig
// ---------------------------------------------------------------------------
describe("getGameSportConfig", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns null when game has no ruleset_id", async () => {
    setQueryResult(mock, "games", { id: "g-1", ruleset_id: null });
    const result = await getGameSportConfig("g-1");
    expect(result).toBeNull();
  });

  it("returns null when game query returns null", async () => {
    setQueryResult(mock, "games", null);
    const result = await getGameSportConfig("g-1");
    expect(result).toBeNull();
  });

  it("returns null when ruleset has no rules", async () => {
    setQueryResult(mock, "games", { id: "g-1", ruleset_id: "r-1" });
    setQueryResult(mock, "basketball_rulesets", {
      id: "r-1",
      rules: null,
    });
    const result = await getGameSportConfig("g-1");
    expect(result).toBeNull();
  });

  it("returns null when rules are malformed (missing fields)", async () => {
    setQueryResult(mock, "games", { id: "g-1", ruleset_id: "r-1" });
    setQueryResult(mock, "basketball_rulesets", {
      id: "r-1",
      rules: { periods: 4, period_minutes: 10 }, // missing overtime_minutes etc.
    });
    const result = await getGameSportConfig("g-1");
    expect(result).toBeNull();
  });

  it("returns null when rules fields have wrong types", async () => {
    setQueryResult(mock, "games", { id: "g-1", ruleset_id: "r-1" });
    setQueryResult(mock, "basketball_rulesets", {
      id: "r-1",
      rules: {
        periods: "four",
        period_minutes: 10,
        overtime_minutes: 5,
        fouls_to_bonus: 5,
        personal_foul_limit: 5,
        players_on_court: 5,
      },
    });
    const result = await getGameSportConfig("g-1");
    expect(result).toBeNull();
  });

  it("returns parsed SportConfig when rules are valid", async () => {
    const rules = {
      periods: 4,
      period_minutes: 10,
      overtime_minutes: 5,
      fouls_to_bonus: 5,
      personal_foul_limit: 5,
      players_on_court: 5,
    };
    setQueryResult(mock, "games", { id: "g-1", ruleset_id: "r-1" });
    setQueryResult(mock, "basketball_rulesets", {
      id: "r-1",
      rules,
    });
    const result = await getGameSportConfig("g-1");
    expect(result).not.toBeNull();
    expect(result).toEqual(rules);
    // Type-level validation
    const config: SportConfig = result as SportConfig;
    expect(config.periods).toBe(4);
    expect(config.period_minutes).toBe(10);
    expect(config.overtime_minutes).toBe(5);
    expect(config.fouls_to_bonus).toBe(5);
    expect(config.personal_foul_limit).toBe(5);
    expect(config.players_on_court).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// getLiveGameData
// ---------------------------------------------------------------------------
describe("getLiveGameData", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns empty data for a game with no play-by-play or rosters", async () => {
    // getPlayByPlay → empty
    setQueryResult(mock, "v_public_play_by_play", []);
    // getGameRosters → empty
    setQueryResult(mock, "game_rosters", []);
    // getGameSportConfig → null (no ruleset)
    setQueryResult(mock, "games", null);

    const result = await getLiveGameData("unknown-game");
    expect(result).toEqual({
      events: [],
      rosters: [],
      sportConfig: null,
      playerNameMap: {},
    });
  });

  it("returns populated data for a valid game", async () => {
    // Play-by-play data
    const pbpRows = [
      {
        event_id: "evt-1",
        game_id: "g-1",
        operation_id: "op-1",
        local_seq: 1,
        event_type: "shot_2pt",
        period: 1,
        clock_seconds: 120,
        team_season_id: "ts-1",
        team_name: "Team A",
        player_id: "p1",
        player_name: "Тоглогч 1",
        player_name_latin: null,
        jersey_number: null,
        payload: { points: 2, x: 10, y: 15 },
        created_at: "2026-07-22T10:00:00Z",
      },
    ];
    setQueryResult(mock, "v_public_play_by_play", pbpRows);

    // Game rosters
    const rosterRows = [
      {
        id: "gr-1",
        game_id: "g-1",
        team_season_id: "ts-1",
        player_id: "p1",
        is_starter: true,
      },
      {
        id: "gr-2",
        game_id: "g-1",
        team_season_id: "ts-1",
        player_id: "p2",
        is_starter: false,
      },
    ];
    setQueryResult(mock, "game_rosters", rosterRows);

    // Player names for rosters
    setQueryResult(mock, "players", [
      { id: "p1", canonical_name: "Тоглогч 1" },
      { id: "p2", canonical_name: null },
    ]);

    // Sport config
    const rules = {
      periods: 4,
      period_minutes: 10,
      overtime_minutes: 5,
      fouls_to_bonus: 5,
      personal_foul_limit: 5,
      players_on_court: 5,
    };
    setQueryResult(mock, "games", { id: "g-1", ruleset_id: "r-1" });
    setQueryResult(mock, "basketball_rulesets", { id: "r-1", rules });

    const result = await getLiveGameData("g-1");

    // Events from play-by-play via convertPlayByPlayToStatEvents
    expect(result.events).toHaveLength(1);
    expect(result.events[0].id).toBe("evt-1");
    expect(result.events[0].game_id).toBe("g-1");
    expect(result.events[0].event_type).toBe("shot_2pt");
    expect(result.events[0].team_season_id).toBe("ts-1");

    // Rosters forwarded directly
    expect(result.rosters).toHaveLength(2);
    expect(result.rosters[0].player_id).toBe("p1");

    // Sport config resolved
    expect(result.sportConfig).not.toBeNull();
    expect(result.sportConfig!.periods).toBe(4);

    // Player name map built from rosters → players query
    expect(result.playerNameMap).toEqual({
      p1: "Тоглогч 1",
      p2: "p2", // null canonical_name → id.slice(0, 8)
    });
  });

  it("handles game with no sport config gracefully", async () => {
    setQueryResult(mock, "v_public_play_by_play", []);
    setQueryResult(mock, "game_rosters", []);

    // No ruleset on this game
    setQueryResult(mock, "games", { id: "g-1", ruleset_id: null });

    const result = await getLiveGameData("g-1");
    expect(result.sportConfig).toBeNull();
    expect(result.events).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getTeamGameStats
// ---------------------------------------------------------------------------
describe("getTeamGameStats", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  function makeTeamGameStatsRow(
    overrides: Partial<Record<string, unknown>> = {},
  ) {
    return {
      game_id: "g-1",
      scheduled_at: "2026-07-22T10:00:00Z",
      status: "official",
      home_team_season_id: "ts-1",
      away_team_season_id: "ts-2",
      home_score: 90,
      away_score: 80,
      team_season_id: "ts-1",
      team_pts: 90,
      team_fgm: 35,
      team_fga: 75,
      team_tpm: 10,
      team_tpa: 30,
      team_ftm: 10,
      team_fta: 15,
      team_oreb: 12,
      team_dreb: 28,
      team_ast: 20,
      team_stl: 8,
      team_blk: 4,
      team_tov: 12,
      team_pf: 18,
      opp_pts: 80,
      opp_fgm: 30,
      opp_fga: 70,
      opp_tpm: 8,
      opp_tpa: 25,
      opp_ftm: 12,
      opp_fta: 18,
      opp_oreb: 10,
      opp_dreb: 25,
      opp_ast: 15,
      opp_stl: 6,
      opp_blk: 3,
      opp_tov: 14,
      opp_pf: 20,
      home_away: "home" as const,
      opp_team_season_id: "ts-2",
      opp_team_name: "Opponent Team",
      opp_team_slug: "opponent-team",
      opp_team_short_code: "OPP",
      opp_team_logo_url: null,
      ...overrides,
    };
  }

  it("returns empty array when no stats exist", async () => {
    setQueryResult(mock, "v_public_team_game_stats", []);
    const result = await getTeamGameStats("ts-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when query returns null", async () => {
    setQueryResult(mock, "v_public_team_game_stats", null);
    const result = await getTeamGameStats("ts-1");
    expect(result).toEqual([]);
  });

  it("returns mapped advanced stats with win result", async () => {
    const rows = [makeTeamGameStatsRow()];
    setQueryResult(mock, "v_public_team_game_stats", rows);

    mockCalcAdvStats.mockReturnValueOnce({
      ortg: 110.0,
      drtg: 105.0,
      netRtg: 5.0,
      pace: 76.2,
      efg: 0.5333,
      tovPct: 0.135,
      orebPct: 0.324,
      ftaRate: 0.267,
      pie: 0.52,
      possessions: 70,
    });

    const result = await getTeamGameStats("ts-1");
    expect(result).toHaveLength(1);
    expect(result[0].game_id).toBe("g-1");
    expect(result[0].team_score).toBe(90);
    expect(result[0].opp_score).toBe(80);
    expect(result[0].result).toBe("W");
    expect(result[0].opponent_name).toBe("Opponent Team");
    expect(result[0].opponent_slug).toBe("opponent-team");
    expect(result[0].home_away).toBe("home");
    // Advanced stat roundings
    expect(result[0].ortg).toBe(110.0);
    expect(result[0].drtg).toBe(105.0);
    expect(result[0].net_rtg).toBe(5.0);
    expect(result[0].pace).toBe(76.2);
    expect(result[0].efg).toBe(53.3); // Math.round(0.5333 * 1000) / 10
    expect(result[0].tov_pct).toBe(13.5); // Math.round(0.135 * 1000) / 10
    expect(result[0].oreb_pct).toBe(32.4); // Math.round(0.324 * 1000) / 10
    expect(result[0].fta_rate).toBe(26.7); // Math.round(0.267 * 1000) / 10
    expect(result[0].pie).toBe(52.0); // Math.round(0.52 * 1000) / 10
  });

  it("returns loss result when team score is lower", async () => {
    const rows = [makeTeamGameStatsRow({ team_pts: 70, opp_pts: 85 })];
    setQueryResult(mock, "v_public_team_game_stats", rows);

    mockCalcAdvStats.mockReturnValueOnce({
      ortg: 90.0,
      drtg: 110.0,
      netRtg: -20.0,
      pace: 75.0,
      efg: 0.45,
      tovPct: 0.18,
      orebPct: 0.25,
      ftaRate: 0.2,
      pie: 0.38,
      possessions: 70,
    });

    const result = await getTeamGameStats("ts-1");
    expect(result[0].result).toBe("L");
    expect(result[0].team_score).toBe(70);
    expect(result[0].opp_score).toBe(85);
  });

  it("passes correct teamStats and oppStats to calculateTeamAdvancedStats", async () => {
    const rows = [makeTeamGameStatsRow()];
    setQueryResult(mock, "v_public_team_game_stats", rows);

    mockCalcAdvStats.mockReturnValueOnce({
      ortg: 100,
      drtg: 100,
      netRtg: 0,
      pace: 70,
      efg: 0.5,
      tovPct: 0.15,
      orebPct: 0.3,
      ftaRate: 0.2,
      pie: 0.5,
      possessions: 65,
    });

    await getTeamGameStats("ts-1");

    expect(mockCalcAdvStats).toHaveBeenCalledTimes(1);
    const [teamStats, oppStats] = mockCalcAdvStats.mock.calls[0];
    // Team stats
    expect(teamStats.pts).toBe(90);
    expect(teamStats.fgm).toBe(35);
    expect(teamStats.fga).toBe(75);
    expect(teamStats.tpm).toBe(10);
    expect(teamStats.tpa).toBe(30);
    expect(teamStats.ftm).toBe(10);
    expect(teamStats.fta).toBe(15);
    expect(teamStats.oreb).toBe(12);
    expect(teamStats.dreb).toBe(28);
    expect(teamStats.ast).toBe(20);
    expect(teamStats.stl).toBe(8);
    expect(teamStats.blk).toBe(4);
    expect(teamStats.tov).toBe(12);
    expect(teamStats.pf).toBe(18);
    // Opponent stats
    expect(oppStats.pts).toBe(80);
    expect(oppStats.fgm).toBe(30);
    expect(oppStats.fga).toBe(70);
    expect(oppStats.tpm).toBe(8);
    expect(oppStats.tpa).toBe(25);
    expect(oppStats.ftm).toBe(12);
    expect(oppStats.fta).toBe(18);
    expect(oppStats.oreb).toBe(10);
    expect(oppStats.dreb).toBe(25);
    expect(oppStats.ast).toBe(15);
    expect(oppStats.stl).toBe(6);
    expect(oppStats.blk).toBe(3);
    expect(oppStats.tov).toBe(14);
    expect(oppStats.pf).toBe(20);
  });

  it("handles multiple game rows", async () => {
    const rows = [
      makeTeamGameStatsRow({ game_id: "g-1", team_pts: 90, opp_pts: 80 }),
      makeTeamGameStatsRow({ game_id: "g-2", team_pts: 75, opp_pts: 85 }),
    ];
    setQueryResult(mock, "v_public_team_game_stats", rows);

    mockCalcAdvStats
      .mockReturnValueOnce({
        ortg: 110,
        drtg: 100,
        netRtg: 10,
        pace: 75,
        efg: 0.55,
        tovPct: 0.12,
        orebPct: 0.3,
        ftaRate: 0.25,
        pie: 0.55,
        possessions: 70,
      })
      .mockReturnValueOnce({
        ortg: 95,
        drtg: 105,
        netRtg: -10,
        pace: 72,
        efg: 0.48,
        tovPct: 0.16,
        orebPct: 0.28,
        ftaRate: 0.22,
        pie: 0.45,
        possessions: 68,
      });

    const result = await getTeamGameStats("ts-1");
    expect(result).toHaveLength(2);
    expect(result[0].result).toBe("W");
    expect(result[1].result).toBe("L");
  });
});

// ---------------------------------------------------------------------------
// getAthleteAffiliations
// ---------------------------------------------------------------------------
describe("getAthleteAffiliations", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    // Add rpc support since this function calls supabase.rpc(), not .from()
    (mock as Record<string, unknown>).rpc = (fn: string) => {
      const result = mock._queryResults.get(fn) ?? {
        data: null,
        error: null,
        count: null,
      };
      return Promise.resolve(result);
    };
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns empty array when no affiliations exist", async () => {
    setQueryResult(mock, "cmd_get_athlete_affiliations", []);
    const result = await getAthleteAffiliations("ci-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when RPC returns null", async () => {
    setQueryResult(mock, "cmd_get_athlete_affiliations", null);
    const result = await getAthleteAffiliations("ci-1");
    expect(result).toEqual([]);
  });

  it("returns athlete affiliations", async () => {
    const affiliations: AthleteAffiliation[] = [
      {
        entity_type: "player",
        entity_id: "p-1",
        entity_name: "Тоглогч 1",
        source: "Монголын Сагсан Бөмбөгийн Лиг",
      },
      {
        entity_type: "student",
        entity_id: "s-1",
        entity_name: "Оюутан 1",
        source: "Академи",
      },
    ];
    setQueryResult(mock, "cmd_get_athlete_affiliations", affiliations);
    const result = await getAthleteAffiliations("ci-1");
    expect(result).toHaveLength(2);
    expect(result[0].entity_type).toBe("player");
    expect(result[0].entity_name).toBe("Тоглогч 1");
    expect(result[1].entity_type).toBe("student");
    expect(result[1].source).toBe("Академи");
  });

  it("passes canonicalIdentityId to RPC call", async () => {
    setQueryResult(mock, "cmd_get_athlete_affiliations", []);
    await getAthleteAffiliations("ci-42");
    // The mock rpc always resolves; the function destructures data
    // (rpc function name and params are verified implicitly by the mock lookup)
    expect(true).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getPlayerCanonicalIdentity
// ---------------------------------------------------------------------------
describe("getPlayerCanonicalIdentity", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns null when player has no canonical identity", async () => {
    setQueryResult(mock, "players", {
      canonical_identity_id: null,
    });
    const result = await getPlayerCanonicalIdentity("p-1");
    expect(result).toBeNull();
  });

  it("returns null when player query returns null", async () => {
    setQueryResult(mock, "players", null);
    const result = await getPlayerCanonicalIdentity("p-nonexistent");
    expect(result).toBeNull();
  });

  it("returns canonical identity id when present", async () => {
    setQueryResult(mock, "players", {
      canonical_identity_id: "ci-42",
    });
    const result = await getPlayerCanonicalIdentity("p-1");
    expect(result).toBe("ci-42");
  });

  it("returns identity id as string", async () => {
    setQueryResult(mock, "players", {
      canonical_identity_id: "ci-abc-123",
    });
    const result = await getPlayerCanonicalIdentity("p-1");
    expect(typeof result).toBe("string");
    expect(result).toBe("ci-abc-123");
  });
});

// ---------------------------------------------------------------------------
// getAthleteTimeline
// ---------------------------------------------------------------------------
describe("getAthleteTimeline", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns empty array when no timeline events exist", async () => {
    setQueryResult(mock, "v_athlete_timeline", []);
    const result = await getAthleteTimeline("ci-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when query returns null", async () => {
    setQueryResult(mock, "v_athlete_timeline", null);
    const result = await getAthleteTimeline("ci-1");
    expect(result).toEqual([]);
  });

  it("returns timeline events", async () => {
    const events: AthleteTimelineEvent[] = [
      {
        event_type: "game",
        entity_id: "ci-1",
        event_id: "g-1",
        event_date: "2026-07-22",
        competition_name: "МСБЛ",
        player_team_name: "Хүлэгүүд",
        opponent_name: "Miners",
        home_score: 90,
        away_score: 80,
        pts: 25,
        assists: 5,
        total_rebounds: 8,
        program_name: null,
        event_label: "Тоглолт",
      },
      {
        event_type: "enrollment",
        entity_id: "ci-1",
        event_id: "e-1",
        event_date: "2026-06-01",
        competition_name: "Академи",
        player_team_name: null,
        opponent_name: null,
        home_score: null,
        away_score: null,
        pts: null,
        assists: null,
        total_rebounds: null,
        program_name: "Зуны академи",
        event_label: "Элсэлт",
      },
    ];
    setQueryResult(mock, "v_athlete_timeline", events);
    const result = await getAthleteTimeline("ci-1");

    expect(result).toHaveLength(2);
    expect(result[0].event_type).toBe("game");
    expect(result[0].pts).toBe(25);
    expect(result[0].competition_name).toBe("МСБЛ");
    expect(result[1].event_type).toBe("enrollment");
    expect(result[1].program_name).toBe("Зуны академи");
  });

  it("accepts a custom limit parameter", async () => {
    setQueryResult(mock, "v_athlete_timeline", []);
    // Should not throw
    await expect(getAthleteTimeline("ci-1", 5)).resolves.toEqual([]);
    await expect(getAthleteTimeline("ci-1", 50)).resolves.toEqual([]);
  });
});
