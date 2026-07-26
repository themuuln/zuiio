import { formatPlayerName, getStatLabel } from "@onoo/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { GET } from "../pdf/route";

function mockRequest(url: string): NextRequest {
  const parsed = new URL(url);
  return {
    nextUrl: {
      searchParams: parsed.searchParams,
    },
  } as unknown as NextRequest;
}

describe("getStatLabel", () => {
  it("returns Mongolian label by default", () => {
    expect(getStatLabel("pts")).toBe("Оноо");
    expect(getStatLabel("reb")).toBe("Буулт");
    expect(getStatLabel("ast")).toBe("Олгосон");
  });

  it("returns Mongolian label when locale is mn", () => {
    expect(getStatLabel("pts", "mn")).toBe("Оноо");
    expect(getStatLabel("stl", "mn")).toBe("Булаасан");
    expect(getStatLabel("blk", "mn")).toBe("Блок");
  });

  it("returns English label when locale is en", () => {
    expect(getStatLabel("pts", "en")).toBe("PTS");
    expect(getStatLabel("reb", "en")).toBe("REB");
    expect(getStatLabel("ast", "en")).toBe("AST");
    expect(getStatLabel("stl", "en")).toBe("STL");
    expect(getStatLabel("blk", "en")).toBe("BLK");
    expect(getStatLabel("tov", "en")).toBe("TOV");
    expect(getStatLabel("mpg", "en")).toBe("MPG");
  });

  it("returns the key unchanged for unknown stat keys", () => {
    expect(getStatLabel("invalid_key" as never, "en")).toBe("invalid_key");
  });
});

describe("formatPlayerName", () => {
  it("returns canonical name for Mongolian locale", () => {
    expect(formatPlayerName("Bold Bat", "Болд Бат", "mn")).toBe("Болд Бат");
  });

  it("returns Latin name for English locale when available", () => {
    expect(formatPlayerName("Bold Bat", "Болд Бат", "en")).toBe("Bold Bat");
  });

  it("falls back to canonical name for English when name_latin is null", () => {
    expect(formatPlayerName(null, "Болд Бат", "en")).toBe("Болд Бат");
  });

  it("falls back to canonical name for English when name_latin is empty string", () => {
    expect(formatPlayerName("", "Болд Бат", "en")).toBe("Болд Бат");
  });
});

describe("PDF export route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when gameId is missing", async () => {
    const req = mockRequest("http://localhost/api/export/pdf");
    const response = await GET(req);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("gameId required");
  });

  it("returns 404 when game is not found", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "Not found" } }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const req = mockRequest("http://localhost/api/export/pdf?gameId=bad-id");
    const response = await GET(req);
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toBe("Game not found");
  });

  it("returns 500 when player stats query fails", async () => {
    const mockGame = {
      id: "game-1",
      home_score: 10,
      away_score: 5,
      home_team_season_id: "home-ts",
      away_team_season_id: "away-ts",
      home_team_season: { teams: { name: "Home Team" } },
      away_team_season: { teams: { name: "Away Team" } },
      competitions: { name: "Test League" },
      venues: { name: "Test Arena", city: "UB" },
    };

    // Mock a chain: from("games") -> select -> eq -> single
    const mockGameQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockGame, error: null }),
    };

    // Then a separate chain for game_player_stats that fails
    const mockStatsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "DB error" } }),
    };

    // Each .from() call returns a different query builder
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(mockGameQuery) // first .from("games")
      .mockReturnValueOnce(mockStatsQuery) // second .from("game_player_stats")
      .mockReturnValue(mockStatsQuery); // remaining

    const mockClient = {
      from: fromMock,
    };
    vi.mocked(createClient).mockResolvedValue(mockClient as never);

    const req = mockRequest("http://localhost/api/export/pdf?gameId=game-1");
    const response = await GET(req);
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error).toBe("DB error");
  });

  it("returns HTML with game title by default (lang=mn)", async () => {
    const mockGame = {
      id: "game-1",
      home_score: 10,
      away_score: 5,
      home_team_season_id: "home-ts",
      away_team_season_id: "away-ts",
      home_team_season: { teams: { name: "Home Team" } },
      away_team_season: { teams: { name: "Away Team" } },
      competitions: { name: "Test League" },
      venues: { name: "Test Arena", city: "UB" },
    };

    const mockPlayerStats = [
      {
        minutes: 30,
        pts: 20,
        fgm: 8,
        fga: 15,
        tpm: 2,
        tpa: 6,
        ftm: 2,
        fta: 2,
        oreb: 1,
        dreb: 4,
        ast: 5,
        stl: 2,
        blk: 1,
        tov: 3,
        players: {
          canonical_name: "Болд Бат",
          name_latin: "Bold Bat",
          jersey_number: 7,
        },
        team_seasons: { id: "home-ts" },
      },
    ];

    // Chain 1: games query
    const mockGameQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockGame, error: null }),
    };

    // Chain 2: game_player_stats query
    const mockStatsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: mockPlayerStats, error: null }),
    };

    // Chain 3: game_team_stats query
    const mockTeamStatsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(mockGameQuery)
      .mockReturnValueOnce(mockStatsQuery)
      .mockReturnValue(mockTeamStatsQuery);

    const mockClient = { from: fromMock };
    vi.mocked(createClient).mockResolvedValue(mockClient as never);

    // Test with default (no lang param) — uses Mongolian
    const req = mockRequest("http://localhost/api/export/pdf?gameId=game-1");
    const response = await GET(req);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html");

    const html = await response.text();
    // Should contain the box score title
    expect(html).toContain("Box Score - Home Team vs Away Team");
    // Should use Mongolian name (canonical)
    expect(html).toContain("Болд Бат");
    // Should not contain the English title
    expect(html).not.toContain("Official player statistics");
    // Should use Mongolian header
    expect(html).not.toContain("MPG");
  });

  it("returns HTML with English title and labels when lang=en", async () => {
    const mockGame = {
      id: "game-1",
      home_score: 10,
      away_score: 5,
      home_team_season_id: "home-ts",
      away_team_season_id: "away-ts",
      home_team_season: { teams: { name: "Home Team" } },
      away_team_season: { teams: { name: "Away Team" } },
      competitions: { name: "Test League" },
      venues: { name: "Test Arena", city: "UB" },
    };

    const mockPlayerStats = [
      {
        minutes: 30,
        pts: 20,
        fgm: 8,
        fga: 15,
        tpm: 2,
        tpa: 6,
        ftm: 2,
        fta: 2,
        oreb: 1,
        dreb: 4,
        ast: 5,
        stl: 2,
        blk: 1,
        tov: 3,
        players: {
          canonical_name: "Болд Бат",
          name_latin: "Bold Bat",
          jersey_number: 7,
        },
        team_seasons: { id: "home-ts" },
      },
    ];

    const mockGameQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockGame, error: null }),
    };

    const mockStatsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: mockPlayerStats, error: null }),
    };

    const mockTeamStatsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(mockGameQuery)
      .mockReturnValueOnce(mockStatsQuery)
      .mockReturnValue(mockTeamStatsQuery);

    const mockClient = { from: fromMock };
    vi.mocked(createClient).mockResolvedValue(mockClient as never);

    // Test with lang=en
    const req = mockRequest(
      "http://localhost/api/export/pdf?gameId=game-1&lang=en",
    );
    const response = await GET(req);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html");

    const html = await response.text();
    // Should contain the English title
    expect(html).toContain("Official player statistics");
    // Should use Latin name for English
    expect(html).toContain("Bold Bat");
    // Should contain English stat labels in column headers
    expect(html).toContain("MPG");
    expect(html).toContain("REB");
    expect(html).toContain("AST");
    expect(html).toContain("STL");
    // Should NOT contain Mongolian canonical name
    expect(html).not.toContain("Болд Бат");
    // Should show "Player" as column header for English
    expect(html).toContain(">Player<");
  });
});
