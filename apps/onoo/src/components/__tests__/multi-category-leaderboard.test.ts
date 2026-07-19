import { describe, expect, it } from "vitest";

// Extract multi-category leaderboard logic for testing
interface Leader {
  player_id: string;
  player_name: string;
  team_name: string;
  pts?: number;
  rebounds_per_game?: number;
  ast?: number;
  stl?: number;
  blk?: number;
}

type StatKey = keyof Pick<Leader, "pts" | "rebounds_per_game" | "ast" | "stl" | "blk">;

function getTopPerformers(
  leaders: Leader[],
  statKey: StatKey,
  count = 3,
): Leader[] {
  return [...leaders]
    .sort((a, b) => (b[statKey] ?? 0) - (a[statKey] ?? 0))
    .slice(0, count);
}

function hasData(leaders: Leader[], statKey: StatKey): boolean {
  return leaders.some((l) => l[statKey] != null && (l[statKey] as number) > 0);
}

describe("Multi-Category Leaderboard", () => {
  const leaders: Leader[] = [
    { player_id: "p1", player_name: "Player 1", team_name: "Team A", pts: 25, rebounds_per_game: 8, ast: 5, stl: 2, blk: 1 },
    { player_id: "p2", player_name: "Player 2", team_name: "Team B", pts: 22, rebounds_per_game: 9, ast: 6, stl: 1, blk: 2 },
    { player_id: "p3", player_name: "Player 3", team_name: "Team C", pts: 18, rebounds_per_game: 7, ast: 4, stl: 3, blk: 0 },
    { player_id: "p4", player_name: "Player 4", team_name: "Team D", pts: 15, rebounds_per_game: 10, ast: 3, stl: 0, blk: 0 },
  ];

  it("gets top 3 by points", () => {
    const top = getTopPerformers(leaders, "pts");
    expect(top).toHaveLength(3);
    expect(top[0].player_id).toBe("p1");
  });

  it("gets top 3 by rebounds", () => {
    const top = getTopPerformers(leaders, "rebounds_per_game");
    expect(top[0].player_id).toBe("p4");
  });

  it("gets top 3 by assists", () => {
    const top = getTopPerformers(leaders, "ast");
    expect(top[0].player_id).toBe("p2");
  });

  it("returns correct count", () => {
    const top = getTopPerformers(leaders, "pts", 2);
    expect(top).toHaveLength(2);
  });

  it("detects data presence", () => {
    expect(hasData(leaders, "pts")).toBe(true);
    // blk has values 1 and 2 which are > 0
    expect(hasData(leaders, "blk")).toBe(true);
  });

  it("detects no data for empty array", () => {
    expect(hasData([], "pts")).toBe(false);
  });

  it("handles empty leaders array", () => {
    const top = getTopPerformers([], "pts");
    expect(top).toHaveLength(0);
  });
});
