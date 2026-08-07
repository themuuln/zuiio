import { describe, expect, it } from "vitest";

// Extract season/competition selector logic for testing
interface Competition {
  id: string;
  name: string;
  season: string;
}

function deriveCompetitions<
  T extends {
    competition_id: string;
    competition_name: string;
    season_name?: string;
  },
>(data: T[]): Competition[] {
  const map = new Map<string, Competition>();
  for (const row of data) {
    if (!map.has(row.competition_id)) {
      map.set(row.competition_id, {
        id: row.competition_id,
        name: row.competition_name,
        season: row.season_name ?? "",
      });
    }
  }
  return Array.from(map.values());
}

function filterByCompetition<T extends { competition_id: string }>(
  data: T[],
  competitionId: string,
): T[] {
  return data.filter((row) => row.competition_id === competitionId);
}

describe("Season/Competition Selector", () => {
  const data = [
    {
      competition_id: "c1",
      competition_name: "League A",
      season_name: "2024",
      player_id: "p1",
    },
    {
      competition_id: "c1",
      competition_name: "League A",
      season_name: "2024",
      player_id: "p2",
    },
    {
      competition_id: "c2",
      competition_name: "League B",
      season_name: "2024",
      player_id: "p3",
    },
  ];

  it("derives unique competitions", () => {
    const competitions = deriveCompetitions(data);
    expect(competitions).toHaveLength(2);
    expect(competitions[0].id).toBe("c1");
    expect(competitions[1].id).toBe("c2");
  });

  it("filters data by competition", () => {
    const filtered = filterByCompetition(data, "c1");
    expect(filtered).toHaveLength(2);
  });

  it("returns empty for non-existent competition", () => {
    const filtered = filterByCompetition(data, "nonexistent");
    expect(filtered).toHaveLength(0);
  });

  it("handles empty data", () => {
    const competitions = deriveCompetitions([]);
    expect(competitions).toHaveLength(0);
  });
});
