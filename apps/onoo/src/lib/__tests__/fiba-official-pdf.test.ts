import { readFile } from "node:fs/promises";
import path from "node:path";
import { fibaTextItemsToLines, parseFibaOfficialStats } from "@onoo/core";
import { extractTextItems, getDocumentProxy } from "unpdf";
import { describe, expect, it } from "vitest";

const FIXTURES = [
  {
    filename: "B19.pdf",
    score: { home: 31, away: 110 },
    teams: ["ХЦА", "KHOSTE"],
  },
  {
    filename: "B20.pdf",
    score: { home: 104, away: 70 },
    teams: ["YER", "JIG"],
  },
  {
    filename: "B21.pdf",
    score: { home: 110, away: 105 },
    teams: ["EAG", "КЕР"],
  },
] as const;

describe("Mongolian FIBA official-statistics PDFs", () => {
  for (const fixture of FIXTURES) {
    it(`extracts and parses ${fixture.filename}`, async () => {
      const pdfBytes = await readFile(
        path.join(
          process.cwd(),
          "test/fixtures/fiba-official-stats",
          fixture.filename,
        ),
      );
      const pdf = await getDocumentProxy(new Uint8Array(pdfBytes));
      const { items } = await extractTextItems(pdf);
      const lines = items.flatMap((page) => fibaTextItemsToLines(page));
      const result = parseFibaOfficialStats(lines);

      expect(result.score).toEqual(fixture.score);
      expect(result.teams.map((team) => team.code)).toEqual(fixture.teams);
      expect(result.teams.map((team) => team.players.length)).toEqual(
        expect.arrayContaining([expect.any(Number), expect.any(Number)]),
      );
      expect(result.teams.every((team) => team.players.length > 0)).toBe(true);
      expect(
        result.teams.map((team) =>
          team.players.reduce((total, player) => total + player.pts, 0),
        ),
      ).toEqual([fixture.score.home, fixture.score.away]);
      expect(result.warnings).toEqual([]);
    });
  }
});
