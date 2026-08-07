import { describe, expect, it } from "vitest";

// Extract drag-to-compare logic for testing
function canCompare(playerIds: string[]): boolean {
  return playerIds.length === 2;
}

function addPlayer(current: string[], newId: string, maxPlayers = 2): string[] {
  if (current.includes(newId)) {
    return current.filter((id) => id !== newId);
  }
  if (current.length >= maxPlayers) {
    return current;
  }
  return [...current, newId];
}

function buildCompareUrl(playerIds: string[]): string {
  return `/players/compare?players=${playerIds.join(",")}`;
}

describe("Drag-to-Compare Players", () => {
  it("allows comparison when 2 players selected", () => {
    expect(canCompare(["p1", "p2"])).toBe(true);
  });

  it("disallows comparison with 1 player", () => {
    expect(canCompare(["p1"])).toBe(false);
  });

  it("disallows comparison with 0 players", () => {
    expect(canCompare([])).toBe(false);
  });

  it("adds player to empty selection", () => {
    expect(addPlayer([], "p1")).toEqual(["p1"]);
  });

  it("adds second player", () => {
    expect(addPlayer(["p1"], "p2")).toEqual(["p1", "p2"]);
  });

  it("toggles player off if already selected", () => {
    expect(addPlayer(["p1", "p2"], "p1")).toEqual(["p2"]);
  });

  it("prevents adding third player", () => {
    expect(addPlayer(["p1", "p2"], "p3")).toEqual(["p1", "p2"]);
  });

  it("builds correct compare URL", () => {
    expect(buildCompareUrl(["p1", "p2"])).toBe(
      "/players/compare?players=p1,p2",
    );
  });
});
