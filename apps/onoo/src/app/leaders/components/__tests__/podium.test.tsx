/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next/link — render a plain <a> with href
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// Mock PlayerAvatar — render a span with data-testid and name text
vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({ name }: { name: string }) => (
    <span data-testid="player-avatar">{name}</span>
  ),
}));

// Mock Badge — render children in a span with data-testid
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: Record<string, unknown>) => (
    <span data-testid="badge" {...props}>
      {children as React.ReactNode}
    </span>
  ),
}));

import { Podium } from "../podium";

function makeLeader(overrides: Record<string, unknown> = {}) {
  return {
    competition_id: "c1",
    competition_name: "Test League",
    season_id: "s1",
    league_id: "l1",
    player_id: "p1",
    player_name: "Test Player",
    player_name_latin: null,
    player_position: "G",
    team_season_id: "ts1",
    team_id: "t1",
    team_name: "Test Team",
    gp: 10,
    mpg: 30,
    pts: 25.5,
    fgm: 8,
    fga: 16,
    tpm: 3,
    tpa: 8,
    ftm: 4,
    fta: 5,
    oreb: 2,
    dreb: 5,
    ast: 6,
    stl: 1.5,
    blk: 0.5,
    tov: 3,
    pf: 2,
    player_latin: null,
    team_short: "TT",
    team_color: "#ff0000",
    seconds_played: 1200,
    player_photo_url: null,
    team_primary_color: "#ff0000",
    team_logo_url: null,
    team_short_code: "TT",
    photo_url: null,
    points_per_game: 25.5,
    rebounds_per_game: 7,
    assists_per_game: 6,
    team_slug: "test-team",
    games_played: 10,
    qualified: true,
    team_games_played: 10,
    ...overrides,
  };
}

function makeLeaders(count: number) {
  return Array.from({ length: count }, (_, i) =>
    makeLeader({
      player_id: `p${i + 1}`,
      player_name: `Player ${i + 1}`,
      team_name: `Team ${i + 1}`,
      pts: 30 - i * 5,
      ast: 10 - i * 2,
    }),
  );
}

describe("Podium", () => {
  it("renders top 3 players with names and stat values", () => {
    const leaders = makeLeaders(3);
    render(<Podium leaders={leaders} statKey="pts" />);

    // Player names visible
    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("Player 2")).toBeInTheDocument();
    expect(screen.getByText("Player 3")).toBeInTheDocument();

    // Stat values with one decimal
    expect(screen.getByText("30.0")).toBeInTheDocument();
    expect(screen.getByText("25.0")).toBeInTheDocument();
    expect(screen.getByText("20.0")).toBeInTheDocument();

    // Team names visible
    expect(screen.getByText("Team 1")).toBeInTheDocument();
    expect(screen.getByText("Team 2")).toBeInTheDocument();
    expect(screen.getByText("Team 3")).toBeInTheDocument();
  });

  it("renders nothing when leaders array is empty", () => {
    const { container } = render(<Podium leaders={[]} statKey="pts" />);
    expect(container.firstChild).toBeNull();
  });

  it.each([
    { rank: 0, expectedBorder: "border-[#FFD700]" },
    { rank: 1, expectedBorder: "border-[#C0C0C0]" },
    { rank: 2, expectedBorder: "border-[#CD7F32]" },
  ])(
    "renders $expectedBorder accent for rank $rank+1",
    ({ rank, expectedBorder }) => {
      const leaders = makeLeaders(3);
      render(<Podium leaders={leaders} statKey="pts" />);

      const links = screen.getAllByRole("link");
      expect(links[rank].className).toContain(expectedBorder);
    },
  );

  it("all links point to /players/[player_id]", () => {
    const leaders = makeLeaders(3);
    render(<Podium leaders={leaders} statKey="ast" />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute("href", "/players/p1");
    expect(links[1]).toHaveAttribute("href", "/players/p2");
    expect(links[2]).toHaveAttribute("href", "/players/p3");
  });
});
