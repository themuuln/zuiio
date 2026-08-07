import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPlayerComparison, searchPlayers } from "@/app/lib/data-comparison";
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

function makeLeaderRow(overrides: Record<string, unknown> = {}) {
  return {
    player_id: "player-1",
    player_name: "Тоглогч",
    photo_url: null,
    gp: 10,
    pts: 20,
    ast: 5,
    oreb: 2,
    dreb: 4,
    stl: 1.5,
    blk: 0.5,
    fgm: 7,
    fga: 14,
    tpm: 2,
    tpa: 5,
    ftm: 4,
    fta: 5,
    tov: 2,
    pf: 2,
    team_season_id: "ts-1",
    ...overrides,
  };
}

describe("getPlayerComparison", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns null when no data found", async () => {
    setQueryResult(mock, "v_public_leaders", null);
    const result = await getPlayerComparison("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when gp is 0", async () => {
    setQueryResult(mock, "v_public_leaders", makeLeaderRow({ gp: 0 }));
    const result = await getPlayerComparison("player-0");
    expect(result).toBeNull();
  });

  it("returns comparison data for valid player", async () => {
    setQueryResult(mock, "v_public_leaders", makeLeaderRow());
    const result = await getPlayerComparison("player-1");
    expect(result).not.toBeNull();
    expect(result?.player_id).toBe("player-1");
    expect(result?.name).toBe("Тоглогч");
    expect(result?.games_played).toBe(10);
  });

  it("computes per-game averages correctly", async () => {
    setQueryResult(mock, "v_public_leaders", makeLeaderRow());
    const result = await getPlayerComparison("player-1");
    expect(result?.stats.ppg).toBe(20);
    expect(result?.stats.rpg).toBe(6); // oreb(2) + dreb(4)
    expect(result?.stats.apg).toBe(5);
    expect(result?.stats.spg).toBe(1.5);
    expect(result?.stats.bpg).toBe(0.5);
  });

  it("computes shooting percentages correctly", async () => {
    setQueryResult(mock, "v_public_leaders", makeLeaderRow());
    const result = await getPlayerComparison("player-1");
    expect(result?.stats.fg_pct).toBe(50); // 7/14
    expect(result?.stats.three_p_pct).toBe(40); // 2/5
    expect(result?.stats.ft_pct).toBe(80); // 4/5
  });

  it("handles zero attempts without division by zero", async () => {
    setQueryResult(
      mock,
      "v_public_leaders",
      makeLeaderRow({ fga: 0, tpa: 0, fta: 0 }),
    );
    const result = await getPlayerComparison("player-1");
    expect(result?.stats.fg_pct).toBe(0);
    expect(result?.stats.three_p_pct).toBe(0);
    expect(result?.stats.ft_pct).toBe(0);
  });

  it("computes PIE as non-negative number", async () => {
    setQueryResult(mock, "v_public_leaders", makeLeaderRow());
    const result = await getPlayerComparison("player-1");
    expect(result?.stats.pie).toBeGreaterThanOrEqual(0);
  });

  it("computes ORtg as non-negative number", async () => {
    setQueryResult(mock, "v_public_leaders", makeLeaderRow());
    const result = await getPlayerComparison("player-1");
    expect(result?.stats.ortg).toBeGreaterThanOrEqual(0);
  });
});

describe("searchPlayers", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns empty array when no results", async () => {
    setQueryResult(mock, "v_public_player_directory", []);
    const results = await searchPlayers("nonexistent");
    expect(results).toEqual([]);
  });

  it("returns player id/name pairs from v_public_player_directory", async () => {
    setQueryResult(mock, "v_public_player_directory", [
      { player_id: "p1", player_name: "Bat", team_name: "Eagles" },
      { player_id: "p2", player_name: "Bold", team_name: "Lions" },
    ]);
    const results = await searchPlayers("Bat");
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ id: "p1", name: "Bat · Eagles" });
  });
});
