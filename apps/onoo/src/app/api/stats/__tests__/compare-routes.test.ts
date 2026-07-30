import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GET } from "../compare-players/route";
import { GET as GetCompare } from "../compare/route";

function mockNextRequest(url: string): NextRequest {
  return { nextUrl: new URL(url) } as unknown as NextRequest;
}

function mockFrom(data: unknown): { from: () => { select: () => { in?: () => { eq?: () => Promise<typeof data> }; eq?: () => Promise<typeof data>; order?: () => Promise<typeof data> } } } {
  const queryResult = Promise.resolve(data);
  const chain = {
    select: () => chain,
    in: () => chain,
    eq: () => chain,
    order: () => queryResult,
  };
  return { from: () => ({ select: () => chain }) };
}

describe("GET /api/stats/compare-players", () => {
  it("returns 400 when fewer than 2 player IDs provided", async () => {
    const response = await GET(
      mockNextRequest("http://localhost/api/stats/compare-players?playerIds=p1"),
    );
    expect(response.status).toBe(400);
  });

  it("returns 200 with Cache-Control header when data is valid", async () => {
    const leaderData = {
      data: [
        {
          player_id: "p1",
          competition_id: "comp-1",
          team_id: "t1",
          team_name: "Team A",
          gp: 5,
          pts: 20,
          fgm: 8,
          fga: 16,
          tpm: 3,
          tpa: 7,
          ftm: 4,
          fta: 5,
          oreb: 2,
          dreb: 4,
          ast: 3,
          stl: 1,
          blk: 0,
          tov: 2,
        },
        {
          player_id: "p2",
          competition_id: "comp-1",
          team_id: "t2",
          team_name: "Team B",
          gp: 5,
          pts: 18,
          fgm: 7,
          fga: 14,
          tpm: 2,
          tpa: 6,
          ftm: 2,
          fta: 3,
          oreb: 1,
          dreb: 3,
          ast: 5,
          stl: 2,
          blk: 1,
          tov: 1,
        },
      ],
      error: null,
    };

    const profileData = {
      data: [
        {
          player_id: "p1",
          competition_id: "comp-1",
          player_name: "Player One",
          player_name_latin: null,
          photo_url: null,
          player_position: "G",
          team_id: "t1",
          team_name: "Team A",
          team_slug: "team-a",
          team_short_code: "TEA",
          team_logo_url: null,
          team_primary_color: null,
          competition_name: "Test League",
          season_name: "2024",
        },
        {
          player_id: "p2",
          competition_id: "comp-1",
          player_name: "Player Two",
          player_name_latin: null,
          photo_url: null,
          player_position: "F",
          team_id: "t2",
          team_name: "Team B",
          team_slug: "team-b",
          team_short_code: "TEB",
          team_logo_url: null,
          team_primary_color: null,
          competition_name: "Test League",
          season_name: "2024",
        },
      ],
      error: null,
    };

    let callCount = 0;
    vi.mocked(createClient).mockImplementation(() => {
      callCount++;
      const data = callCount <= 1 ? leaderData : profileData;
      // Build a chain that resolves to the appropriate data
      const queryPromise = Promise.resolve(data);
      const chain = {
        select: () => chain,
        in: () => chain,
        eq: () => chain,
        order: () => chain,
        then: queryPromise.then.bind(queryPromise),
        catch: queryPromise.catch.bind(queryPromise),
      };
      return Promise.resolve({ from: () => ({ select: () => chain }) } as never);
    });

    const response = await GET(
      mockNextRequest("http://localhost/api/stats/compare-players?playerIds=p1,p2&competitionId=comp-1"),
    );

    expect(response.status).toBe(200);

    const cacheControl = response.headers.get("Cache-Control");
    expect(cacheControl).toContain("s-maxage=60");
    expect(cacheControl).toContain("stale-while-revalidate=600");
  });
});

describe("GET /api/stats/compare", () => {
  it("returns 400 when no playerId or teamId provided", async () => {
    const response = await GetCompare(
      mockNextRequest("http://localhost/api/stats/compare"),
    );
    expect(response.status).toBe(400);
  });

  it("returns player data with Cache-Control on success", async () => {
    const mockData = {
      data: [
        {
          gp: 5,
          minutes: 150,
          pts: 100,
          fgm: 40,
          fga: 80,
          tpm: 10,
          tpa: 30,
          ftm: 10,
          fta: 15,
          oreb: 10,
          dreb: 20,
          ast: 15,
          stl: 5,
          blk: 3,
          tov: 8,
          pf: 10,
          team_seasons: {
            season: { name: "2024", starts_on: "2024-01-01" },
            league: { name: "NBL" },
          },
        },
      ],
      error: null,
    };

    const queryPromise = Promise.resolve(mockData);
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => queryPromise,
    };

    vi.mocked(createClient).mockResolvedValue({
      from: () => ({ select: () => chain }),
    } as never);

    const response = await GetCompare(
      mockNextRequest("http://localhost/api/stats/compare?playerId=p1"),
    );
    expect(response.status).toBe(200);

    const cacheControl = response.headers.get("Cache-Control");
    expect(cacheControl).toContain("s-maxage=300");
    expect(cacheControl).toContain("stale-while-revalidate=3600");
  });
});
