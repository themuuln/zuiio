import { describe, expect, it } from "vitest";

// Extract bracket logic for testing
const ROUND_LABELS: Record<number, string> = {
  1: "Шөвийн 1/4 финал",
  2: "Хагас финал",
  3: "Финал",
};

function getRoundLabel(round: number): string {
  return ROUND_LABELS[round] ?? `Раунд ${round}`;
}

interface BracketMatchup {
  id: string;
  round: number;
  position: number;
}

function groupByRound(matchups: BracketMatchup[]): Map<number, BracketMatchup[]> {
  const rounds = new Map<number, BracketMatchup[]>();
  for (const m of matchups) {
    const existing = rounds.get(m.round) ?? [];
    existing.push(m);
    rounds.set(m.round, existing);
  }
  return rounds;
}

describe("TournamentBracket", () => {
  const matchups: BracketMatchup[] = [
    { id: "m1", round: 1, position: 1 },
    { id: "m2", round: 1, position: 2 },
    { id: "m3", round: 1, position: 3 },
    { id: "m4", round: 1, position: 4 },
    { id: "m5", round: 2, position: 1 },
    { id: "m6", round: 2, position: 2 },
    { id: "m7", round: 3, position: 1 },
  ];

  it("returns correct round labels", () => {
    expect(getRoundLabel(1)).toBe("Шөвийн 1/4 финал");
    expect(getRoundLabel(2)).toBe("Хагас финал");
    expect(getRoundLabel(3)).toBe("Финал");
  });

  it("returns fallback label for unknown round", () => {
    expect(getRoundLabel(99)).toBe("Раунд 99");
  });

  it("groups matchups by round", () => {
    const grouped = groupByRound(matchups);

    expect(grouped.get(1)).toHaveLength(4);
    expect(grouped.get(2)).toHaveLength(2);
    expect(grouped.get(3)).toHaveLength(1);
  });

  it("handles empty matchups", () => {
    const grouped = groupByRound([]);

    expect(grouped.size).toBe(0);
  });
});
