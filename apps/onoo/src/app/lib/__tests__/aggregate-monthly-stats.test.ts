import { describe, expect, it } from "vitest";
import { aggregateMonthlyStats } from "@/app/lib/data";
import type { PlayerGameLine } from "@/app/lib/shared";

function makeGame(
  overrides: Partial<PlayerGameLine> & { game_date: string },
): PlayerGameLine {
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

describe("aggregateMonthlyStats", () => {
  it("returns empty array for empty game log", () => {
    expect(aggregateMonthlyStats([])).toEqual([]);
  });

  it("groups games into correct month buckets", () => {
    const games = [
      makeGame({
        game_date: "2026-01-15",
        pts: 10,
        seconds_played: 600,
      }),
      makeGame({
        game_date: "2026-01-20",
        pts: 20,
        seconds_played: 600,
      }),
      makeGame({
        game_date: "2026-02-10",
        pts: 30,
        seconds_played: 1200,
      }),
    ];

    const result = aggregateMonthlyStats(games);

    expect(result).toHaveLength(2);
    expect(result[0].month).toBe("2026-01");
    expect(result[0].gamesPlayed).toBe(2);
    expect(result[0].avgPts).toBe(15); // (10 + 20) / 2
    expect(result[1].month).toBe("2026-02");
    expect(result[1].gamesPlayed).toBe(1);
    expect(result[1].avgPts).toBe(30);
  });

  it("computes averages correctly for multiple stats", () => {
    const games = [
      makeGame({
        game_date: "2026-07-01",
        pts: 10,
        oreb: 1,
        dreb: 3,
        ast: 5,
        stl: 2,
        blk: 1,
        tov: 1,
        seconds_played: 600,
      }),
      makeGame({
        game_date: "2026-07-05",
        pts: 20,
        oreb: 2,
        dreb: 4,
        ast: 3,
        stl: 0,
        blk: 2,
        tov: 4,
        seconds_played: 900,
      }),
    ];

    const result = aggregateMonthlyStats(games);
    expect(result).toHaveLength(1);

    const month = result[0];
    expect(month.avgPts).toBe(15); // (10+20)/2
    expect(month.avgReb).toBe(5); // ((1+3)+(2+4))/2 = 10/2
    expect(month.avgAst).toBe(4); // (5+3)/2
    expect(month.avgStl).toBe(1); // (2+0)/2
    expect(month.avgBlk).toBe(1.5); // (1+2)/2
    expect(month.avgTov).toBe(2.5); // (1+4)/2
    expect(month.avgMpg).toBe(12.5); // (600+900)/2 = 750s → 12.5 min
  });

  it("computes shooting percentages from aggregates", () => {
    const games = [
      makeGame({
        game_date: "2026-03-01",
        fgm: 5,
        fga: 10,
        tpm: 2,
        tpa: 4,
        ftm: 3,
        fta: 4,
      }),
      makeGame({
        game_date: "2026-03-10",
        fgm: 7,
        fga: 12,
        tpm: 1,
        tpa: 3,
        ftm: 4,
        fta: 5,
      }),
    ];

    const result = aggregateMonthlyStats(games);
    expect(result).toHaveLength(1);

    const month = result[0];
    // FG% = (5+7)/(10+12) = 12/22 ≈ 54.5%
    expect(month.fgp).toBeCloseTo(54.5, 0);
    // 3P% = (2+1)/(4+3) = 3/7 ≈ 42.9%
    expect(month.tpp).toBeCloseTo(42.9, 0);
    // FT% = (3+4)/(4+5) = 7/9 ≈ 77.8%
    expect(month.ftp).toBeCloseTo(77.8, 0);
  });

  it("returns null percentages when no attempts", () => {
    const games = [
      makeGame({
        game_date: "2026-04-01",
        fga: 0,
        tpa: 0,
        fta: 0,
      }),
    ];

    const result = aggregateMonthlyStats(games);
    expect(result[0].fgp).toBeNull();
    expect(result[0].tpp).toBeNull();
    expect(result[0].ftp).toBeNull();
  });

  it("computes EFF correctly", () => {
    const games = [
      makeGame({
        game_date: "2026-05-01",
        pts: 25,
        oreb: 3,
        dreb: 6,
        ast: 8,
        stl: 2,
        blk: 1,
        tov: 3,
      }),
      makeGame({
        game_date: "2026-05-15",
        pts: 15,
        oreb: 0,
        dreb: 4,
        ast: 2,
        stl: 1,
        blk: 0,
        tov: 5,
      }),
    ];

    const result = aggregateMonthlyStats(games);
    // Game 1 EFF: 25 + 9 + 1.5*8 + 2*2 + 2*1 - 3 = 25+9+12+4+2-3 = 49
    // Game 2 EFF: 15 + 4 + 1.5*2 + 2*1 + 0 - 5 = 15+4+3+2-5 = 19
    // Avg EFF = (49+19)/2 = 34
    expect(result[0].avgEff).toBe(34);
  });

  it("sorts months chronologically", () => {
    const games = [
      makeGame({ game_date: "2026-03-01" }),
      makeGame({ game_date: "2026-01-01" }),
      makeGame({ game_date: "2026-02-01" }),
    ];

    const result = aggregateMonthlyStats(games);
    expect(result[0].month).toBe("2026-01");
    expect(result[1].month).toBe("2026-02");
    expect(result[2].month).toBe("2026-03");
  });

  it("sets proper month labels in Mongolian", () => {
    const games = [makeGame({ game_date: "2026-07-01" })];

    const result = aggregateMonthlyStats(games);
    expect(result[0].monthLabel).toBe("2026 оны 7-р сар");
  });
});
