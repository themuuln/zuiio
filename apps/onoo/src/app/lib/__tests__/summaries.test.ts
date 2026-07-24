import { describe, expect, it } from "vitest";
import { generatePlayerGameSummary } from "@/app/lib/summaries";

function makeStats(overrides: Record<string, unknown> = {}) {
  return {
    player_name: "Батбаатар",
    pts: 12,
    reb: 5,
    ast: 3,
    stl: 1,
    blk: 0,
    fgm: 5,
    fga: 10,
    result: "W" as const,
    team_score: 85,
    opponent_score: 72,
    opponent_short_code: "TIT",
    ...overrides,
  };
}

describe("generatePlayerGameSummary", () => {
  // 1 — 20+ points
  it("uses scorer narrative for 20+ points with win", () => {
    const result = generatePlayerGameSummary(makeStats({ pts: 25 }));
    expect(result).toContain("Батбаатар");
    expect(result).toContain("25");
    expect(result).toContain("цохиж");
    expect(result).toContain("ялалт авлаа");
  });

  it("uses scorer narrative for exactly 20 points", () => {
    const result = generatePlayerGameSummary(makeStats({ pts: 20 }));
    expect(result).toContain("цохиж");
  });

  it("uses scorer narrative with loss outcome", () => {
    const result = generatePlayerGameSummary(
      makeStats({ pts: 30, result: "L", team_score: 80, opponent_score: 95 }),
    );
    expect(result).toContain("ялагдлаа");
  });

  // 2 — Double-double
  it("highlights double-double with pts+reb", () => {
    const result = generatePlayerGameSummary(
      makeStats({ pts: 14, reb: 12, ast: 3 }),
    );
    expect(result).toContain("double-double");
    expect(result).toContain("14 оноо");
    expect(result).toContain("12 буулт");
  });

  it("highlights double-double with pts+ast", () => {
    const result = generatePlayerGameSummary(
      makeStats({ pts: 10, reb: 7, ast: 11 }),
    );
    expect(result).toContain("double-double");
    expect(result).toContain("10 оноо");
    expect(result).toContain("11 дамжуулалт");
  });

  it("highlights double-double with pts+stl", () => {
    const result = generatePlayerGameSummary(
      makeStats({ pts: 10, reb: 4, ast: 5, stl: 10 }),
    );
    expect(result).toContain("double-double");
    expect(result).toContain("10 бөмбөг таслалт");
  });

  it("highlights double-double with pts+blk", () => {
    const result = generatePlayerGameSummary(
      makeStats({ pts: 11, reb: 3, ast: 2, stl: 1, blk: 12 }),
    );
    expect(result).toContain("double-double");
    expect(result).toContain("12 блок");
  });

  it("double-double with 3 double-digit categories includes all", () => {
    const result = generatePlayerGameSummary(
      makeStats({ pts: 18, reb: 11, ast: 10 }),
    );
    expect(result).toContain("double-double");
    expect(result).toContain("18 оноо");
    expect(result).toContain("11 буулт");
    expect(result).toContain("10 дамжуулалт");
  });

  it("does NOT call double-double when only pts >= 10", () => {
    const result = generatePlayerGameSummary(
      makeStats({ pts: 15, reb: 5, ast: 3 }),
    );
    expect(result).not.toContain("double-double");
  });

  // 3 — 15+ points
  it("uses contributor narrative for 15-19 points", () => {
    const result = generatePlayerGameSummary(makeStats({ pts: 17 }));
    expect(result).toContain("тус боллоо");
    expect(result).toContain("17");
  });

  it("uses contributor narrative for exactly 15 points", () => {
    const result = generatePlayerGameSummary(makeStats({ pts: 15 }));
    expect(result).toContain("тус боллоо");
  });

  // 4 — High efficiency
  it("uses efficiency narrative for FG% > 60% on 5+ attempts", () => {
    const result = generatePlayerGameSummary(
      makeStats({ pts: 13, fgm: 5, fga: 7 }),
    );
    expect(result).toContain("үр ашгаар тоглож");
    expect(result).toContain("5/7");
  });

  it("uses efficiency narrative for exactly 60% on 5 attempts", () => {
    // fgm/fga = 3/5 = 0.6, NOT > 0.6, so this should NOT match
    const result = generatePlayerGameSummary(
      makeStats({ pts: 8, fgm: 3, fga: 5 }),
    );
    expect(result).not.toContain("үр ашгаар");
  });

  it("does NOT use efficiency narrative when under 5 attempts", () => {
    const result = generatePlayerGameSummary(
      makeStats({ pts: 6, fgm: 4, fga: 4 }),
    );
    expect(result).not.toContain("үр ашгаар");
  });

  it("does NOT use efficiency narrative when FG% <= 60%", () => {
    const result = generatePlayerGameSummary(
      makeStats({ pts: 6, fgm: 3, fga: 5 }),
    );
    expect(result).not.toContain("үр ашгаар");
  });

  // 5 — Default
  it("uses default stat line for low stats", () => {
    const result = generatePlayerGameSummary(
      makeStats({ pts: 4, reb: 2, ast: 1 }),
    );
    expect(result).toBe("Батбаатар 4 оноо, 2 буулт, 1 дамжуулалт");
  });

  it("uses default stat line for zero stats", () => {
    const result = generatePlayerGameSummary(
      makeStats({ pts: 0, reb: 0, ast: 0, fgm: 0, fga: 0 }),
    );
    expect(result).toBe("Батбаатар 0 оноо, 0 буулт, 0 дамжуулалт");
  });
});
