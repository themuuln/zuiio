import { describe, expect, it } from "vitest";
import type { GameWithTeams } from "../shared";
import { getDateRange, orderScorebarGames, shiftDate } from "../shared";

describe("shiftDate", () => {
  it("shifts forward across a month boundary", () => {
    expect(shiftDate("2026-07-31", 1)).toBe("2026-08-01");
  });

  it("shifts backward across a year boundary", () => {
    expect(shiftDate("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("returns the same date for a zero offset", () => {
    expect(shiftDate("2026-07-22", 0)).toBe("2026-07-22");
  });
});

describe("getDateRange", () => {
  it("returns 8 days: 2 past + today + 5 future by default", () => {
    const range = getDateRange("2026-07-22");
    expect(range).toEqual([
      "2026-07-20",
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
      "2026-07-25",
      "2026-07-26",
      "2026-07-27",
    ]);
  });

  it("places today at the expected index", () => {
    const range = getDateRange("2026-07-22");
    expect(range[2]).toBe("2026-07-22");
  });

  it("honors custom past/future bounds", () => {
    expect(getDateRange("2026-07-22", { past: 1, future: 1 })).toEqual([
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
    ]);
  });
});

function makeGame(
  id: string,
  status: string,
  scheduledAt: string,
): GameWithTeams {
  return { id, status, scheduled_at: scheduledAt } as unknown as GameWithTeams;
}

describe("orderScorebarGames", () => {
  it("orders live first, then upcoming, then finals", () => {
    const games = [
      makeGame("final", "league_verified", "2026-07-22T10:00:00Z"),
      makeGame("scheduled", "scheduled", "2026-07-22T20:00:00Z"),
      makeGame("live", "live_provisional", "2026-07-22T18:00:00Z"),
    ];
    expect(orderScorebarGames(games).map((g) => g.id)).toEqual([
      "live",
      "scheduled",
      "final",
    ]);
  });

  it("breaks ties within a status by scheduled time", () => {
    const games = [
      makeGame("late", "scheduled", "2026-07-22T21:00:00Z"),
      makeGame("early", "scheduled", "2026-07-22T18:00:00Z"),
    ];
    expect(orderScorebarGames(games).map((g) => g.id)).toEqual([
      "early",
      "late",
    ]);
  });

  it("does not mutate the input array", () => {
    const games = [
      makeGame("a", "league_verified", "2026-07-22T10:00:00Z"),
      makeGame("b", "live_provisional", "2026-07-22T18:00:00Z"),
    ];
    const original = games.map((g) => g.id);
    orderScorebarGames(games);
    expect(games.map((g) => g.id)).toEqual(original);
  });
});
