import { describe, expect, it, vi } from "vitest";

// Mock the data layer
vi.mock("@/app/lib/data", () => ({
  getTeamQuickView: vi.fn(),
}));

import { getTeamQuickView } from "@/app/lib/data";
import { GET } from "../team/[teamSeasonId]/route";

function mockRequest(url: string): Request {
  return new Request(url);
}

describe("GET /api/standings/team/[teamSeasonId]", () => {
  it("returns 404 when team not found", async () => {
    vi.mocked(getTeamQuickView).mockResolvedValue(null);

    const response = await GET(
      mockRequest("http://localhost/api/standings/team/123"),
      {
        params: Promise.resolve({ teamSeasonId: "123" }),
      },
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Team not found");
  });

  it("returns team data with Cache-Control header for cache hit", async () => {
    const mockData = {
      recentGames: [],
      leaders: [],
      nextGame: null,
    };
    vi.mocked(getTeamQuickView).mockResolvedValue(mockData);

    const response = await GET(
      mockRequest("http://localhost/api/standings/team/456"),
      {
        params: Promise.resolve({ teamSeasonId: "456" }),
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockData);

    // Verify Cache-Control header for Vercel CDN caching
    const cacheControl = response.headers.get("Cache-Control");
    expect(cacheControl).toContain("s-maxage=60");
    expect(cacheControl).toContain("stale-while-revalidate=600");
  });
});
