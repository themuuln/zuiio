import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLeagueAverages,
  getMvpRace,
  getPlayerById,
  getPlayerCareerTotals,
  getPlayerCompetitions,
  getPlayerGameLog,
  getPlayerSeasonAverages,
  getPlayerShotScatter,
  getTeamBySlug,
  searchAll,
  searchPlayersAndTeams,
} from "@/app/lib/data";
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
// Helper: make a box score row
// ---------------------------------------------------------------------------
function makeBoxScoreRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    game_id: "game-1",
    revision_id: "rev-1",
    revision_number: 1,
    revision_approved_at: "2025-01-15T10:00:00Z",
    player_id: "player-1",
    player_name: "Test Player",
    player_name_latin: "Test Player",
    player_position: null,
    team_season_id: "ts-1",
    team_id: "team-1",
    team_name: "Test Team",
    jersey_number: null,
    seconds_played: 1200,
    pts: 20,
    fgm: 8,
    fga: 15,
    tpm: 2,
    tpa: 6,
    ftm: 2,
    fta: 3,
    oreb: 2,
    dreb: 4,
    ast: 5,
    stl: 1,
    blk: 0,
    tov: 2,
    pf: 3,
    source_type: "manual",
    evidence_url: null,
    source_reviewed_at: "2025-01-15T10:00:00Z",
    team_short: "TT",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helper: make a game row (compatible with mapGameRow)
// ---------------------------------------------------------------------------
function makeGameRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "game-1",
    status: "official" as const,
    scheduled_at: "2025-01-15T14:00:00Z",
    competition_id: "comp-1",
    competition_name: "Test Competition",
    season_id: "season-1",
    season_name: "2024-2025",
    league_id: "league-1",
    league_name: "Test League",
    league_slug: "test-league",
    home_team_season_id: "ts-1",
    home_team_id: "team-1",
    home_team_name: "Test Team",
    home_team_short_code: "TT",
    home_team_logo_url: null,
    home_score: 80,
    away_team_season_id: "ts-2",
    away_team_id: "team-2",
    away_team_name: "Opponent Team",
    away_team_short_code: "OT",
    away_team_logo_url: null,
    away_score: 70,
    venue_name: "Test Arena",
    revision_id: "rev-1",
    revision_number: 1,
    revision_approved_at: "2025-01-15T10:00:00Z",
    source_submission_id: "sub-1",
    source_type: "manual",
    evidence_url: null,
    source_reviewer_id: "reviewer-1",
    source_reviewed_at: "2025-01-15T10:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// describe: getTeamBySlug
// ---------------------------------------------------------------------------
describe("getTeamBySlug", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns null when no roster rows exist", async () => {
    setQueryResult(mock, "v_public_team_roster", []);

    const result = await getTeamBySlug("test-team");
    expect(result).toBeNull();
  });

  it("returns null when roster query errors", async () => {
    setQueryResult(mock, "v_public_team_roster", null, new Error("DB error"));

    const result = await getTeamBySlug("test-team");
    expect(result).toBeNull();
  });

  it("returns a full team object with players, standings, leaders, and games", async () => {
    const rosterRow = {
      team_season_id: "ts-1",
      competition_id: "comp-1",
      team_id: "team-1",
      team_name: "Test Team",
      team_slug: "test-team",
      roster_entry_id: "re-1",
      jersey_number: 10,
      roster_position: "PG",
      player_id: "player-1",
      player_name: "Test Player",
      player_name_latin: null,
      player_position: "Guard",
      photo_url: null,
      id: "player-1",
      canonical_name: "Test Player",
      name_latin: null,
      position: "Guard",
    };

    setQueryResult(mock, "v_public_team_roster", [rosterRow]);
    setQueryResult(mock, "teams", { social_links: { instagram: "@test" } });
    setQueryResult(mock, "v_public_standings", {
      competition_id: "comp-1",
      competition_name: "Test Competition",
      season_id: "season-1",
      season_name: "2024-2025",
      league_id: "league-1",
      league_slug: "test-league",
      team_season_id: "ts-1",
      team_id: "team-1",
      team_name: "Test Team",
      team_slug: "test-team",
      team_logo_url: null,
      wins: 5,
      losses: 2,
      win_pct: 0.714,
      gb: 0,
      streak: "W3",
      last10: "7-3",
      points_for: 600,
      points_against: 520,
      w: 5,
      l: 2,
      team_short: "TT",
      team_color: null,
      team_short_code: "TT",
      team_primary_color: null,
    });
    setQueryResult(mock, "v_public_leaders", [
      {
        player_id: "player-1",
        player_name: "Test Player",
        pts: 20,
        oreb: 1,
        dreb: 4,
        ast: 5,
        stl: 1,
        blk: 0,
        gp: 7,
        tov: 2,
        team_short_code: "TT",
        player_photo_url: null,
        photo_url: null,
        team_primary_color: null,
        team_slug: "test-team",
        competition_id: "comp-1",
      },
    ]);
    setQueryResult(mock, "v_public_games", [
      makeGameRow({ scheduled_at: "2025-01-10T14:00:00Z" }),
    ]);

    const result = await getTeamBySlug("test-team");

    expect(result).not.toBeNull();
    expect(result!.team.name).toBe("Test Team");
    expect(result!.team.slug).toBe("test-team");
    expect(result!.team.social_links).toEqual({ instagram: "@test" });
    expect(result!.players).toHaveLength(1);
    expect(result!.players[0].player_name).toBe("Test Player");
    expect(result!.standings).toBeDefined();
    expect(result!.standings!.wins).toBe(5);
    expect(result!.leaders).toHaveLength(1);
    expect(result!.leaders[0].pts).toBe(20);
  });

  it("handles null social_links gracefully", async () => {
    setQueryResult(mock, "v_public_team_roster", [
      {
        team_season_id: "ts-1",
        competition_id: "comp-1",
        team_id: "team-1",
        team_name: "Test Team",
        team_slug: "test-team",
        roster_entry_id: "re-1",
        jersey_number: null,
        roster_position: null,
        player_id: "player-1",
        player_name: "Test Player",
        player_name_latin: null,
        player_position: null,
        photo_url: null,
        id: "player-1",
        canonical_name: "Test Player",
        name_latin: null,
        position: null,
      },
    ]);
    setQueryResult(mock, "teams", { social_links: null });
    setQueryResult(mock, "v_public_standings", null);
    setQueryResult(mock, "v_public_leaders", null);
    setQueryResult(mock, "v_public_games", null);

    const result = await getTeamBySlug("test-team");

    expect(result).not.toBeNull();
    expect(result!.team.social_links).toEqual({});
    expect(result!.standings).toBeUndefined();
    expect(result!.leaders).toEqual([]);
    expect(result!.recentGames).toEqual([]);
    expect(result!.upcomingGames).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// describe: getPlayerById
// ---------------------------------------------------------------------------
describe("getPlayerById", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns null when no profiles found", async () => {
    setQueryResult(mock, "v_public_player_profiles", []);

    const result = await getPlayerById("player-1");
    expect(result).toBeNull();
  });

  it("returns null when profiles query errors", async () => {
    setQueryResult(
      mock,
      "v_public_player_profiles",
      null,
      new Error("DB error"),
    );

    const result = await getPlayerById("player-1");
    expect(result).toBeNull();
  });

  it("returns player object with profiles, seasonStats, and gameLog", async () => {
    setQueryResult(mock, "v_public_player_profiles", [
      {
        player_id: "player-1",
        player_name: "Test Player",
        player_name_latin: null,
        dob: null,
        height_cm: null,
        weight_kg: null,
        player_position: "Guard",
        nationality: "MN",
        photo_url: null,
        social_links: {},
        team_season_id: "ts-1",
        team_id: "team-1",
        team_name: "Test Team",
        team_slug: "test-team",
        team_logo_url: null,
        competition_id: "comp-1",
        competition_name: "Test Competition",
        season_id: "season-1",
        season_name: "2024-2025",
        league_id: "league-1",
        league_name: "Test League",
        league_slug: "test-league",
        jersey_number: 10,
        games_played: 7,
        minutes_per_game: 30,
        points_per_game: 20,
        rebounds_per_game: 5,
        assists_per_game: 4,
        pts: 20,
        reb: 5,
        ast: 4,
      },
    ]);
    setQueryResult(mock, "v_public_box_score", [makeBoxScoreRow()]);

    const result = await getPlayerById("player-1");

    expect(result).not.toBeNull();
    expect(result!.player.canonical_name).toBe("Test Player");
    expect(result!.profiles).toHaveLength(1);
    expect(result!.profiles[0].player_position).toBe("Guard");
    expect(result!.gameLog).toHaveLength(1);
    expect(result!.gameLog[0].pts).toBe(20);
  });

  it("returns empty gameLog when box score query returns null", async () => {
    setQueryResult(mock, "v_public_player_profiles", [
      {
        player_id: "player-1",
        player_name: "Test Player",
        player_name_latin: null,
        dob: null,
        height_cm: null,
        weight_kg: null,
        player_position: null,
        nationality: "MN",
        photo_url: null,
        social_links: {},
        team_season_id: "ts-1",
        team_id: "team-1",
        team_name: "Test Team",
        team_slug: "test-team",
        team_logo_url: null,
        competition_id: "comp-1",
        competition_name: "Test Competition",
        season_id: "season-1",
        season_name: "2024-2025",
        league_id: "league-1",
        league_name: "Test League",
        league_slug: "test-league",
        jersey_number: null,
        games_played: 0,
        minutes_per_game: null,
        points_per_game: null,
        rebounds_per_game: null,
        assists_per_game: null,
        pts: 0,
        reb: 0,
        ast: 0,
      },
    ]);
    setQueryResult(mock, "v_public_box_score", null);

    const result = await getPlayerById("player-1");

    expect(result).not.toBeNull();
    expect(result!.gameLog).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// describe: getPlayerGameLog
// ---------------------------------------------------------------------------
describe("getPlayerGameLog", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns empty array when no box score data exists", async () => {
    setQueryResult(mock, "v_public_box_score", []);

    const result = await getPlayerGameLog("player-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when box score query errors", async () => {
    setQueryResult(mock, "v_public_box_score", null, new Error("DB error"));

    const result = await getPlayerGameLog("player-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when no games match the box score games", async () => {
    setQueryResult(mock, "v_public_box_score", [makeBoxScoreRow()]);
    setQueryResult(mock, "v_public_games", []);

    const result = await getPlayerGameLog("player-1");
    expect(result).toEqual([]);
  });

  it("returns player game log with correct game metadata", async () => {
    setQueryResult(mock, "v_public_box_score", [
      makeBoxScoreRow({
        game_id: "game-1",
        team_season_id: "ts-1",
      }),
    ]);
    setQueryResult(mock, "v_public_games", [
      makeGameRow({
        id: "game-1",
        scheduled_at: "2025-01-15T14:00:00Z",
        home_team_season_id: "ts-1",
        home_score: 80,
        away_team_season_id: "ts-2",
        away_score: 70,
      }),
    ]);

    const result = await getPlayerGameLog("player-1");

    expect(result).toHaveLength(1);
    expect(result[0].game_date).toBe("2025-01-15T14:00:00Z");
    expect(result[0].opponent_name).toBe("Opponent Team");
    expect(result[0].team_score).toBe(80);
    expect(result[0].opponent_score).toBe(70);
    expect(result[0].result).toBe("W");
    expect(result[0].is_home).toBe(true);
  });

  it("filters by competition id when provided", async () => {
    setQueryResult(mock, "v_public_box_score", [
      makeBoxScoreRow({ game_id: "game-1" }),
    ]);
    setQueryResult(mock, "v_public_games", [
      makeGameRow({ id: "game-1", competition_id: "comp-1" }),
    ]);

    const result = await getPlayerGameLog("player-1", "comp-1");

    expect(result).toHaveLength(1);
    expect(result[0].game_id).toBe("game-1");
  });

  it("correctly marks away games", async () => {
    setQueryResult(mock, "v_public_box_score", [
      makeBoxScoreRow({
        game_id: "game-1",
        team_season_id: "ts-2",
      }),
    ]);
    setQueryResult(mock, "v_public_games", [
      makeGameRow({
        id: "game-1",
        home_team_season_id: "ts-1",
        away_team_season_id: "ts-2",
        home_score: 80,
        away_score: 70,
      }),
    ]);

    const result = await getPlayerGameLog("player-1");

    expect(result).toHaveLength(1);
    expect(result[0].is_home).toBe(false);
    expect(result[0].opponent_name).toBe("Test Team");
    expect(result[0].result).toBe("L");
  });
});

// ---------------------------------------------------------------------------
// describe: getPlayerSeasonAverages
// ---------------------------------------------------------------------------
describe("getPlayerSeasonAverages", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns null when no data exists", async () => {
    setQueryResult(mock, "v_public_leaders", null);

    const result = await getPlayerSeasonAverages("player-1", "comp-1");
    expect(result).toBeNull();
  });

  it("returns null on query error", async () => {
    setQueryResult(mock, "v_public_leaders", null, new Error("DB error"));

    const result = await getPlayerSeasonAverages("player-1", "comp-1");
    expect(result).toBeNull();
  });

  it("returns computed averages from leader data", async () => {
    setQueryResult(mock, "v_public_leaders", {
      pts: 20,
      oreb: 2,
      dreb: 4,
      ast: 5,
      stl: 1,
      blk: 0,
    });

    const result = await getPlayerSeasonAverages("player-1", "comp-1");

    expect(result).not.toBeNull();
    expect(result!.ppg).toBe(20);
    expect(result!.rpg).toBe(6); // oreb 2 + dreb 4
    expect(result!.apg).toBe(5);
    expect(result!.spg).toBe(1);
    expect(result!.bpg).toBe(0);
  });

  it("defaults null fields to 0", async () => {
    setQueryResult(mock, "v_public_leaders", {
      pts: null,
      oreb: null,
      dreb: null,
      ast: null,
      stl: null,
      blk: null,
    });

    const result = await getPlayerSeasonAverages("player-1", "comp-1");

    expect(result!.ppg).toBe(0);
    expect(result!.rpg).toBe(0);
    expect(result!.apg).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// describe: getLeagueAverages
// ---------------------------------------------------------------------------
describe("getLeagueAverages", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns zeros when query errors", async () => {
    setQueryResult(mock, "v_public_leaders", null, new Error("DB error"));

    const result = await getLeagueAverages("comp-1");
    expect(result.averages).toEqual({ pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 });
    expect(result.maxes).toEqual({ pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 });
  });

  it("returns zeros when no data returned", async () => {
    setQueryResult(mock, "v_public_leaders", []);

    const result = await getLeagueAverages("comp-1");
    expect(result.averages.pts).toBe(0);
    expect(result.maxes.pts).toBe(0);
  });

  it("computes averages and maxes correctly for multiple rows", async () => {
    setQueryResult(mock, "v_public_leaders", [
      {
        pts: 20,
        oreb: 2,
        dreb: 4,
        ast: 5,
        stl: 1,
        blk: 0,
        gp: 7,
      },
      {
        pts: 30,
        oreb: 1,
        dreb: 3,
        ast: 2,
        stl: 2,
        blk: 1,
        gp: 6,
      },
      {
        pts: 10,
        oreb: 0,
        dreb: 1,
        ast: 8,
        stl: 0,
        blk: 0,
        gp: 8,
      },
    ]);

    const result = await getLeagueAverages("comp-1");

    // averages: sum / n rounded to 1 decimal
    // pts: (20+30+10)/3 = 20
    expect(result.averages.pts).toBe(20);
    // reb per player: 6, 4, 1 → sum=11 → avg=3.7 (11/3=3.666... → 3.7)
    expect(result.averages.reb).toBe(3.7);
    // ast: (5+2+8)/3 = 5
    expect(result.averages.ast).toBe(5);
    // stl: (1+2+0)/3 = 1
    expect(result.averages.stl).toBe(1);
    // blk: (0+1+0)/3 = 0.3 (0.333 → 0.3)
    expect(result.averages.blk).toBe(0.3);

    // maxes
    expect(result.maxes.pts).toBe(30);
    expect(result.maxes.reb).toBe(6);
    expect(result.maxes.ast).toBe(8);
    expect(result.maxes.stl).toBe(2);
    expect(result.maxes.blk).toBe(1);
  });

  it("handles single row correctly", async () => {
    setQueryResult(mock, "v_public_leaders", [
      {
        pts: 25,
        oreb: 3,
        dreb: 5,
        ast: 4,
        stl: 2,
        blk: 1,
        gp: 10,
      },
    ]);

    const result = await getLeagueAverages("comp-1");

    expect(result.averages.pts).toBe(25);
    expect(result.averages.reb).toBe(8);
    expect(result.maxes.pts).toBe(25);
    expect(result.maxes.reb).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// describe: getPlayerCompetitions
// ---------------------------------------------------------------------------
describe("getPlayerCompetitions", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns empty array when no profiles exist", async () => {
    setQueryResult(mock, "v_public_player_profiles", []);

    const result = await getPlayerCompetitions("player-1");
    expect(result).toEqual([]);
  });

  it("returns empty array on query error", async () => {
    setQueryResult(
      mock,
      "v_public_player_profiles",
      null,
      new Error("DB error"),
    );

    const result = await getPlayerCompetitions("player-1");
    expect(result).toEqual([]);
  });

  it("deduplicates by competition_id", async () => {
    setQueryResult(mock, "v_public_player_profiles", [
      {
        competition_id: "comp-1",
        competition_name: "League A",
        season_name: "2024-2025",
        league_name: "Mongolia League",
      },
      {
        competition_id: "comp-1",
        competition_name: "League A",
        season_name: "2024-2025",
        league_name: "Mongolia League",
      },
      {
        competition_id: "comp-2",
        competition_name: "Cup B",
        season_name: "2023-2024",
        league_name: "National Cup",
      },
    ]);

    const result = await getPlayerCompetitions("player-1");

    expect(result).toHaveLength(2);
    const ids = result.map((c) => c.competition_id);
    expect(ids).toContain("comp-1");
    expect(ids).toContain("comp-2");
  });

  it("sorts by season_name descending", async () => {
    setQueryResult(mock, "v_public_player_profiles", [
      {
        competition_id: "comp-1",
        competition_name: "League A",
        season_name: "2022-2023",
        league_name: "Mongolia League",
      },
      {
        competition_id: "comp-2",
        competition_name: "League B",
        season_name: "2024-2025",
        league_name: "Mongolia League",
      },
      {
        competition_id: "comp-3",
        competition_name: "Cup C",
        season_name: "2023-2024",
        league_name: "National Cup",
      },
    ]);

    const result = await getPlayerCompetitions("player-1");

    expect(result).toHaveLength(3);
    expect(result[0].season_name).toBe("2024-2025");
    expect(result[1].season_name).toBe("2023-2024");
    expect(result[2].season_name).toBe("2022-2023");
  });

  it("returns empty array for a player with no competitions", async () => {
    setQueryResult(mock, "v_public_player_profiles", []);

    const result = await getPlayerCompetitions("player-1");
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// describe: getPlayerCareerTotals
// ---------------------------------------------------------------------------
describe("getPlayerCareerTotals", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns null when no leaders data exists", async () => {
    setQueryResult(mock, "v_public_leaders", []);

    const result = await getPlayerCareerTotals("player-1");
    expect(result).toBeNull();
  });

  it("returns null on query error", async () => {
    setQueryResult(mock, "v_public_leaders", null, new Error("DB error"));

    const result = await getPlayerCareerTotals("player-1");
    expect(result).toBeNull();
  });

  it("sums a single row correctly", async () => {
    setQueryResult(mock, "v_public_leaders", [
      { gp: 7, pts: 20, oreb: 2, dreb: 4, ast: 5 },
    ]);

    const result = await getPlayerCareerTotals("player-1");

    expect(result).not.toBeNull();
    expect(result!.gp).toBe(7);
    expect(result!.pts).toBe(20);
    expect(result!.reb).toBe(6);
    expect(result!.ast).toBe(5);
  });

  it("sums multiple rows correctly", async () => {
    setQueryResult(mock, "v_public_leaders", [
      { gp: 7, pts: 140, oreb: 14, dreb: 28, ast: 35 },
      { gp: 6, pts: 180, oreb: 6, dreb: 18, ast: 12 },
      { gp: 8, pts: 80, oreb: 0, dreb: 8, ast: 64 },
    ]);

    const result = await getPlayerCareerTotals("player-1");

    expect(result).not.toBeNull();
    expect(result!.gp).toBe(21);
    expect(result!.pts).toBe(400);
    expect(result!.reb).toBe(74);
    expect(result!.ast).toBe(111);
  });

  it("handles null stat fields gracefully", async () => {
    setQueryResult(mock, "v_public_leaders", [
      { gp: 5, pts: null, oreb: null, dreb: null, ast: null },
      { gp: 3, pts: 10, oreb: 1, dreb: 2, ast: 3 },
    ]);

    const result = await getPlayerCareerTotals("player-1");

    expect(result).not.toBeNull();
    expect(result!.gp).toBe(8);
    expect(result!.pts).toBe(10);
    expect(result!.reb).toBe(3);
    expect(result!.ast).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// describe: getMvpRace
// ---------------------------------------------------------------------------
describe("getMvpRace", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns empty array when no data exists", async () => {
    setQueryResult(mock, "v_public_leaders", []);

    const result = await getMvpRace("comp-1");
    expect(result).toEqual([]);
  });

  it("returns empty array on query error", async () => {
    setQueryResult(mock, "v_public_leaders", null, new Error("DB error"));

    const result = await getMvpRace("comp-1");
    expect(result).toEqual([]);
  });

  it("computes EFF and sorts descending", async () => {
    setQueryResult(mock, "v_public_leaders", [
      {
        player_id: "p1",
        player_name: "Player One",
        pts: 20,
        oreb: 1,
        dreb: 4,
        ast: 5,
        stl: 1,
        blk: 0,
        tov: 2,
        gp: 7,
        team_short_code: "T1",
        player_photo_url: null,
        photo_url: null,
        team_primary_color: null,
        team_slug: "team-1",
      },
      {
        player_id: "p2",
        player_name: "Player Two",
        pts: 30,
        oreb: 2,
        dreb: 6,
        ast: 2,
        stl: 2,
        blk: 1,
        tov: 3,
        gp: 6,
        team_short_code: "T2",
        player_photo_url: null,
        photo_url: null,
        team_primary_color: null,
        team_slug: "team-2",
      },
    ]);

    const result = await getMvpRace("comp-1");

    expect(result).toHaveLength(2);
    // p2: pts(30)+reb(8)+1.5*ast(3)+2*stl(4)+2*blk(2)-tov(3) = 44 / 6 = 7.333 → 7.3
    // p1: pts(20)+reb(5)+1.5*ast(7.5)+2*stl(2)+2*blk(0)-tov(2) = 32.5 / 7 = 4.642 → 4.6
    expect(result[0].player_id).toBe("p2");
    expect(result[0].eff).toBe(7.3);
    expect(result[1].player_id).toBe("p1");
    expect(result[1].eff).toBe(4.6);
  });

  it("limits results to top 5", async () => {
    const manyPlayers = Array.from({ length: 10 }, (_, i) => ({
      player_id: `p${i + 1}`,
      player_name: `Player ${i + 1}`,
      pts: 10 + i * 3,
      oreb: 1,
      dreb: 3,
      ast: 2,
      stl: 1,
      blk: 0,
      tov: 1,
      gp: 5,
      team_short_code: `T${i + 1}`,
      player_photo_url: null,
      photo_url: null,
      team_primary_color: null,
      team_slug: `team-${i + 1}`,
    }));

    setQueryResult(mock, "v_public_leaders", manyPlayers);

    const result = await getMvpRace("comp-1");

    expect(result).toHaveLength(5);
  });

  it("handles zero gp gracefully", async () => {
    setQueryResult(mock, "v_public_leaders", [
      {
        player_id: "p1",
        player_name: "Player One",
        pts: 0,
        oreb: 0,
        dreb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        tov: 0,
        gp: 0,
        team_short_code: "T1",
        player_photo_url: null,
        photo_url: null,
        team_primary_color: null,
        team_slug: "team-1",
      },
    ]);

    const result = await getMvpRace("comp-1");

    expect(result).toHaveLength(1);
    expect(result[0].eff).toBe(0);
  });

  it("includes photo_url from player_photo_url with fallback", async () => {
    setQueryResult(mock, "v_public_leaders", [
      {
        player_id: "p1",
        player_name: "Player One",
        pts: 10,
        oreb: 1,
        dreb: 2,
        ast: 3,
        stl: 0,
        blk: 0,
        tov: 1,
        gp: 5,
        team_short_code: "T1",
        player_photo_url: "https://example.com/photo.jpg",
        photo_url: null,
        team_primary_color: "#FF0000",
        team_slug: "team-1",
      },
    ]);

    const result = await getMvpRace("comp-1");

    expect(result[0].photo_url).toBe("https://example.com/photo.jpg");
  });
});

// ---------------------------------------------------------------------------
// describe: searchAll
// ---------------------------------------------------------------------------
describe("searchAll", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns empty result for empty query string", async () => {
    const result = await searchAll("");

    expect(result.players).toEqual([]);
    expect(result.teams).toEqual([]);
    expect(result.games).toEqual([]);
  });

  it("returns empty result for whitespace-only query", async () => {
    const result = await searchAll("   ");

    expect(result.players).toEqual([]);
    expect(result.games).toEqual([]);
  });

  it("returns players, teams, and games from parallel queries", async () => {
    setQueryResult(mock, "v_public_player_directory", [
      {
        player_id: "p1",
        player_name: "Test Player",
        player_name_latin: null,
        player_position: "Guard",
        photo_url: null,
        team_name: "Test Team",
        team_slug: "test-team",
        team_short_code: "TT",
        team_logo_url: null,
        team_primary_color: null,
        games_played: 7,
        points_per_game: 20,
        rebounds_per_game: 5,
        assists_per_game: 4,
      },
    ]);
    setQueryResult(mock, "v_public_standings", [
      {
        competition_id: "comp-1",
        competition_name: "Test League",
        season_id: "s1",
        season_name: "2024-2025",
        league_id: "l1",
        league_slug: "test-league",
        team_season_id: "ts-1",
        team_id: "team-1",
        team_name: "Test Team",
        team_slug: "test-team",
        team_logo_url: null,
        wins: 5,
        losses: 2,
        win_pct: 0.714,
        gb: 0,
        streak: "W3",
        last10: "7-3",
        points_for: 600,
        points_against: 520,
        w: 5,
        l: 2,
        team_short: "TT",
        team_color: null,
        team_short_code: "TT",
        team_primary_color: null,
      },
    ]);
    setQueryResult(mock, "v_public_games", [makeGameRow({ id: "game-1" })]);

    const result = await searchAll("test");

    expect(result.players).toHaveLength(1);
    expect(result.players[0].player_name).toBe("Test Player");
    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].team_name).toBe("Test Team");
    expect(result.games).toHaveLength(1);
    expect(result.games[0].id).toBe("game-1");
  });

  it("handles null data from any parallel query gracefully", async () => {
    setQueryResult(mock, "v_public_player_directory", null);
    setQueryResult(mock, "v_public_standings", null);
    setQueryResult(mock, "v_public_games", null);

    const result = await searchAll("test");

    expect(result.players).toEqual([]);
    expect(result.teams).toEqual([]);
    expect(result.games).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// describe: searchPlayersAndTeams
// ---------------------------------------------------------------------------
describe("searchPlayersAndTeams", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns empty result for query shorter than 2 characters", async () => {
    const result = await searchPlayersAndTeams("a");

    expect(result.players).toEqual([]);
    expect(result.teams).toEqual([]);
  });

  it("returns empty result for empty string", async () => {
    const result = await searchPlayersAndTeams("");

    expect(result.players).toEqual([]);
    expect(result.teams).toEqual([]);
  });

  it("returns players and teams from parallel queries", async () => {
    setQueryResult(mock, "v_public_players", [
      {
        id: "p1",
        canonical_name: "Test Player",
        name_latin: "Test Player",
        photo_url: null,
        team_name: "Test Team",
      },
    ]);
    setQueryResult(mock, "teams", [
      {
        slug: "test-team",
        name: "Test Team",
        short_code: "TT",
      },
    ]);

    const result = await searchPlayersAndTeams("test");

    expect(result.players).toHaveLength(1);
    expect(result.players[0].name).toBe("Test Player");
    expect(result.players[0].team).toBe("Test Team");
    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].name).toBe("Test Team");
    expect(result.teams[0].slug).toBe("test-team");
    expect(result.teams[0].short_code).toBe("TT");
  });

  it("returns empty when neither table matches", async () => {
    setQueryResult(mock, "v_public_players", []);
    setQueryResult(mock, "teams", []);

    const result = await searchPlayersAndTeams("zzzzz");

    expect(result.players).toHaveLength(0);
    expect(result.teams).toHaveLength(0);
  });

  it("handles null data from either query gracefully", async () => {
    setQueryResult(mock, "v_public_players", null);
    setQueryResult(mock, "teams", null);

    const result = await searchPlayersAndTeams("test");

    expect(result.players).toEqual([]);
    expect(result.teams).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// describe: getPlayerShotScatter
// ---------------------------------------------------------------------------
describe("getPlayerShotScatter", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns empty array when no games exist", async () => {
    setQueryResult(mock, "games", []);
    setQueryResult(mock, "stat_events", []);

    const result = await getPlayerShotScatter("player-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when no stat events exist", async () => {
    setQueryResult(mock, "games", [{ id: "game-1" }]);
    setQueryResult(mock, "stat_events", null);

    const result = await getPlayerShotScatter("player-1");
    expect(result).toEqual([]);
  });

  it("filters by competition_id when provided", async () => {
    setQueryResult(mock, "games", [{ id: "game-1" }]);
    setQueryResult(mock, "stat_events", []);

    const result = await getPlayerShotScatter("player-1", "comp-1");
    expect(result).toEqual([]);
  });

  it("returns shot coordinates with correct metadata", async () => {
    setQueryResult(mock, "games", [{ id: "game-1" }, { id: "game-2" }]);
    setQueryResult(mock, "stat_events", [
      {
        game_id: "game-1",
        event_type: "shot_2pt_made",
        period: 1,
        payload: { x: 100, y: 200, shot_type: "layup" },
        deleted_at: null,
      },
      {
        game_id: "game-1",
        event_type: "shot_3pt_missed",
        period: 2,
        payload: { x: 300, y: 400, shot_type: "jump" },
        deleted_at: null,
      },
      {
        game_id: "game-2",
        event_type: "shot_2pt_missed",
        period: 3,
        payload: { x: 150, y: 250, shot_type: "hook" },
        deleted_at: null,
      },
    ]);

    const result = await getPlayerShotScatter("player-1");

    expect(result).toHaveLength(3);

    expect(result[0].x).toBe(100);
    expect(result[0].y).toBe(200);
    expect(result[0].made).toBe(true);
    expect(result[0].shot_type).toBe("layup");
    expect(result[0].game_id).toBe("game-1");
    expect(result[0].period).toBe(1);

    expect(result[1].x).toBe(300);
    expect(result[1].y).toBe(400);
    expect(result[1].made).toBe(false);
    expect(result[1].shot_type).toBe("jump");

    expect(result[2].made).toBe(false);
    expect(result[2].shot_type).toBe("hook");
  });

  it("filters out events without valid x/y coordinates", async () => {
    setQueryResult(mock, "games", [{ id: "game-1" }]);
    setQueryResult(mock, "stat_events", [
      {
        game_id: "game-1",
        event_type: "shot_2pt_made",
        period: 1,
        payload: { x: 100, y: 200 },
        deleted_at: null,
      },
      {
        game_id: "game-1",
        event_type: "shot_3pt_missed",
        period: 2,
        payload: { x: "abc", y: 400 },
        deleted_at: null,
      },
      {
        game_id: "game-1",
        event_type: "shot_2pt_missed",
        period: 3,
        payload: { x: 0, y: "def" },
        deleted_at: null,
      },
      {
        game_id: "game-1",
        event_type: "shot_2pt_made",
        period: 4,
        payload: { y: 300 },
        deleted_at: null,
      },
    ]);

    const result = await getPlayerShotScatter("player-1");

    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(100);
    expect(result[0].y).toBe(200);
  });

  it("defaults shot_type to 'jump' when not provided", async () => {
    setQueryResult(mock, "games", [{ id: "game-1" }]);
    setQueryResult(mock, "stat_events", [
      {
        game_id: "game-1",
        event_type: "shot_2pt_made",
        period: 1,
        payload: { x: 100, y: 200 },
        deleted_at: null,
      },
    ]);

    const result = await getPlayerShotScatter("player-1");

    expect(result[0].shot_type).toBe("jump");
  });
});
