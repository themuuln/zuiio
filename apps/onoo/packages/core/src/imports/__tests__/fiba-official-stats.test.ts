import { describe, expect, it } from "vitest";
import {
  fibaTextItemsToLines,
  parseFibaOfficialStats,
} from "../fiba-official-stats";

const OFFICIAL_STATS_LINES = [
  "SPACE JUNIOR",
  "PG YELLOW BROTHERS vs ALDAR TG",
  "OFFICIAL STATISTICS",
  "31 - 56",
  "PG YELLOW BROTHERS (PGY)",
  "No. Name Min FG M/A % 2P FG M/A % 3P FG M/A % FT M/A % RO RD Tot AS TO ST BS PF C D +/- PTS",
  "1 . TSENDBILEG 20:42 4/17 23.5 4/15 26.7 0/2 0.0 2/4 50.0 1 0 1 2 4 0 0 1 2 0 -14 10",
  "4 . TUGULDUR 21:00 3/9 33.3 3/7 42.9 0/2 0.0 0/2 0.0 3 2 5 0 4 2 0 1 0 0 -16 6",
  "0 . ANAND DNP",
  "Team/Coach 4 1 5 2 0 1 0 0 0 0",
  "Totals 14/47 29.8 13/38 34.2 1/9 11.1 2/6 33.3 15 12 27 7 17 4 0 15 6 31",
  "ALDAR TG (ALD)",
  "No. Name Min FG M/A % 2P FG M/A % 3P FG M/A % FT M/A % RO RD Tot AS TO ST BS PF C D +/- PTS",
  "2 . BILGEERDEM 17:42 6/13 46.2 5/6 83.3 1/7 14.3 7/13 53.8 1 4 5 0 0 4 2 1 0 0 +14 20",
  "25 . JAVKHLANTUGUS 21:00 9/14 64.3 9/11 81.8 0/3 0.0 2/3 66.7 1 5 6 1 1 5 2 3 0 0 +16 20",
  "0 . TEMUULEN DNP",
  "Team/Coach 2 2 4 2 1 0 0 0 0 0",
  "Totals 22/47 46.8 21/35 60.0 1/12 8.3 11/22 50.0 14 20 34 7 13 12 3 6 0 56",
];

describe("parseFibaOfficialStats", () => {
  it("normalizes player lines from a FIBA official-statistics table", () => {
    const result = parseFibaOfficialStats(OFFICIAL_STATS_LINES);

    expect(result.score).toEqual({ home: 31, away: 56 });
    expect(result.teams[0]).toMatchObject({
      name: "PG YELLOW BROTHERS",
      code: "PGY",
    });
    expect(result.teams[1]).toMatchObject({ name: "ALDAR TG", code: "ALD" });
    expect(result.teams[0].players[0]).toMatchObject({
      jerseyNumber: 1,
      name: "TSENDBILEG",
      secondsPlayed: 1242,
      fgm: 4,
      fga: 17,
      tpm: 0,
      tpa: 2,
      ftm: 2,
      fta: 4,
      oreb: 1,
      dreb: 0,
      ast: 2,
      tov: 4,
      stl: 0,
      blk: 0,
      pf: 1,
      pts: 10,
      plusMinus: -14,
    });
    expect(result.teams[0].players[2]).toMatchObject({
      name: "ANAND",
      dnp: true,
      pts: 0,
    });
  });

  it("warns instead of silently trusting inconsistent player totals", () => {
    const result = parseFibaOfficialStats(OFFICIAL_STATS_LINES);

    expect(result.warnings).toEqual([
      "PG YELLOW BROTHERS: player points 16 do not match score 31",
      "ALDAR TG: player points 40 do not match score 56",
    ]);
    expect(result.confidence).toBe(0.75);
  });

  it("groups positioned PDF text in visual reading order", () => {
    const lines = fibaTextItemsToLines([
      { str: "BROTHERS", x: 72, y: 720 },
      { str: "PG YELLOW", x: 0, y: 720.5 },
      { str: "31", x: 0, y: 680 },
      { str: "-", x: 22, y: 680 },
      { str: "56", x: 35, y: 680 },
    ]);

    expect(lines).toEqual(["PG YELLOW BROTHERS", "31 - 56"]);
  });

  it("rejects documents that do not contain two FIBA team tables", () => {
    expect(() => parseFibaOfficialStats(["OFFICIAL STATISTICS", "31 - 56"])).toThrow(
      "Expected two team tables, found 0",
    );
  });
});
