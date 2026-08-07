import { describe, expect, it } from "vitest";
import {
  type BoxScoreLine,
  calculateAdvancedStats,
  calculateASTTORatio,
  calculateEFG,
  calculateFTRate,
  calculateGameScore,
  calculatePer36,
  calculatePPM,
  calculateTOVPct,
  calculateTPARate,
  calculateTS,
  calculateUSGPct,
} from "../advanced";

function line(overrides: Partial<BoxScoreLine> = {}): BoxScoreLine {
  return {
    player_id: "p1",
    team_season_id: "ts1",
    gp: 1,
    minutes: 30,
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
    ...overrides,
  };
}

describe("calculateEFG", () => {
  it("computes effective field goal percentage", () => {
    // (8 + 0.5 * 2) / 15 = 9/15
    expect(calculateEFG(line())).toBeCloseTo(0.6, 5);
  });

  it("returns 0 when no field goals attempted", () => {
    expect(calculateEFG(line({ fga: 0, fgm: 0, tpm: 0 }))).toBe(0);
  });

  it("accounts for three-point bonus", () => {
    // 4/10 with 2 threes = (4 + 1) / 10 = 0.5
    const l = line({ fgm: 4, fga: 10, tpm: 2 });
    expect(calculateEFG(l)).toBeCloseTo(0.5, 5);

    // Same FG% but all threes: 4/10 with 4 threes = (4 + 2) / 10 = 0.6
    const l2 = line({ fgm: 4, fga: 10, tpm: 4 });
    expect(calculateEFG(l2)).toBeCloseTo(0.6, 5);
  });
});

describe("calculateTS", () => {
  it("computes true shooting percentage", () => {
    // 20 / (2 * (15 + 0.44 * 3)) = 20 / 32.64
    expect(calculateTS(line())).toBeCloseTo(20 / 32.64, 5);
  });

  it("returns 0 when no shots attempted", () => {
    expect(calculateTS(line({ fga: 0, fta: 0, pts: 0 }))).toBe(0);
  });

  it("handles perfect shooting night", () => {
    // 30 pts on 12/12 FG, 6/6 FT = 30 / (2 * (12 + 0.44 * 6)) = 30 / 29.28
    const perfect = line({ pts: 30, fgm: 12, fga: 12, ftm: 6, fta: 6 });
    expect(calculateTS(perfect)).toBeCloseTo(30 / 29.28, 5);
  });
});

describe("calculateFTRate", () => {
  it("computes free throw attempt rate", () => {
    expect(calculateFTRate(line())).toBeCloseTo(3 / 15, 5);
  });

  it("returns 0 when no field goals attempted", () => {
    expect(calculateFTRate(line({ fga: 0 }))).toBe(0);
  });
});

describe("calculateTPARate", () => {
  it("computes three-point attempt rate", () => {
    expect(calculateTPARate(line())).toBeCloseTo(5 / 15, 5);
  });

  it("returns 0 when no field goals attempted", () => {
    expect(calculateTPARate(line({ fga: 0 }))).toBe(0);
  });
});

describe("calculateASTTORatio", () => {
  it("computes assist-to-turnover ratio", () => {
    expect(calculateASTTORatio(line())).toBeCloseTo(4 / 3, 5);
  });

  it("returns assists when no turnovers", () => {
    expect(calculateASTTORatio(line({ tov: 0, ast: 7 }))).toBe(7);
  });

  it("returns 0 when no assists and no turnovers", () => {
    expect(calculateASTTORatio(line({ ast: 0, tov: 0 }))).toBe(0);
  });
});

describe("calculateGameScore", () => {
  it("computes Hollinger Game Score", () => {
    // 20 + 0.4*8 - 0.7*15 - 0.4*(3-2) + 0.7*2 + 0.3*5 + 1 + 0.7*4 + 0.7*1 - 0.4*2 - 3
    const expected =
      20 +
      0.4 * 8 -
      0.7 * 15 -
      0.4 * (3 - 2) +
      0.7 * 2 +
      0.3 * 5 +
      1 +
      0.7 * 4 +
      0.7 * 1 -
      0.4 * 2 -
      3;
    expect(calculateGameScore(line())).toBeCloseTo(expected, 5);
  });

  it("handles a perfect game", () => {
    // 40 pts on 15/15 FG, 10/10 FT, 5 reb, 5 ast, 3 stl, 2 blk, 0 tov, 1 pf
    const perfect = line({
      pts: 40,
      fgm: 15,
      fga: 15,
      tpm: 0,
      ftm: 10,
      fta: 10,
      oreb: 1,
      dreb: 4,
      ast: 5,
      stl: 3,
      blk: 2,
      tov: 0,
      pf: 1,
    });
    const gs = calculateGameScore(perfect);
    expect(gs).toBeGreaterThan(30); // Elite performance
  });

  it("can be negative for terrible games", () => {
    // 0 pts, 0/8 FG, 5 TOV, 4 PF
    const terrible = line({
      pts: 0,
      fgm: 0,
      fga: 8,
      tpm: 0,
      ftm: 0,
      fta: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      tov: 5,
      pf: 4,
      oreb: 0,
      dreb: 0,
    });
    expect(calculateGameScore(terrible)).toBeLessThan(0);
  });

  it("returns 0 for a zeroed line", () => {
    const zero = line({
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
    expect(calculateGameScore(zero)).toBe(0);
  });
});

describe("calculateTOVPct", () => {
  it("computes turnover percentage", () => {
    const tovPoss = 15 + 0.44 * 3 + 3;
    expect(calculateTOVPct(line())).toBeCloseTo(3 / tovPoss, 5);
  });

  it("returns 0 when no possessions used", () => {
    expect(calculateTOVPct(line({ fga: 0, fta: 0, tov: 0 }))).toBe(0);
  });
});

describe("calculateUSGPct", () => {
  it("computes usage rate (simplified)", () => {
    const possessions = 15 + 0.44 * 3 + 3;
    expect(calculateUSGPct(line())).toBeCloseTo(possessions / 30, 5);
  });

  it("returns 0 when no minutes played", () => {
    expect(calculateUSGPct(line({ minutes: 0 }))).toBe(0);
  });
});

describe("calculatePPM", () => {
  it("computes points per minute", () => {
    expect(calculatePPM(line())).toBeCloseTo(20 / 30, 5);
  });

  it("returns 0 when no minutes played", () => {
    expect(calculatePPM(line({ minutes: 0 }))).toBe(0);
  });
});

describe("calculatePer36", () => {
  it("scales per-minute stats to 36 minutes", () => {
    expect(calculatePer36(line(), "pts")).toBeCloseTo((20 / 30) * 36, 5);
    expect(calculatePer36(line(), "ast")).toBeCloseTo((4 / 30) * 36, 5);
    expect(calculatePer36(line(), "stl")).toBeCloseTo((1 / 30) * 36, 5);
  });

  it("returns 0 when no minutes played", () => {
    expect(calculatePer36(line({ minutes: 0 }), "pts")).toBe(0);
  });
});

describe("calculateAdvancedStats", () => {
  it("returns all computed stat fields", () => {
    const l = line();
    const stats = calculateAdvancedStats(l);

    expect(stats).toHaveProperty("efg");
    expect(stats).toHaveProperty("ts");
    expect(stats).toHaveProperty("ftRate");
    expect(stats).toHaveProperty("tpRate");
    expect(stats).toHaveProperty("astTo");
    expect(stats).toHaveProperty("tovPct");
    expect(stats).toHaveProperty("usgPct");
    expect(stats).toHaveProperty("ppm");
    expect(stats).toHaveProperty("gameScore");
    expect(stats).toHaveProperty("per36");
    expect(stats.per36).toHaveProperty("pts");
    expect(stats.per36).toHaveProperty("reb");
    expect(stats.per36).toHaveProperty("ast");
    expect(stats.per36).toHaveProperty("stl");
    expect(stats.per36).toHaveProperty("blk");
  });

  it("produces consistent results with individual functions", () => {
    const l = line();
    const stats = calculateAdvancedStats(l);

    expect(stats.efg).toBe(calculateEFG(l));
    expect(stats.ts).toBe(calculateTS(l));
    expect(stats.astTo).toBe(calculateASTTORatio(l));
    expect(stats.gameScore).toBe(calculateGameScore(l));
  });

  it("handles a zeroed line without crashing", () => {
    const zero = line({
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
      minutes: 0,
    });
    const stats = calculateAdvancedStats(zero);
    expect(stats.efg).toBe(0);
    expect(stats.ts).toBe(0);
    expect(stats.gameScore).toBe(0);
    expect(stats.astTo).toBe(0);
    expect(stats.tovPct).toBe(0);
    expect(stats.usgPct).toBe(0);
    expect(stats.ppm).toBe(0);
    expect(stats.per36.pts).toBe(0);
  });
});
