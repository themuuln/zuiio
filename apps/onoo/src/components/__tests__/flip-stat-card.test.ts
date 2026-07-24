import { describe, expect, it } from "vitest";

// Extract rank computation logic for testing
function computeRank(
  playerId: string,
  statKey: "pts" | "reb" | "ast" | "stl" | "blk",
  leaders: Array<{
    player_id: string;
    pts?: number;
    reb?: number;
    ast?: number;
    stl?: number;
    blk?: number;
  }>,
  competitionId?: string,
): number | null {
  const filtered = competitionId
    ? leaders.filter((l) => l.competition_id === competitionId)
    : leaders;

  const sorted = [...filtered].sort(
    (a, b) => (b[statKey] ?? 0) - (a[statKey] ?? 0),
  );

  const rank = sorted.findIndex((l) => l.player_id === playerId);
  return rank >= 0 ? rank + 1 : null;
}

describe("FlipStatCard rank computation", () => {
  const leaders = [
    { player_id: "p1", pts: 25.5, reb: 8.2, ast: 5.1 },
    { player_id: "p2", pts: 22.3, reb: 9.1, ast: 6.3 },
    { player_id: "p3", pts: 18.7, reb: 7.5, ast: 4.8 },
    { player_id: "p4", pts: 15.2, reb: 10.3, ast: 3.2 },
  ];

  it("returns correct rank for points leader", () => {
    expect(computeRank("p1", "pts", leaders)).toBe(1);
  });

  it("returns correct rank for second place", () => {
    expect(computeRank("p2", "pts", leaders)).toBe(2);
  });

  it("returns correct rank for rebounds leader", () => {
    expect(computeRank("p4", "reb", leaders)).toBe(1);
  });

  it("returns null for unknown player", () => {
    expect(computeRank("unknown", "pts", leaders)).toBeNull();
  });

  it("handles empty leaders array", () => {
    expect(computeRank("p1", "pts", [])).toBeNull();
  });

  it("handles null stat values", () => {
    const withNulls = [
      { player_id: "p1", pts: null as unknown as number },
      { player_id: "p2", pts: 20 },
    ];
    expect(computeRank("p2", "pts", withNulls)).toBe(1);
  });

  it("filters by competition_id", () => {
    const withCompetitions = [
      { player_id: "p1", pts: 25, competition_id: "c1" },
      { player_id: "p2", pts: 30, competition_id: "c2" },
      { player_id: "p3", pts: 20, competition_id: "c1" },
    ];
    expect(computeRank("p1", "pts", withCompetitions, "c1")).toBe(1);
  });
});
