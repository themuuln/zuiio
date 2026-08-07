/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/link (used by SearchResults)
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// Mock SearchResults client component
vi.mock("../components/search-results", () => ({
  SearchResults: ({
    initialQuery,
    initialResults,
    className,
  }: {
    initialQuery: string;
    initialResults: Record<string, unknown>;
    className?: string;
  }) => (
    <div
      data-testid="search-results"
      data-query={initialQuery}
      data-classname={className}
    >
      <span data-testid="mock-initial-query">{initialQuery}</span>
      <span data-testid="mock-players-count">
        {(initialResults.players as unknown[])?.length ?? 0}
      </span>
      <span data-testid="mock-teams-count">
        {(initialResults.teams as unknown[])?.length ?? 0}
      </span>
      <span data-testid="mock-games-count">
        {(initialResults.games as unknown[])?.length ?? 0}
      </span>
    </div>
  ),
}));

import type { SearchAllResult } from "@/app/lib/data";
import SearchPage from "../page";

const { mockSearchAll } = vi.hoisted(() => ({
  mockSearchAll: vi.fn(),
}));

vi.mock("@/app/lib/data", () => ({
  searchAll: mockSearchAll,
}));

function makeSearchResult(
  overrides: Partial<SearchAllResult> = {},
): SearchAllResult {
  return {
    players: overrides.players ?? [],
    teams: overrides.teams ?? [],
    games: overrides.games ?? [],
    ...overrides,
  };
}

describe("SearchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and description", async () => {
    mockSearchAll.mockResolvedValue(makeSearchResult());
    const params = Promise.resolve({});
    render(await SearchPage({ searchParams: params }));
    expect(screen.getByText("Хайлт")).toBeInTheDocument();
    expect(screen.getByText("Бүх зүйлийг хайх")).toBeInTheDocument();
  });

  it("passes empty query and results when no searchParams.q", async () => {
    mockSearchAll.mockResolvedValue(makeSearchResult());
    const params = Promise.resolve({});
    render(await SearchPage({ searchParams: params }));
    expect(screen.getByTestId("mock-initial-query")).toHaveTextContent("");
  });

  it("calls searchAll with query from searchParams", async () => {
    mockSearchAll.mockResolvedValue(makeSearchResult());
    const params = Promise.resolve({ q: "Болд" });
    render(await SearchPage({ searchParams: params }));
    expect(mockSearchAll).toHaveBeenCalledWith("Болд");
  });

  it("passes query to SearchResults component", async () => {
    const mockResults = makeSearchResult();
    mockSearchAll.mockResolvedValue(mockResults);
    const params = Promise.resolve({ q: "Болд" });
    render(await SearchPage({ searchParams: params }));
    expect(screen.getByTestId("search-results")).toHaveAttribute(
      "data-query",
      "Болд",
    );
  });

  it("passes player results count to SearchResults", async () => {
    const mockResults = makeSearchResult({
      players: [
        {
          player_id: "player-1",
          player_name: "Болд",
          player_name_latin: "Bold",
          player_photo_url: null,
          team_name: "Хасууд",
          team_short_code: "ХАС",
          team_slug: "khasuud",
          team_primary_color: "#e63946",
          match_team_name: null,
          match_team_short_code: null,
        },
      ],
      teams: [],
      games: [],
    });
    mockSearchAll.mockResolvedValue(mockResults);
    const params = Promise.resolve({ q: "Болд" });
    render(await SearchPage({ searchParams: params }));
    expect(screen.getByTestId("mock-players-count")).toHaveTextContent("1");
  });

  it("passes team results count to SearchResults", async () => {
    const mockResults = makeSearchResult({
      players: [],
      teams: [
        {
          team_id: "team-1",
          team_name: "Хасууд",
          team_short_code: "ХАС",
          team_slug: "khasuud",
          team_primary_color: "#e63946",
          team_logo_url: null,
          match_type: "exact" as const,
        },
      ],
      games: [],
    });
    mockSearchAll.mockResolvedValue(mockResults);
    const params = Promise.resolve({ q: "Хас" });
    render(await SearchPage({ searchParams: params }));
    expect(screen.getByTestId("mock-teams-count")).toHaveTextContent("1");
  });

  it("passes game results count to SearchResults", async () => {
    const mockResults = makeSearchResult({
      players: [],
      teams: [],
      games: [
        {
          game_id: "game-1",
          home_team_name: "Хасууд",
          home_team_short_code: "ХАС",
          home_team_slug: "khasuud",
          home_team_primary_color: "#e63946",
          home_team_logo_url: null,
          away_team_name: "Арслангууд",
          away_team_short_code: "АРС",
          away_team_slug: "arslanuud",
          away_team_primary_color: "#1d3557",
          away_team_logo_url: null,
          scheduled_at: "2024-01-15T18:00:00Z",
          status: "final",
          home_score: 85,
          away_score: 72,
        },
      ],
    });
    mockSearchAll.mockResolvedValue(mockResults);
    const params = Promise.resolve({ q: "Хас" });
    render(await SearchPage({ searchParams: params }));
    expect(screen.getByTestId("mock-games-count")).toHaveTextContent("1");
  });

  it("calls searchAll with empty string when no q param", async () => {
    mockSearchAll.mockResolvedValue(makeSearchResult());
    const params = Promise.resolve({});
    render(await SearchPage({ searchParams: params }));
    expect(mockSearchAll).toHaveBeenCalledWith("");
  });

  it("handles empty results gracefully", async () => {
    mockSearchAll.mockResolvedValue(
      makeSearchResult({
        players: [],
        teams: [],
        games: [],
      }),
    );
    const params = Promise.resolve({ q: "nonexistent" });
    render(await SearchPage({ searchParams: params }));
    expect(screen.getByTestId("mock-players-count")).toHaveTextContent("0");
    expect(screen.getByTestId("mock-teams-count")).toHaveTextContent("0");
    expect(screen.getByTestId("mock-games-count")).toHaveTextContent("0");
  });
});
