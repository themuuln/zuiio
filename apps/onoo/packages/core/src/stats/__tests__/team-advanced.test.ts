import { describe, expect, it } from "vitest";
import type { GameTeamStats } from "../../types";
import {
  calculateDRtg,
  calculateFourFactors,
  calculateFTARate,
  calculateNetRTG,
  calculateOREBPct,
  calculateORtg,
  calculatePace,
  calculatePIE,
  calculatePossessions,
  calculateTeamAdvancedStats,
  calculateTeamEFG,
  calculateTOVPct,
} from "../team-advanced";

/** Minimal team stats fixture — a team that shot 50% from the field. */
function team(overrides: Partial<GameTeamStats> = {}): GameTeamStats {
  return {
    game_id: "g1",
    team_season_id: "ts1",
    revision_id: "r1",
    pts: 100,
    fgm: 38,
    fga: 80,
    tpm: 10,
    tpa: 28,
    ftm: 14,
    fta: 18,
    oreb: 12,
    dreb: 30,
    team_reb: 4,
    ast: 22,
    stl: 8,
    blk: 4,
    tov: 14,
    pf: 18,
    ...overrides,
  };
}

function opponent(overrides: Partial<GameTeamStats> = {}): GameTeamStats {
  return {
    game_id: "g1",
    team_season_id: "ts2",
    revision_id: "r1",
    pts: 90,
    fgm: 34,
    fga: 78,
    tpm: 8,
    tpa: 25,
    ftm: 14,
    fta: 20,
    oreb: 10,
    dreb: 28,
    team_reb: 3,
    ast: 18,
    stl: 6,
    blk: 3,
    tov: 16,
    pf: 20,
    ...overrides,
  };
}

describe("calculatePossessions", () => {
  it("computes standard possessions formula", () => {
    // 0.5 × (80 + 0.475 × 18 − 12 + 14) = 0.5 × (80 + 8.55 − 12 + 14)
    // = 0.5 × 90.55 = 45.275
    const result = calculatePossessions(team());
    expect(result).toBeCloseTo(45.275, 2);
  });

  it("handles zero attempts gracefully", () => {
    expect(
      calculatePossessions(team({ fga: 0, fta: 0, oreb: 0, tov: 0 })),
    ).toBe(0);
  });
});

describe("calculateORtg", () => {
  it("computes points per 100 possessions", () => {
    // 100 / 45.275 × 100 ≈ 220.87
    const result = calculateORtg(team({ pts: 100 }), 45.275);
    expect(result).toBeCloseTo(220.87, 1);
  });

  it("returns 0 for zero possessions", () => {
    expect(calculateORtg(team(), 0)).toBe(0);
  });
});

describe("calculateDRtg", () => {
  it("computes opponent points per 100 possessions", () => {
    const opp = opponent({ pts: 90 });
    const oppPoss = calculatePossessions(opp);
    // 90 / oppPoss × 100
    const result = calculateDRtg(opp, oppPoss);
    const expected = (90 / calculatePossessions(opp)) * 100;
    expect(result).toBeCloseTo(expected, 1);
  });
});

describe("calculateNetRTG", () => {
  it("subtracts DRtg from ORtg", () => {
    expect(calculateNetRTG(110, 100)).toBe(10);
    expect(calculateNetRTG(95, 105)).toBe(-10);
  });
});

describe("calculatePace", () => {
  it("computes possessions per 48 minutes", () => {
    // 48 × ((45.275 + oppPoss) / 2) / 48 = (45.275 + oppPoss) / 2
    const teamPoss = calculatePossessions(team());
    const oppPoss = calculatePossessions(opponent());
    const result = calculatePace(teamPoss, oppPoss, 48);
    expect(result).toBeCloseTo((teamPoss + oppPoss) / 2, 1);
  });

  it("handles zero minutes gracefully", () => {
    expect(calculatePace(45, 40, 0)).toBe(0);
  });
});

describe("calculateTeamEFG", () => {
  it("computes effective field goal percentage", () => {
    // (38 + 0.5 × 10) / 80 = 43 / 80 = 0.5375
    const result = calculateTeamEFG(team());
    expect(result).toBeCloseTo(0.5375, 4);
  });

  it("returns 0 for zero FGA", () => {
    expect(calculateTeamEFG(team({ fga: 0 }))).toBe(0);
  });
});

describe("calculateTOVPct", () => {
  it("computes turnovers per 100 possessions", () => {
    const result = calculateTOVPct(team());
    // 14 / 45.275 × 100 ≈ 30.92
    expect(result).toBeCloseTo(30.92, 1);
  });
});

describe("calculateOREBPct", () => {
  it("computes offensive rebound percentage", () => {
    const result = calculateOREBPct(team(), opponent());
    // 12 / (12 + 28) = 12 / 40 = 0.3
    expect(result).toBeCloseTo(0.3, 4);
  });

  it("returns 0 when no total rebounds", () => {
    expect(calculateOREBPct(team({ oreb: 0 }), opponent({ dreb: 0 }))).toBe(0);
  });
});

describe("calculateFTARate", () => {
  it("computes free throw attempt rate", () => {
    const result = calculateFTARate(team({ fta: 18, fga: 80 }));
    // 18 / 80 = 0.225
    expect(result).toBeCloseTo(0.225, 4);
  });

  it("returns 0 for zero FGA", () => {
    expect(calculateFTARate(team({ fga: 0 }))).toBe(0);
  });
});

describe("calculateFourFactors", () => {
  it("returns all four factors as tuple", () => {
    const t = team();
    const o = opponent();
    const [efg, tovPct, orebPct, ftaRate] = calculateFourFactors(t, o);

    expect(efg).toBe(calculateTeamEFG(t));
    expect(tovPct).toBe(calculateTOVPct(t));
    expect(orebPct).toBe(calculateOREBPct(t, o));
    expect(ftaRate).toBe(calculateFTARate(t));
  });
});

describe("calculatePIE", () => {
  it("computes Player Impact Estimate at team level", () => {
    const result = calculatePIE(team(), opponent());
    // PIE should be a fraction between 0-1 for a winning team
    expect(result).toBeGreaterThan(0.5);
    expect(result).toBeLessThan(0.7);
  });

  it("returns 0.5 for identical teams", () => {
    const t = team();
    expect(calculatePIE(t, t)).toBeCloseTo(0.5, 4);
  });

  it("returns 0 when both sums are 0", () => {
    const t = team({
      pts: 0,
      fgm: 0,
      fga: 0,
      ftm: 0,
      fta: 0,
      oreb: 0,
      dreb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      pf: 0,
      tov: 0,
    });
    const o = team({ ...t, team_season_id: "ts2" });
    expect(calculatePIE(t, o)).toBe(0);
  });
});

describe("calculateTeamAdvancedStats", () => {
  it("returns all advanced stats in one object", () => {
    const t = team();
    const o = opponent();
    const result = calculateTeamAdvancedStats(t, o);

    expect(result.possessions).toBeGreaterThan(0);
    expect(result.ortg).toBeGreaterThan(0);
    expect(result.drtg).toBeGreaterThan(0);
    expect(result.netRtg).toBe(result.ortg - result.drtg);
    expect(result.pace).toBeGreaterThan(0);
    expect(result.efg).toBeGreaterThan(0);
    expect(result.tovPct).toBeGreaterThan(0);
    expect(result.orebPct).toBeGreaterThan(0);
    expect(result.ftaRate).toBeGreaterThan(0);
    expect(result.pie).toBeGreaterThan(0);
    expect(result.fourFactors).toHaveLength(4);
  });

  it("handles zero-stat teams gracefully", () => {
    const empty = team({
      pts: 0,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      oreb: 0,
      dreb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      tov: 0,
      pf: 0,
    });
    const result = calculateTeamAdvancedStats(empty, empty);
    // All numeric
    expect(typeof result.possessions).toBe("number");
    expect(typeof result.ortg).toBe("number");
    expect(typeof result.netRtg).toBe("number");
    expect(typeof result.pie).toBe("number");
    expect(result.pace).toBe(0); // possessions are 0, so pace is 0
  });
});
