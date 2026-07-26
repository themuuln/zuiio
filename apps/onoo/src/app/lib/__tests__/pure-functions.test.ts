import { describe, expect, it } from "vitest";
import { convertPlayByPlayToStatEvents } from "@/app/lib/data";
import type { PlayByPlayRow } from "@/app/lib/shared";
import {
  formatDate,
  formatGameTime,
  formatMinutes,
  getDateRange,
  orderScorebarGames,
  shiftDate,
  statusLabel,
  statusVariant,
} from "@/app/lib/shared";

// =========================================================================
// shared.ts pure functions
// =========================================================================

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
    expect(range).toHaveLength(8);
    expect(range[0]).toBe("2026-07-20");
    expect(range[range.length - 1]).toBe("2026-07-27");
  });

  it("respects custom past/future parameters", () => {
    const range = getDateRange("2026-07-22", { past: 1, future: 2 });
    expect(range).toHaveLength(4);
    expect(range[0]).toBe("2026-07-21");
    expect(range[3]).toBe("2026-07-24");
  });
});

describe("orderScorebarGames", () => {
  it("puts live_provisional before scheduled", () => {
    const games = [
      { status: "scheduled", scheduled_at: "2026-07-22T12:00:00Z" },
      { status: "live_provisional", scheduled_at: "2026-07-22T12:00:00Z" },
    ] as any[];
    const sorted = orderScorebarGames(games);
    expect(sorted[0].status).toBe("live_provisional");
  });

  it("puts cancelled last", () => {
    const games = [
      { status: "cancelled", scheduled_at: "2026-07-22T12:00:00Z" },
      { status: "scheduled", scheduled_at: "2026-07-22T12:00:00Z" },
    ] as any[];
    const sorted = orderScorebarGames(games);
    expect(sorted[1].status).toBe("cancelled");
  });

  it("does not mutate the input array", () => {
    const games = [
      { status: "scheduled", scheduled_at: "2026-07-22T12:00:00Z" },
      { status: "live_provisional", scheduled_at: "2026-07-22T12:00:00Z" },
    ] as any[];
    orderScorebarGames(games);
    expect(games[0].status).toBe("scheduled");
  });
});

describe("formatGameTime", () => {
  it("formats an ISO string to HH:MM in UB timezone", () => {
    // 12:00 UTC = 20:00 UB (UTC+8)
    const result = formatGameTime("2026-07-22T12:00:00Z");
    expect(result).toMatch(/^\d{2}:\d{2}$/);
    expect(result).toBe("20:00");
  });

  it("formats midnight UTC as 08:00 UB", () => {
    expect(formatGameTime("2026-07-22T00:00:00Z")).toBe("08:00");
  });
});

describe("formatDate", () => {
  it("formats a YYYY-MM-DD string to Mongolian date", () => {
    const result = formatDate("2026-07-22");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    // Should contain Mongolian month name for July
    expect(result).toContain("долоодугаар сар");
  });
});

describe("formatMinutes", () => {
  it("formats 1200 as 20:00", () => {
    expect(formatMinutes(1200)).toBe("20:00");
  });

  it("formats 0 as 0:00", () => {
    expect(formatMinutes(0)).toBe("0:00");
  });

  it("formats null as 0:00 (falsy guard)", () => {
    expect(formatMinutes(null)).toBe("0:00");
  });

  it("formats 65 as 1:05", () => {
    expect(formatMinutes(65)).toBe("1:05");
  });

  it("formats 3600 as 60:00", () => {
    expect(formatMinutes(3600)).toBe("60:00");
  });
});

describe("statusLabel", () => {
  it("returns Шууд for live_provisional", () => {
    expect(statusLabel("live_provisional")).toBe("Шууд");
  });

  it("returns Товлосон for scheduled", () => {
    expect(statusLabel("scheduled")).toBe("Товлосон");
  });

  it("returns Дууссан for final_pending_review", () => {
    expect(statusLabel("final_pending_review")).toBe("Дууссан");
  });

  it("returns Баталгаажуулсан for league_verified", () => {
    expect(statusLabel("league_verified")).toBe("Баталгаажуулсан");
  });

  it("returns Албан ёсны for official", () => {
    expect(statusLabel("official")).toBe("Албан ёсны");
  });

  it("returns Цуцалсан for cancelled", () => {
    expect(statusLabel("cancelled")).toBe("Цуцалсан");
  });

  it("returns Хойшлогдсон for postponed", () => {
    expect(statusLabel("postponed")).toBe("Хойшлогдсон");
  });

  it("returns the status itself for unknown values", () => {
    expect(statusLabel("unknown")).toBe("unknown");
  });
});

describe("statusVariant", () => {
  it("returns destructive for live_provisional", () => {
    expect(statusVariant("live_provisional")).toBe("destructive");
  });

  it("returns secondary for final_pending_review", () => {
    expect(statusVariant("final_pending_review")).toBe("secondary");
  });

  it("returns secondary for league_verified", () => {
    expect(statusVariant("league_verified")).toBe("secondary");
  });

  it("returns outline for scheduled", () => {
    expect(statusVariant("scheduled")).toBe("outline");
  });

  it("returns outline for official", () => {
    expect(statusVariant("official")).toBe("outline");
  });

  it("returns outline for unknown", () => {
    expect(statusVariant("unknown")).toBe("outline");
  });
});

// =========================================================================
// data.ts pure functions
// =========================================================================

describe("convertPlayByPlayToStatEvents", () => {
  it("converts an empty array", () => {
    expect(convertPlayByPlayToStatEvents([])).toEqual([]);
  });

  it("maps a PlayByPlayRow to a StatEvent", () => {
    const rows: PlayByPlayRow[] = [
      {
        event_id: "evt-1",
        game_id: "game-1",
        period: 1,
        clock_seconds: 600,
        event_type: "shot_2pt_made",
        team_season_id: "ts-1",
        player_id: "p-1",
        payload: { x: 50, y: 30 },
        created_at: "2026-07-22T12:00:00Z",
        operation_id: "op-1",
        local_seq: 1,
      },
    ];

    const result = convertPlayByPlayToStatEvents(rows);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("evt-1");
    expect(result[0].game_id).toBe("game-1");
    expect(result[0].event_type).toBe("shot_2pt_made");
    expect(result[0].player_id).toBe("p-1");
    expect(result[0].period).toBe(1);
    expect(result[0].clock_seconds).toBe(600);
    expect(result[0].payload).toEqual({ x: 50, y: 30 });
  });

  it("sets safe defaults for non-public fields", () => {
    const rows: PlayByPlayRow[] = [
      {
        event_id: "evt-1",
        game_id: "game-1",
        period: 1,
        clock_seconds: 600,
        event_type: "shot_2pt_made",
        team_season_id: "ts-1",
        player_id: "p-1",
        payload: {},
        created_at: "2026-07-22T12:00:00Z",
        operation_id: "op-1",
        local_seq: 1,
      },
    ];

    const result = convertPlayByPlayToStatEvents(rows);
    expect(result[0].client_id).toBe("");
    expect(result[0].created_by).toBe("");
    expect(result[0].deleted_at).toBeNull();
    expect(result[0].superseded_by).toBeNull();
    expect(result[0].tracker_session_id).toBe("");
    expect(result[0].void_reason).toBeNull();
    expect(result[0].voided_at).toBeNull();
    expect(result[0].voided_by).toBeNull();
  });

  it("handles null team_season_id and player_id for admin events", () => {
    const rows: PlayByPlayRow[] = [
      {
        event_id: "evt-1",
        game_id: "game-1",
        period: 1,
        clock_seconds: 600,
        event_type: "period_start",
        team_season_id: null,
        player_id: null,
        payload: {},
        created_at: "2026-07-22T12:00:00Z",
        operation_id: "op-1",
        local_seq: 1,
      },
    ];

    const result = convertPlayByPlayToStatEvents(rows);
    expect(result[0].player_id).toBeNull();
    expect(result[0].team_season_id).toBe("");
  });
});
