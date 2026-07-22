import { describe, expect, it } from "vitest";
import {
  computeSeasonAdvancedStats,
  computeStreaks,
} from "../_advanced-helpers";
import type { PlayerGameLine } from "@/app/lib/shared";

function makeGame(overrides: Partial<PlayerGameLine> = {}): PlayerGameLine {
  return {
    game_id: "g1",
    revision_id: "r1",
    revision_number: 1,
    revision_approved_at: "2026-07-01T12:00:00Z",
    player_id: "p1",
    player_name: "Test Player",
    player_name_latin: null,
    player_position: null,
    team_season_id: "ts1",
    team_id: "t1",
    team_name: "Team A",
    jersey_number: 5,
    seconds_played: 1200,
    pts: 20,
    fgm: 8,
    fga: 15,
    tpm: 2,
    tpa: 5,
    ftm: 2,
    fta: 3,
    oreb: 2,
    dreb: 5,
    ast: 4,
    stl: 1,
    blk: 1,
    tov: 3,
    pf: 2,
    source_type: "tracker_journal",
    evidence_url: null,
    source_reviewed_at: "2026-07-01T12:00:00Z",
    team_short: "TEA",
    game_date: "2026-07-01",
    opponent_name: "Team B",
    opponent_short_code: "TEB",
    opponent_logo_url: null,
    team_score: 80,
    opponent_score: 70,
    result: "W",
    is_home: true,
    ...overrides,
  };
}

describe("computeSeasonAdvancedStats", () => {
  it("returns null for empty game log", () => {
    expect(computeSeasonAdvancedStats([])).toBeNull();
  });

  it("computes advanced stats from a single game", () => {
    const stats = computeSeasonAdvancedStats([makeGame()]);

    expect(stats).not.toBeNull();
    expect(stats!.gp).toBe(1);
    expect(stats!.mpg).toBeCloseTo(20, 1); // 1200s = 20 min
    expect(stats!.efgPct).toBeCloseTo((8 + 0.5 * 2) / 15, 5);
    expect(stats!.tsPct).toBeCloseTo(20 / (2 * (15 + 0.44 * 3)), 5);
    expect(stats!.avgGameScore).toBeGreaterThan(0);
    expect(stats!.astTovRatio).toBeCloseTo(4 / 3, 5);
    expect(stats!.ptsPer36).toBeCloseTo((20 / 20) * 36, 5);
    expect(stats!.rebPer36).toBeCloseTo(((2 + 5) / 20) * 36, 5);
    expect(stats!.astPer36).toBeCloseTo((4 / 20) * 36, 5);
  });

  it("aggregates across multiple games", () => {
    const game1 = makeGame({ pts: 20, fgm: 8, fga: 15, seconds_played: 1200 });
    const game2 = makeGame({
      game_id: "g2",
      pts: 30,
      fgm: 12,
      fga: 20,
      seconds_played: 1500,
      result: "L",
      is_home: false,
    });

    const stats = computeSeasonAdvancedStats([game1, game2]);

    expect(stats).not.toBeNull();
    expect(stats!.gp).toBe(2);
    // Total 50 pts over 2700s = 45 min → per 36
    expect(stats!.ptsPer36).toBeCloseTo((50 / 45) * 36, 3);
    expect(stats!.astTovRatio).toBeCloseTo(8 / 6, 5);
  });

  it("handles players with no shot attempts", () => {
    const defensive = makeGame({
      pts: 0,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      ast: 0,
      seconds_played: 600,
    });

    const stats = computeSeasonAdvancedStats([defensive]);
    expect(stats!.efgPct).toBe(0);
    expect(stats!.tsPct).toBe(0);
    expect(stats!.astTovRatio).toBe(0);
  });

  it("handles perfect AST/TO when no turnovers", () => {
    const noTov = makeGame({ tov: 0, ast: 7 });

    const stats = computeSeasonAdvancedStats([noTov]);
    expect(stats!.astTovRatio).toBe(7); // All AST, zero TOV
  });

  it("handles DNP (zero minutes)", () => {
    const dnp = makeGame({ seconds_played: 0, pts: 0, fgm: 0, fga: 0 });

    const stats = computeSeasonAdvancedStats([dnp, makeGame()]);
    expect(stats).not.toBeNull();
    expect(stats!.mpg).toBeCloseTo(20 / 2, 1); // Only one game with minutes
    expect(stats!.ptsPer36).toBeGreaterThan(0); // Still computes from non-DNP games
  });
});

describe("computeStreaks", () => {
  it("detects current winning streak from most recent games", () => {
    const games = [
      makeGame({ result: "W" }),
      makeGame({ result: "W" }),
      makeGame({ result: "W" }),
    ];
    const streaks = computeStreaks(games);
    expect(streaks.currentStreak).toEqual({ type: "W", length: 3 });
    expect(streaks.longestWinStreak).toBe(3);
  });

  it("detects current losing streak", () => {
    const games = [
      makeGame({ result: "W" }),
      makeGame({ result: "L", is_home: false }),
      makeGame({ result: "L", is_home: false }),
    ];
    const streaks = computeStreaks(games);
    expect(streaks.currentStreak).toEqual({ type: "L", length: 2 });
    expect(streaks.longestLossStreak).toBe(2);
  });

  it("tracks longest streaks across mixed results", () => {
    const games = [
      makeGame({ result: "W" }),
      makeGame({ result: "W" }),
      makeGame({ result: "W" }),
      makeGame({ result: "L", is_home: false }),
      makeGame({ result: "W" }),
    ];
    const streaks = computeStreaks(games);
    expect(streaks.longestWinStreak).toBe(3);
    expect(streaks.longestLossStreak).toBe(1);
    // Current is a win streak of 1 (last game)
    expect(streaks.currentStreak).toEqual({ type: "W", length: 1 });
  });

  it("detects scoring streaks of 10+ points", () => {
    const games = [
      makeGame({ pts: 5 }),
      makeGame({ pts: 15 }),
      makeGame({ pts: 22 }),
      makeGame({ pts: 8 }),
      makeGame({ pts: 12 }),
    ];
    const streaks = computeStreaks(games);
    expect(streaks.longestScoringStreak).toBe(2);
    // Current scoring streak: last game = 12 >= 10, but 8 before that breaks it
    expect(streaks.currentScoringStreak).toBe(1);
  });
});
