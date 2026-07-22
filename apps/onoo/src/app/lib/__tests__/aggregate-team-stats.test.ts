import { describe, expect, it } from "vitest";
import { aggregateTeamStats } from "@/app/lib/data";
import type { TeamAdvancedStatsPerGame } from "@/app/lib/shared";

function makeGame(
  overrides: Partial<TeamAdvancedStatsPerGame> & {
    result: "W" | "L";
    ortg: number;
    drtg: number;
    net_rtg: number;
    pace: number;
    efg: number;
    tov_pct: number;
    oreb_pct: number;
    fta_rate: number;
    pie: number;
  },
): TeamAdvancedStatsPerGame {
  return {
    game_id: "g1",
    scheduled_at: "2026-07-01T12:00:00Z",
    opponent_name: "Team A",
    opponent_slug: "team-a",
    home_away: "home",
    team_score: 80,
    opp_score: 70,
    result: "W",
    ortg: 100,
    drtg: 100,
    net_rtg: 0,
    pace: 95,
    efg: 0.5,
    tov_pct: 0.15,
    oreb_pct: 0.28,
    fta_rate: 0.22,
    pie: 0.5,
    ...overrides,
  };
}

describe("aggregateTeamStats", () => {
  it("returns all-zeros with games_played=0 for empty array", () => {
    const result = aggregateTeamStats([]);

    expect(result).toEqual({
      games_played: 0,
      avg_ortg: 0,
      avg_drtg: 0,
      avg_net_rtg: 0,
      avg_pace: 0,
      avg_efg: 0,
      avg_tov_pct: 0,
      avg_oreb_pct: 0,
      avg_fta_rate: 0,
      avg_pie: 0,
      wins: 0,
      losses: 0,
    });
  });

  it("returns the game's own values for a single game", () => {
    const result = aggregateTeamStats([
      makeGame({
        game_id: "g1",
        ortg: 110.5,
        drtg: 102.3,
        net_rtg: 8.2,
        pace: 97.8,
        efg: 0.568,
        tov_pct: 0.118,
        oreb_pct: 0.312,
        fta_rate: 0.245,
        pie: 0.572,
        result: "W",
      }),
    ]);

    expect(result.games_played).toBe(1);
    expect(result.avg_ortg).toBeCloseTo(110.5);
    expect(result.avg_drtg).toBeCloseTo(102.3);
    expect(result.avg_net_rtg).toBeCloseTo(8.2);
    expect(result.avg_pace).toBeCloseTo(97.8);
    expect(result.avg_efg).toBeCloseTo(0.568);
    expect(result.avg_tov_pct).toBeCloseTo(0.118);
    expect(result.avg_oreb_pct).toBeCloseTo(0.312);
    expect(result.avg_fta_rate).toBeCloseTo(0.245);
    expect(result.avg_pie).toBeCloseTo(0.572);
    expect(result.wins).toBe(1);
    expect(result.losses).toBe(0);
  });

  it("computes averages correctly for 3 games", () => {
    const games = [
      makeGame({
        game_id: "g1",
        ortg: 110,
        drtg: 100,
        net_rtg: 10,
        pace: 98,
        efg: 0.55,
        tov_pct: 0.12,
        oreb_pct: 0.3,
        fta_rate: 0.25,
        pie: 0.55,
        result: "W",
      }),
      makeGame({
        game_id: "g2",
        ortg: 105,
        drtg: 102,
        net_rtg: 3,
        pace: 95,
        efg: 0.52,
        tov_pct: 0.14,
        oreb_pct: 0.28,
        fta_rate: 0.22,
        pie: 0.5,
        result: "W",
      }),
      makeGame({
        game_id: "g3",
        ortg: 95,
        drtg: 110,
        net_rtg: -15,
        pace: 92,
        efg: 0.45,
        tov_pct: 0.18,
        oreb_pct: 0.25,
        fta_rate: 0.2,
        pie: 0.45,
        result: "L",
      }),
    ];

    const result = aggregateTeamStats(games);

    expect(result.games_played).toBe(3);
    expect(result.avg_ortg).toBeCloseTo((110 + 105 + 95) / 3);
    expect(result.avg_drtg).toBeCloseTo((100 + 102 + 110) / 3);
    expect(result.avg_net_rtg).toBeCloseTo((10 + 3 + -15) / 3);
    expect(result.avg_pace).toBeCloseTo((98 + 95 + 92) / 3);
    expect(result.avg_efg).toBeCloseTo((0.55 + 0.52 + 0.45) / 3);
    expect(result.avg_tov_pct).toBeCloseTo((0.12 + 0.14 + 0.18) / 3);
    expect(result.avg_oreb_pct).toBeCloseTo((0.3 + 0.28 + 0.25) / 3);
    expect(result.avg_fta_rate).toBeCloseTo((0.25 + 0.22 + 0.2) / 3);
    expect(result.avg_pie).toBeCloseTo((0.55 + 0.5 + 0.45) / 3);
  });

  it("counts wins and losses correctly", () => {
    const games = [
      makeGame({
        game_id: "g1",
        team_score: 80,
        opp_score: 70,
        result: "W",
        ortg: 105,
        drtg: 100,
        net_rtg: 5,
        pace: 95,
        efg: 0.52,
        tov_pct: 0.14,
        oreb_pct: 0.28,
        fta_rate: 0.22,
        pie: 0.52,
      }),
      makeGame({
        game_id: "g2",
        team_score: 90,
        opp_score: 85,
        result: "W",
        ortg: 110,
        drtg: 98,
        net_rtg: 12,
        pace: 97,
        efg: 0.55,
        tov_pct: 0.12,
        oreb_pct: 0.3,
        fta_rate: 0.25,
        pie: 0.58,
      }),
      makeGame({
        game_id: "g3",
        team_score: 70,
        opp_score: 88,
        result: "L",
        ortg: 95,
        drtg: 108,
        net_rtg: -13,
        pace: 92,
        efg: 0.46,
        tov_pct: 0.17,
        oreb_pct: 0.26,
        fta_rate: 0.2,
        pie: 0.42,
      }),
    ];

    const result = aggregateTeamStats(games);

    expect(result.wins).toBe(2);
    expect(result.losses).toBe(1);
    expect(result.games_played).toBe(3);
  });
});
