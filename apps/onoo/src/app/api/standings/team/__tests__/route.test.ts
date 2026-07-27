import { describe, expect, it, vi } from "vitest";
import { GET } from "../[teamSeasonId]/route";

vi.mock("@/app/lib/data", () => ({
  getTeamQuickView: vi.fn(),
}));

import { getTeamQuickView } from "@/app/lib/data";

const mockGetTeamQuickView = vi.mocked(getTeamQuickView);

describe("GET /api/standings/team/[teamSeasonId]", () => {
  it("returns 200 with team data", async () => {
    const mockData = {
      recentGames: [
        {
          id: "g1",
          home_team_name: "Хасууд",
          away_team_name: "Арслангууд",
          home_score: 85,
          away_score: 72,
        },
      ],
      leaders: [
        {
          player_id: "p1",
          player_name: "Б. Төгөлдөр",
          pts: 22.5,
        },
      ],
      nextGame: null,
    };
    mockGetTeamQuickView.mockResolvedValue(mockData);

    const request = new Request("http://localhost/api/standings/team/ts-1");
    const response = await GET(request, {
      params: Promise.resolve({ teamSeasonId: "ts-1" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.recentGames).toHaveLength(1);
    expect(body.leaders[0].player_name).toBe("Б. Төгөлдөр");
    expect(body.nextGame).toBeNull();
  });

  it("returns 404 when team is not found", async () => {
    mockGetTeamQuickView.mockResolvedValue(null);

    const request = new Request(
      "http://localhost/api/standings/team/nonexistent",
    );
    const response = await GET(request, {
      params: Promise.resolve({ teamSeasonId: "nonexistent" }),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Team not found");
  });

  it("returns 200 with empty recent games", async () => {
    mockGetTeamQuickView.mockResolvedValue({
      recentGames: [],
      leaders: [{ player_id: "p1", player_name: "Б. Төгөлдөр", pts: 22.5 }],
      nextGame: null,
    });

    const request = new Request("http://localhost/api/standings/team/ts-1");
    const response = await GET(request, {
      params: Promise.resolve({ teamSeasonId: "ts-1" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.recentGames).toEqual([]);
    expect(body.nextGame).toBeNull();
  });
});
