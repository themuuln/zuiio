import { beforeEach, describe, expect, it, vi } from "vitest";
import { getGamesByDate, getLeaders, getStandings } from "@/app/lib/data";
import type { GameWithTeams, LeaderRow, StandingRow } from "@/app/lib/shared";
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
    team_name: "Баг",
    team_slug: "bag",
    team_logo_url: null,
    wins: 5,
    losses: 3,
    win_pct: 0.625,
    games_back: 0,
    home_record: "3-1",
    away_record: "2-2",
    last_10: "5-3",
    streak: "W2",
    ...overrides,
  };
}

function makeLeaderRow(overrides: Record<string, unknown> = {}) {
  return {
    player_id: "player-1",
    player_name: "Тоглогч",
    player_name_latin: "Toglooch",
    player_photo_url: null,
    team_id: "team-1",
    team_name: "Баг",
    stat_type: "pts",
    value: 20.5,
    gp: 10,
    qualified: true,
    team_games_played: 10,
    ...overrides,
  };
}

function makeGameRow(overrides: Record<string, unknown> = {}) {
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
    ...overrides,
  };
}

describe("getStandings", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns an empty array when no standings exist", async () => {
    setQueryResult(mock, "v_public_standings", []);
    const result = await getStandings();
    expect(result).toEqual([]);
  });

  it("returns mapped standings", async () => {
    const rows = [
      makeStandingRow({ team_id: "team-1", wins: 5, losses: 3 }),
      makeStandingRow({ team_id: "team-2", wins: 4, losses: 4 }),
    ];
    setQueryResult(mock, "v_public_standings", rows);
    const result = await getStandings();
    expect(result).toHaveLength(2);
    expect(result[0].team_id).toBe("team-1");
    expect(result[0].wins).toBe(5);
    expect(result[0].losses).toBe(3);
  });

  it("maps w/l aliases from wins/losses", async () => {
    setQueryResult(mock, "v_public_standings", [
      makeStandingRow({ wins: 10, losses: 2 }),
    ]);
    const result = await getStandings();
    expect(result[0].w).toBe(10);
    expect(result[0].l).toBe(2);
  });

  it("renders team_short from team_slug", async () => {
    setQueryResult(mock, "v_public_standings", [
      makeStandingRow({ team_slug: "slug-1" }),
    ]);
    const result = await getStandings();
    expect(result[0].team_short).toBe("slug-1");
  });
});

describe("getLeaders", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns an empty array when no leaders", async () => {
    setQueryResult(mock, "v_public_leaders", []);
    const result = await getLeaders();
    expect(result).toEqual([]);
  });

  it("maps a leader row with required fields", async () => {
    setQueryResult(mock, "v_public_leaders", [
      makeLeaderRow({ player_id: "p-1", stat_type: "pts", value: 25.0 }),
    ]);
    const result = await getLeaders();
    expect(result).toHaveLength(1);
    expect(result[0].player_id).toBe("p-1");
    expect(result[0].stat_type).toBe("pts");
    expect(result[0].value).toBe(25.0);
  });

  it("renders player_latin from player_name_latin", async () => {
    setQueryResult(mock, "v_public_leaders", [
      makeLeaderRow({ player_name_latin: "Bat" }),
    ]);
    const result = await getLeaders();
    expect(result[0].player_latin).toBe("Bat");
  });

  it("marks unqualified players when qualified is false", async () => {
    setQueryResult(mock, "v_public_leaders", [
      makeLeaderRow({ qualified: false }),
    ]);
    const result = await getLeaders();
    expect(result[0].qualified).toBe(false);
  });

  it("renders team_short from team_name", async () => {
    setQueryResult(mock, "v_public_leaders", [
      makeLeaderRow({ team_name: "BAG-A" }),
    ]);
    const result = await getLeaders();
    expect(result[0].team_short).toBe("BAG-A");
  });
});

describe("getGamesByDate", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns an empty array when no games", async () => {
    setQueryResult(mock, "v_public_games", []);
    const result = await getGamesByDate("2026-07-22");
    expect(result).toEqual([]);
  });

  it("maps game rows with home/away fields", async () => {
    const rows = [
      makeGameRow({
        id: "g-1",
        home_team_name: "Баг А",
        home_team_short_code: "BA",
        away_team_name: "Баг Б",
        away_team_short_code: "BB",
      }),
    ];
    setQueryResult(mock, "v_public_games", rows);
    const result = await getGamesByDate("2026-07-22");
    expect(result).toHaveLength(1);
    expect(result[0].home_team_name).toBe("Баг А");
    expect(result[0].home_team_short_code).toBe("BA");
    expect(result[0].away_team_name).toBe("Баг Б");
    expect(result[0].away_team_short_code).toBe("BB");
  });

  it("fills empty strings for missing home/away names", async () => {
    setQueryResult(mock, "v_public_games", [
      makeGameRow({ home_team_name: null, away_team_name: null }),
    ]);
    const result = await getGamesByDate("2026-07-22");
    // mapGameRow sets home_name/away_name via ?? "", leaving the original fields as-is
    expect(result[0].home_name).toBe("");
    expect(result[0].home_team_name).toBeNull();
  });
});
