import { describe, it, expect } from "vitest";
import { describePlayerGame, type GameSummaryInput } from "../summaries";

const base: GameSummaryInput = {
  pts: 15,
  reb: 6,
  ast: 4,
  stl: 2,
  blk: 1,
  fgm: 6,
  fga: 12,
  tpm: 1,
  ftm: 2,
};

function overrides(overrides: Partial<GameSummaryInput>): GameSummaryInput {
  return { ...base, ...overrides };
}

describe("describePlayerGame", () => {
  describe("career high (priority 1)", () => {
    it("returns career high even when stats qualify for other rules", () => {
      const line = overrides({
        pts: 35,
        reb: 12,
        ast: 11,
        isCareerHigh: true,
      });
      const result = describePlayerGame(line);
      expect(result.mn).toBe("Карьерийн дээд амжилт: 35 оноо");
      expect(result.en).toBe("Career high: 35 pts");
    });
  });

  describe("season high (priority 2)", () => {
    it("returns season high", () => {
      const line = overrides({ pts: 25, isSeasonHigh: true });
      const result = describePlayerGame(line);
      expect(result.mn).toBe("Улирлын дээд амжилт: 25 оноо");
      expect(result.en).toBe("Season high: 25 pts");
    });

    it("career high beats season high", () => {
      const line = overrides({
        pts: 25,
        isCareerHigh: true,
        isSeasonHigh: true,
      });
      expect(describePlayerGame(line).mn).toContain("Карьерийн");
    });
  });

  describe("triple-double (priority 3)", () => {
    it("detects triple-double with pts/reb/ast", () => {
      const line = overrides({ pts: 22, reb: 14, ast: 11 });
      const result = describePlayerGame(line);
      expect(result.mn).toMatch(/^Гурван-давхар: \d+\/\d+\/\d+$/);
      expect(result.mn).toContain("22/14/11");
    });

    it("detects triple-double with stl or blk instead of ast", () => {
      const line = overrides({ pts: 18, reb: 12, stl: 10, ast: 3 });
      const result = describePlayerGame(line);
      expect(result.mn).toMatch(/^Гурван-давхар/);
    });

    it("detects quad-double (4 stats ≥ 10)", () => {
      const line = overrides({
        pts: 25,
        reb: 11,
        ast: 10,
        stl: 10,
        blk: 1,
      });
      const result = describePlayerGame(line);
      expect(result.mn).toMatch(/^Гурван-плюс/);
      expect(result.en).toMatch(/^Triple-plus-double/);
    });

    it("triple-double beats 20+ pts rule", () => {
      const line = overrides({ pts: 25, reb: 11, ast: 10 });
      expect(describePlayerGame(line).mn).toContain("Гурван-давхар");
      expect(describePlayerGame(line).mn).not.toContain("тоглолт");
    });
  });

  describe("double-double (priority 4)", () => {
    it("detects double-double with pts/reb", () => {
      const line = overrides({ pts: 18, reb: 12 });
      const result = describePlayerGame(line);
      expect(result.mn).toBe("Давхар-самбар: 18/12");
      expect(result.en).toBe("Double-reb: 18/12");
    });

    it("detects double-double with pts/ast", () => {
      const line = overrides({ pts: 14, reb: 5, ast: 11 });
      const result = describePlayerGame(line);
      expect(result.mn).toBe("Давхар-дамжуулалт: 14/11");
    });

    it("double-double beats 20+ pts rule", () => {
      const line = overrides({ pts: 22, reb: 11 });
      expect(describePlayerGame(line).mn).toContain("Давхар");
      expect(describePlayerGame(line).mn).not.toContain("тоглолт");
    });
  });

  describe("20+ points (priority 5)", () => {
    it("returns 20+ point game", () => {
      const line = overrides({ pts: 28 });
      const result = describePlayerGame(line);
      expect(result.mn).toBe("28 оноо тоглолт");
      expect(result.en).toBe("28-point game");
    });

    it("includes shooting suffix when fga ≥ 10 and fg% ≥ 60%", () => {
      const line = overrides({ pts: 25, fgm: 10, fga: 15 });
      const result = describePlayerGame(line);
      expect(result.mn).toBe("25 оноо тоглолт 60% пүршилттэй");
    });

    it("no shooting suffix when fga < 10", () => {
      const line = overrides({ pts: 25, fgm: 7, fga: 9 });
      const result = describePlayerGame(line);
      expect(result.mn).toBe("25 оноо тоглолт");
    });

    it("no shooting suffix when fg% < 60%", () => {
      const line = overrides({ pts: 25, fgm: 7, fga: 14 });
      const result = describePlayerGame(line);
      expect(result.mn).toBe("25 оноо тоглолт");
    });

    it("exact 60% triggers suffix", () => {
      const line = overrides({ pts: 22, fgm: 6, fga: 10 });
      const result = describePlayerGame(line);
      expect(result.mn).toContain("60% пүршилттэй");
    });
  });

  describe("default case (priority 6)", () => {
    it("returns pts/reb/ast line", () => {
      const line = overrides({ pts: 12, reb: 8, ast: 5 });
      const result = describePlayerGame(line);
      expect(result.mn).toBe("12 оноо, 8 самбар, 5 дамжуулалт");
      expect(result.en).toBe("12 pts, 8 reb, 5 ast");
    });

    it("includes shooting suffix when eligible", () => {
      const line = overrides({ pts: 12, reb: 8, ast: 5, fgm: 6, fga: 10 });
      const result = describePlayerGame(line);
      expect(result.mn).toBe(
        "12 оноо, 8 самбар, 5 дамжуулалт 60% пүршилттэй"
      );
    });
  });

  describe("empty / zero inputs", () => {
    it("handles all zeros", () => {
      const line: GameSummaryInput = {
        pts: 0,
        reb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        fgm: 0,
        fga: 0,
        tpm: 0,
        ftm: 0,
      };
      const result = describePlayerGame(line);
      expect(result.mn).toBe("0 оноо, 0 самбар, 0 дамжуулалт");
      expect(result.en).toBe("0 pts, 0 reb, 0 ast");
    });

    it("no shooting suffix at zero fga", () => {
      const line: GameSummaryInput = {
        pts: 10,
        reb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        fgm: 0,
        fga: 0,
        tpm: 0,
        ftm: 0,
      };
      expect(describePlayerGame(line).mn).not.toContain("пүршилт");
    });
  });
});
