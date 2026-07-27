import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTeamQuickView } from "@/app/lib/data";
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

function makeStandingRow(overrides: Record<string, unknown> = {}) {
  return {
    team_id: "team-1",
    team_season_id: "ts-1",
    team_name: "Хасууд",
    team_slug: "khasuud",
    wins: 5,
    losses: 3,
    win_pct: 0.625,
    ...overrides,
  };
}

function makeGameRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "game-1",
    status: "official",
    competition_id: "comp-1",
    home_team_id: "team-1",
    home_team_name: "Хасууд",
    home_team_short_code: "ХАС",
    home_team_season_id: "ts-1",
    home_team_logo_url: null,
    home_team_primary_color: null,
    home_team_slug: "khasuud",
    home_score: 85,
    away_team_id: "team-2",
    away_team_name: "Арслангууд",
    away_team_short_code: "АРС",
    away_team_season_id: "ts-2",
    away_team_logo_url: null,
    away_team_primary_color: null,
    away_team_slug: "arslan",
    away_score: 72,
    scheduled_at: "2026-07-22T12:00:00Z",
    venue_name: "Төв ордон",
    season_id: "season-1",
    season_name: "2026",
    league_id: "league-1",
    league_name: "Үндэсний лиг",
    league_slug: "national-league",
    is_provisional: false,
    ...overrides,
  };
}

function makeLeaderRow(overrides: Record<string, unknown> = {}) {
  return {
    player_id: "player-1",
    player_name: "Б. Төгөлдөр",
    player_name_latin: "B. Tögöldör",
    player_photo_url: null,
    team_season_id: "ts-1",
    team_id: "team-1",
    team_name: "Хасууд",
    team_slug: "khasuud",
    gp: 8,
    pts: 22.5,
    oreb: 2.1,
    dreb: 5.3,
    ast: 4.8,
    qualified: true,
    team_games_played: 8,
    ...overrides,
  };
}

describe("getTeamQuickView", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns null when team_season_id is not found", async () => {
    setQueryResult(mock, "v_public_standings", null);
    const result = await getTeamQuickView("nonexistent");
    expect(result).toBeNull();
  });

  it("returns quick view data for a valid team", async () => {
    setQueryResult(
      mock,
      "v_public_standings",
      makeStandingRow({ team_season_id: "ts-1" }),
    );
    setQueryResult(mock, "v_public_games", [
      makeGameRow({ id: "g1", home_score: 85, away_score: 72 }),
      makeGameRow({ id: "g2", home_score: 91, away_score: 88 }),
    ]);
    setQueryResult(mock, "v_public_leaders", [
      makeLeaderRow({ player_id: "p1", pts: 22.5 }),
      makeLeaderRow({ player_id: "p2", pts: 18.2 }),
      makeLeaderRow({ player_id: "p3", pts: 15.0 }),
    ]);

    const result = await getTeamQuickView("ts-1");

    expect(result).not.toBeNull();
    expect(result?.recentGames).toHaveLength(2);
    expect(result?.recentGames[0].id).toBe("g1");
    expect(result?.recentGames[1].home_score).toBe(91);
    expect(result?.leaders).toHaveLength(3);
    expect(result?.leaders[0].pts).toBe(22.5);
    expect(result?.leaders[1].pts).toBe(18.2);
    expect(result?.leaders[2].pts).toBe(15.0);
  });

  it("returns empty recentGames when no past games exist", async () => {
    setQueryResult(mock, "v_public_standings", makeStandingRow());
    setQueryResult(mock, "v_public_games", []);
    setQueryResult(mock, "v_public_leaders", [makeLeaderRow()]);

    const result = await getTeamQuickView("ts-1");
    expect(result).not.toBeNull();
    expect(result?.recentGames).toEqual([]);
  });

  it("returns empty leaders when no leader data exists", async () => {
    setQueryResult(mock, "v_public_standings", makeStandingRow());
    setQueryResult(mock, "v_public_games", [makeGameRow()]);
    setQueryResult(mock, "v_public_leaders", []);

    const result = await getTeamQuickView("ts-1");
    expect(result).not.toBeNull();
    expect(result?.leaders).toEqual([]);
  });

  it("maps backward-compatible game aliases", async () => {
    const gameRow = makeGameRow({
      home_team_name: "Хасууд",
      home_team_short_code: "ХАС",
    });
    setQueryResult(mock, "v_public_standings", makeStandingRow());
    setQueryResult(mock, "v_public_games", [gameRow]);
    setQueryResult(mock, "v_public_leaders", []);

    const result = await getTeamQuickView("ts-1");

    expect(result?.recentGames[0].home_name).toBe("Хасууд");
    expect(result?.recentGames[0].home_short).toBe("ХАС");
  });

  it("maps backward-compatible leader aliases", async () => {
    setQueryResult(mock, "v_public_standings", makeStandingRow());
    setQueryResult(mock, "v_public_games", [makeGameRow()]);
    setQueryResult(mock, "v_public_leaders", [
      makeLeaderRow({ player_name_latin: "Test" }),
    ]);

    const result = await getTeamQuickView("ts-1");

    expect(result?.leaders[0].player_latin).toBe("Test");
    expect(result?.leaders[0].qualified).toBe(true);
  });
});
