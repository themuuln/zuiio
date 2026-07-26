import type { GameRoster } from "@onoo/core/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBoxScore,
  getCompetition,
  getGameById,
  getGameRosters,
  getLiveGames,
  getPlayByPlay,
  getPlayerAwards,
  getPlayerShootingProfile,
  getPlayerShotZones,
  getRecentGames,
  getScorebarGames,
} from "@/app/lib/data";
import type {
  BoxScoreRow,
  GameWithTeams,
  PlayByPlayRow,
  PlayerAwardRow,
  ShotZoneStat,
} from "@/app/lib/shared";
import {
  createMockSupabase,
  type MockFrom,
  setQueryResult,
} from "@/test/supabase-mock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

const mockCreateClient = vi.mocked(createClient);

// ---------------------------------------------------------------------------
// Mock data factories
// ---------------------------------------------------------------------------

function makeGameRow(overrides: Record<string, unknown> = {}): GameWithTeams {
  return {
    id: "game-1",
    status: "final_pending_review",
    competition_id: "comp-1",
    home_team_id: "team-1",
    home_team_name: "Баг А",
    home_team_short_code: "BAG_A",
    home_team_logo_url: null,
    home_score: 85,
    away_team_id: "team-2",
    away_team_name: "Баг Б",
    away_team_short_code: "BAG_B",
    away_team_logo_url: null,
    away_score: 72,
    scheduled_at: "2026-07-22T12:00:00Z",
    settled_at: "2026-07-22T14:00:00Z",
    venue_name: "Төв ордон",
    home_name: "Баг А",
    home_short: "BAG_A",
    home_color: null,
    away_name: "Баг Б",
    away_short: "BAG_B",
    away_color: null,
    venue_city: null,
    ...overrides,
  } as GameWithTeams;
}

function makeBoxScoreRow(overrides: Record<string, unknown> = {}): BoxScoreRow {
  return {
    game_id: "game-1",
    revision_id: "rev-1",
    revision_number: 1,
    revision_approved_at: "2026-07-22T14:00:00Z",
    player_id: "player-1",
    player_name: "Тоглогч",
    player_name_latin: "Toglooch",
    player_position: "PG",
    team_season_id: "ts-1",
    team_id: "team-1",
    team_name: "Баг А",
    jersey_number: 5,
    seconds_played: 1200,
    pts: 20,
    fgm: 8,
    fga: 15,
    tpm: 3,
    tpa: 6,
    ftm: 1,
    fta: 2,
    oreb: 2,
    dreb: 4,
    ast: 5,
    stl: 1,
    blk: 0,
    tov: 3,
    pf: 2,
    source_type: "official",
    evidence_url: null,
    source_reviewed_at: "2026-07-22T14:00:00Z",
    team_short: "BAG_A",
    ...overrides,
  };
}

function makePlayByPlayRow(
  overrides: Record<string, unknown> = {},
): PlayByPlayRow {
  return {
    game_id: "game-1",
    event_id: "evt-1",
    operation_id: "op-1",
    local_seq: 1,
    event_type: "fgm",
    period: 1,
    clock_seconds: 600,
    team_season_id: "ts-1",
    team_name: "Баг А",
    player_id: "player-1",
    player_name: "Тоглогч",
    player_name_latin: "Toglooch",
    jersey_number: 5,
    payload: {},
    created_at: "2026-07-22T12:00:00Z",
    ...overrides,
  };
}

function makeRosterRow(overrides: Record<string, unknown> = {}): GameRoster {
  return {
    id: "roster-1",
    game_id: "game-1",
    team_season_id: "ts-1",
    player_id: "player-1",
    is_starter: true,
    jersey_number: 5,
    ...overrides,
  } as GameRoster;
}

function makeAwardRow(overrides: Record<string, unknown> = {}): PlayerAwardRow {
  return {
    id: "award-1",
    award_type: "mvp",
    period_start: "2026-01-01",
    period_end: "2026-06-30",
    granted_at: "2026-07-01T00:00:00Z",
    note: "Season MVP",
    player_name: "Тоглогч",
    player_id: "player-1",
    competition_name: "Лиг",
    competition_id: "comp-1",
    ...overrides,
  };
}

function makeCompetitionRow(overrides: Record<string, unknown> = {}) {
  return {
    competition_id: "comp-1",
    competition_name: "Монгол лиг",
    season_name: "2026",
    league_id: "league-1",
    ...overrides,
  };
}

function makeShotZoneRow(
  overrides: Record<string, unknown> = {},
): ShotZoneStat {
  return {
    player_id: "player-1",
    team_season_id: "ts-1",
    competition_id: "comp-1",
    zone_key: "paint",
    made: 10,
    attempted: 15,
    ...overrides,
  };
}

function makeProfileRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    fgm: 5,
    fga: 10,
    tpm: 2,
    tpa: 5,
    ftm: 3,
    fta: 4,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getRecentGames — calls getGamesByDate, filters official/league_verified, slices
// ---------------------------------------------------------------------------

describe("getRecentGames", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns an empty array when no games exist", async () => {
    setQueryResult(mock, "v_public_games", []);
    const result = await getRecentGames(4);
    expect(result).toEqual([]);
  });

  it("returns only official and league_verified games", async () => {
    const rows = [
      makeGameRow({ id: "g-1", status: "official" }),
      makeGameRow({ id: "g-2", status: "league_verified" }),
      makeGameRow({ id: "g-3", status: "live_provisional" }),
      makeGameRow({ id: "g-4", status: "final_pending_review" }),
    ];
    setQueryResult(mock, "v_public_games", rows);
    const result = await getRecentGames(4);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("g-1");
    expect(result[1].id).toBe("g-2");
  });

  it("respects the limit parameter", async () => {
    const rows = [
      makeGameRow({ id: "g-1", status: "official" }),
      makeGameRow({ id: "g-2", status: "official" }),
      makeGameRow({ id: "g-3", status: "official" }),
      makeGameRow({ id: "g-4", status: "league_verified" }),
      makeGameRow({ id: "g-5", status: "league_verified" }),
    ];
    setQueryResult(mock, "v_public_games", rows);
    const result = await getRecentGames(2);
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// getLiveGames — calls getGamesByDate, filters live_provisional
// ---------------------------------------------------------------------------

describe("getLiveGames", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns an empty array when no live games exist", async () => {
    setQueryResult(mock, "v_public_games", []);
    const result = await getLiveGames();
    expect(result).toEqual([]);
  });

  it("returns only live_provisional games", async () => {
    const rows = [
      makeGameRow({ id: "g-1", status: "live_provisional" }),
      makeGameRow({ id: "g-2", status: "official" }),
      makeGameRow({ id: "g-3", status: "league_verified" }),
      makeGameRow({ id: "g-4", status: "live_provisional" }),
    ];
    setQueryResult(mock, "v_public_games", rows);
    const result = await getLiveGames();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("g-1");
    expect(result[1].id).toBe("g-4");
  });
});

// ---------------------------------------------------------------------------
// getGameById — queries v_public_games, falls back to v_public_live_games
// ---------------------------------------------------------------------------

describe("getGameById", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns null when no game data exists", async () => {
    setQueryResult(mock, "v_public_games", null);
    setQueryResult(mock, "v_public_live_games", null);
    const result = await getGameById("nonexistent");
    expect(result).toBeNull();
  });

  it("returns a game from the main v_public_games view", async () => {
    const row = makeGameRow({ id: "g-1" });
    setQueryResult(mock, "v_public_games", row);
    const result = await getGameById("g-1");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("g-1");
    expect(result?.home_name).toBe("Баг А");
    expect(result?.away_name).toBe("Баг Б");
  });

  it("falls back to v_public_live_games when main view returns no data", async () => {
    const liveRow = makeGameRow({
      id: "g-live",
      status: "live_provisional",
      home_team_name: "Live Баг А",
      away_team_name: "Live Баг Б",
    });
    setQueryResult(mock, "v_public_games", null);
    setQueryResult(mock, "v_public_live_games", liveRow);
    const result = await getGameById("g-live");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("g-live");
    expect(result?.home_name).toBe("Live Баг А");
    expect(result?.status).toBe("live_provisional");
  });
});

// ---------------------------------------------------------------------------
// getScorebarGames — calls getGamesByDate and falls back up to 7 days
// ---------------------------------------------------------------------------

describe("getScorebarGames", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns today games when data exists", async () => {
    setQueryResult(mock, "v_public_games", [
      makeGameRow({ id: "g-1", status: "official" }),
    ]);
    const result = await getScorebarGames("2026-07-22");
    expect(result.isFallback).toBe(false);
    expect(result.activeDate).toBe("2026-07-22");
    expect(result.games).toHaveLength(1);
  });

  it("falls back to a previous day when today has no games", async () => {
    setQueryResult(mock, "v_public_games", []);

    // getScorebarGames calls getGamesByDate which internally calls
    // supabase.from() twice per date (v_public_games + v_public_live_games).
    // First call (today) = 2 from() calls, returns [].
    // Second call (yesterday) = 2 more from() calls. Set data before the
    // v_public_games query of the second getGamesByDate invocation (call 3).
    let callCount = 0;
    const originalFrom = mock.from.bind(mock);
    mock.from = (table: string) => {
      callCount++;
      if (callCount === 3) {
        setQueryResult(mock, "v_public_games", [
          makeGameRow({ id: "g-yesterday", status: "official" }),
        ]);
      }
      return originalFrom(table);
    };

    const result = await getScorebarGames("2026-07-22");
    expect(result.isFallback).toBe(true);
    expect(result.games).toHaveLength(1);
    // shiftDate("2026-07-22", -1) = "2026-07-21"
    expect(result.activeDate).toBe("2026-07-21");
  });

  it("returns empty after full fallback exhausts all dates", async () => {
    setQueryResult(mock, "v_public_games", []);
    const result = await getScorebarGames("2026-07-22");
    expect(result.games).toEqual([]);
    expect(result.activeDate).toBe("2026-07-22");
    expect(result.isFallback).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getPlayByPlay
// ---------------------------------------------------------------------------

describe("getPlayByPlay", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns an empty array when no play-by-play exists", async () => {
    setQueryResult(mock, "v_public_play_by_play", []);
    const result = await getPlayByPlay("game-1");
    expect(result).toEqual([]);
  });

  it("returns play-by-play rows ordered by period and local_seq", async () => {
    const rows = [
      makePlayByPlayRow({ local_seq: 2 }),
      makePlayByPlayRow({ local_seq: 1 }),
    ];
    setQueryResult(mock, "v_public_play_by_play", rows);
    const result = await getPlayByPlay("game-1");
    expect(result).toHaveLength(2);
    expect(result[0].local_seq).toBe(2);
    expect(result[1].local_seq).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getBoxScore
// ---------------------------------------------------------------------------

describe("getBoxScore", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns an empty array when no box score exists", async () => {
    setQueryResult(mock, "v_public_box_score", []);
    const result = await getBoxScore("game-1");
    expect(result).toEqual([]);
  });

  it("returns box score rows", async () => {
    const rows = [
      makeBoxScoreRow({
        player_id: "player-1",
        team_name: "Баг А",
        pts: 20,
      }),
      makeBoxScoreRow({
        player_id: "player-2",
        team_name: "Баг Б",
        pts: 15,
      }),
    ];
    setQueryResult(mock, "v_public_box_score", rows);
    const result = await getBoxScore("game-1");
    expect(result).toHaveLength(2);
    expect(result[0].player_id).toBe("player-1");
    expect(result[0].pts).toBe(20);
    expect(result[1].player_id).toBe("player-2");
    expect(result[1].pts).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// getGameRosters
// ---------------------------------------------------------------------------

describe("getGameRosters", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns an empty array when no roster exists", async () => {
    setQueryResult(mock, "game_rosters", []);
    const result = await getGameRosters("game-1");
    expect(result).toEqual([]);
  });

  it("returns game roster entries", async () => {
    const rows = [
      makeRosterRow({ player_id: "player-1", is_starter: true }),
      makeRosterRow({ player_id: "player-2", is_starter: false }),
    ];
    setQueryResult(mock, "game_rosters", rows);
    const result = await getGameRosters("game-1");
    expect(result).toHaveLength(2);
    expect(result[0].player_id).toBe("player-1");
    expect(result[0].is_starter).toBe(true);
    expect(result[1].player_id).toBe("player-2");
    expect(result[1].is_starter).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getPlayerAwards
// ---------------------------------------------------------------------------

describe("getPlayerAwards", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns an empty array when no awards exist", async () => {
    setQueryResult(mock, "v_public_awards", []);
    const result = await getPlayerAwards("player-1");
    expect(result).toEqual([]);
  });

  it("returns award rows ordered by granted_at descending", async () => {
    const rows = [
      makeAwardRow({ id: "award-2", granted_at: "2026-07-01T00:00:00Z" }),
      makeAwardRow({ id: "award-1", granted_at: "2026-06-01T00:00:00Z" }),
    ];
    setQueryResult(mock, "v_public_awards", rows);
    const result = await getPlayerAwards("player-1");
    expect(result).toHaveLength(2);
    expect(result[0].award_type).toBe("mvp");
    expect(result[0].player_id).toBe("player-1");
  });
});

// ---------------------------------------------------------------------------
// getCompetition — queries v_public_standings with .single()
// ---------------------------------------------------------------------------

describe("getCompetition", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns null when single() errors or no data", async () => {
    setQueryResult(mock, "v_public_standings", null);
    const result = await getCompetition("nonexistent");
    expect(result).toBeNull();
  });

  it("returns competition data", async () => {
    const row = makeCompetitionRow();
    setQueryResult(mock, "v_public_standings", row);
    const result = await getCompetition("comp-1");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("comp-1");
    expect(result?.name).toBe("Монгол лиг");
    expect(result?.season).toBe("2026");
    expect(result?.league).toBe("league-1");
  });
});

// ---------------------------------------------------------------------------
// getPlayerShotZones
// ---------------------------------------------------------------------------

describe("getPlayerShotZones", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns an empty array when no shot zones exist", async () => {
    setQueryResult(mock, "v_public_shot_zones", []);
    const result = await getPlayerShotZones("player-1", "comp-1");
    expect(result).toEqual([]);
  });

  it("returns shot zone stats ordered by zone_key", async () => {
    const rows = [
      makeShotZoneRow({ zone_key: "mid-range", made: 5, attempted: 12 }),
      makeShotZoneRow({ zone_key: "paint", made: 10, attempted: 15 }),
    ];
    setQueryResult(mock, "v_public_shot_zones", rows);
    const result = await getPlayerShotZones("player-1", "comp-1");
    expect(result).toHaveLength(2);
    expect(result[0].zone_key).toBe("mid-range");
    expect(result[0].made).toBe(5);
    expect(result[0].attempted).toBe(12);
    expect(result[1].zone_key).toBe("paint");
    expect(result[1].made).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// getPlayerShootingProfile — queries v_public_leaders .maybeSingle()
// ---------------------------------------------------------------------------

describe("getPlayerShootingProfile", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns null when maybeSingle() yields no data", async () => {
    setQueryResult(mock, "v_public_leaders", null);
    const result = await getPlayerShootingProfile("player-1", "comp-1");
    expect(result).toBeNull();
  });

  it("returns shooting profile with fgm/fga/tpm/tpa/ftm/fta", async () => {
    const row = makeProfileRow({
      fgm: 5,
      fga: 10,
      tpm: 2,
      tpa: 5,
      ftm: 3,
      fta: 4,
    });
    setQueryResult(mock, "v_public_leaders", row);
    const result = await getPlayerShootingProfile("player-1", "comp-1");
    expect(result).not.toBeNull();
    expect(result?.fgm).toBe(5);
    expect(result?.fga).toBe(10);
    expect(result?.tpm).toBe(2);
    expect(result?.tpa).toBe(5);
    expect(result?.ftm).toBe(3);
    expect(result?.fta).toBe(4);
  });
});
