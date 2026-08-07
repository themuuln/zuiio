import { describe, expect, it } from "vitest";
import { detectMilestones, type GameLine } from "../milestones";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGame(
  overrides: Partial<GameLine> & { game_id: string; game_date: string },
): GameLine {
  return {
    pts: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Empty
// ---------------------------------------------------------------------------

describe("detectMilestones — empty input", () => {
  it("returns empty array for no games", () => {
    expect(detectMilestones([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Single game
// ---------------------------------------------------------------------------

describe("detectMilestones — single game", () => {
  it("detects career highs for that game", () => {
    const game = makeGame({
      game_id: "g1",
      game_date: "2024-01-15",
      pts: 25,
      reb: 8,
      ast: 5,
      stl: 3,
      blk: 2,
    });

    const result = detectMilestones([game]);

    const careerHighs = result.filter((m) => m.type.startsWith("career_high"));
    expect(careerHighs).toHaveLength(5);

    expect(result).toContainEqual({
      type: "career_high_pts",
      stat: "pts",
      value: 25,
      game_date: "2024-01-15",
    });
    expect(result).toContainEqual({
      type: "career_high_reb",
      stat: "reb",
      value: 8,
      game_date: "2024-01-15",
    });
    expect(result).toContainEqual({
      type: "career_high_ast",
      stat: "ast",
      value: 5,
      game_date: "2024-01-15",
    });
    expect(result).toContainEqual({
      type: "career_high_stl",
      stat: "stl",
      value: 3,
      game_date: "2024-01-15",
    });
    expect(result).toContainEqual({
      type: "career_high_blk",
      stat: "blk",
      value: 2,
      game_date: "2024-01-15",
    });
  });

  it("detects 20+ point game from single game", () => {
    const game = makeGame({
      game_id: "g1",
      game_date: "2024-01-15",
      pts: 30,
    });
    const result = detectMilestones([game]);
    expect(result).toContainEqual({
      type: "twenty_plus",
      value: 0,
      count: 1,
    });
  });

  it("detects double-double from single game", () => {
    const game = makeGame({
      game_id: "g1",
      game_date: "2024-01-15",
      pts: 15,
      reb: 12,
      ast: 3,
    });
    const result = detectMilestones([game]);
    expect(result).toContainEqual({
      type: "double_double",
      value: 0,
      count: 1,
    });
  });
});

// ---------------------------------------------------------------------------
// Multi-game: career highs
// ---------------------------------------------------------------------------

describe("detectMilestones — career highs across games", () => {
  it("picks the highest stat and its date", () => {
    const games = [
      makeGame({ game_id: "g1", game_date: "2024-01-15", pts: 20, reb: 10 }),
      makeGame({ game_id: "g2", game_date: "2024-02-10", pts: 15, reb: 12 }),
      makeGame({ game_id: "g3", game_date: "2024-03-05", pts: 32, reb: 9 }),
    ];

    const result = detectMilestones(games);

    expect(result).toContainEqual({
      type: "career_high_pts",
      stat: "pts",
      value: 32,
      game_date: "2024-03-05",
    });
    expect(result).toContainEqual({
      type: "career_high_reb",
      stat: "reb",
      value: 12,
      game_date: "2024-02-10",
    });
  });

  it("handles unsorted input (sorts by date internally)", () => {
    const games = [
      makeGame({ game_id: "g3", game_date: "2024-03-05", pts: 32 }),
      makeGame({ game_id: "g1", game_date: "2024-01-15", pts: 20 }),
      makeGame({ game_id: "g2", game_date: "2024-02-10", pts: 25 }),
    ];

    const result = detectMilestones(games);

    expect(result).toContainEqual({
      type: "career_high_pts",
      stat: "pts",
      value: 32,
      game_date: "2024-03-05",
    });
  });
});

// ---------------------------------------------------------------------------
// Double-double
// ---------------------------------------------------------------------------

describe("detectMilestones — double-double detection", () => {
  it("counts games with any 2 stats >= 10", () => {
    const games = [
      makeGame({
        game_id: "g1",
        game_date: "2024-01-15",
        pts: 15,
        reb: 12,
        ast: 3,
      }),
      makeGame({
        game_id: "g2",
        game_date: "2024-02-10",
        pts: 8,
        reb: 5,
        ast: 11,
        stl: 10,
      }), // stl + ast
      makeGame({
        game_id: "g3",
        game_date: "2024-03-05",
        pts: 5,
        reb: 3,
        ast: 4,
      }), // none
    ];

    const result = detectMilestones(games);
    const dd = result.find((m) => m.type === "double_double");
    expect(dd).toBeDefined();
    expect(dd?.count).toBe(2);
  });

  it("does not produce double_double when no game qualifies", () => {
    const games = [
      makeGame({
        game_id: "g1",
        game_date: "2024-01-15",
        pts: 8,
        reb: 5,
        ast: 4,
      }),
    ];
    const result = detectMilestones(games);
    expect(result.find((m) => m.type === "double_double")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Triple-double
// ---------------------------------------------------------------------------

describe("detectMilestones — triple-double detection", () => {
  it("counts games with any 3 stats >= 10", () => {
    const games = [
      makeGame({
        game_id: "g1",
        game_date: "2024-01-15",
        pts: 15,
        reb: 12,
        ast: 11,
        stl: 3,
      }),
      makeGame({
        game_id: "g2",
        game_date: "2024-02-10",
        pts: 10,
        reb: 10,
        ast: 10,
        stl: 10,
      }), // quad double
      makeGame({
        game_id: "g3",
        game_date: "2024-03-05",
        pts: 12,
        reb: 8,
        ast: 6,
      }),
    ];

    const result = detectMilestones(games);
    const td = result.find((m) => m.type === "triple_double");
    expect(td).toBeDefined();
    expect(td?.count).toBe(2); // g1 and g2 both qualify
  });
});

// ---------------------------------------------------------------------------
// 20+ point games
// ---------------------------------------------------------------------------

describe("detectMilestones — twenty-plus counting", () => {
  it("counts games with pts >= 20", () => {
    const games = [
      makeGame({ game_id: "g1", game_date: "2024-01-15", pts: 25 }),
      makeGame({ game_id: "g2", game_date: "2024-02-10", pts: 18 }),
      makeGame({ game_id: "g3", game_date: "2024-03-05", pts: 32 }),
      makeGame({ game_id: "g4", game_date: "2024-04-01", pts: 20 }),
    ];

    const result = detectMilestones(games);
    const tp = result.find((m) => m.type === "twenty_plus");
    expect(tp).toBeDefined();
    expect(tp?.count).toBe(3); // g1, g3, g4
  });
});

// ---------------------------------------------------------------------------
// Double-digit scoring streak
// ---------------------------------------------------------------------------

describe("detectMilestones — double-digit scoring streak", () => {
  it("counts consecutive double-digit games from the end", () => {
    const games = [
      makeGame({ game_id: "g1", game_date: "2024-01-15", pts: 25 }),
      makeGame({ game_id: "g2", game_date: "2024-02-10", pts: 8 }), // break
      makeGame({ game_id: "g3", game_date: "2024-03-05", pts: 15 }),
      makeGame({ game_id: "g4", game_date: "2024-04-01", pts: 22 }),
      makeGame({ game_id: "g5", game_date: "2024-04-15", pts: 11 }),
    ];

    const result = detectMilestones(games);
    const streak = result.find((m) => m.type === "double_digit_streak");
    expect(streak).toBeDefined();
    expect(streak?.streak).toBe(3); // g3, g4, g5
  });

  it("reports full streak when all games are double-digit", () => {
    const games = [
      makeGame({ game_id: "g1", game_date: "2024-01-15", pts: 12 }),
      makeGame({ game_id: "g2", game_date: "2024-02-10", pts: 15 }),
      makeGame({ game_id: "g3", game_date: "2024-03-05", pts: 18 }),
    ];

    const result = detectMilestones(games);
    const streak = result.find((m) => m.type === "double_digit_streak");
    expect(streak).toBeDefined();
    expect(streak?.streak).toBe(3);
  });

  it("reports streak of 1 when last game is double-digit but previous is not", () => {
    const games = [
      makeGame({ game_id: "g1", game_date: "2024-01-15", pts: 8 }),
      makeGame({ game_id: "g2", game_date: "2024-02-10", pts: 12 }),
    ];

    const result = detectMilestones(games);
    const streak = result.find((m) => m.type === "double_digit_streak");
    expect(streak).toBeDefined();
    expect(streak?.streak).toBe(1);
  });

  it("does not produce streak milestone when last game is single-digit", () => {
    const games = [
      makeGame({ game_id: "g1", game_date: "2024-01-15", pts: 15 }),
      makeGame({ game_id: "g2", game_date: "2024-02-10", pts: 8 }),
    ];

    const result = detectMilestones(games);
    expect(
      result.find((m) => m.type === "double_digit_streak"),
    ).toBeUndefined();
  });
});
