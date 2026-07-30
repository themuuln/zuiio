import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock data-layer modules
vi.mock("@/app/lib/data", () => ({
  getLeaders: vi.fn(),
  getStandings: vi.fn(),
}));

vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({ name }: { name: string }) => (
    <div data-testid="player-avatar">{name}</div>
  ),
}));

vi.mock("@/components/team-logo", () => ({
  TeamLogo: () => <div data-testid="team-logo" />,
}));

vi.mock("@/components/ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardAction: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

import { getLeaders, getStandings } from "@/app/lib/data";
import { StandingsLeadersInner } from "../home-standings-leaders";

const mockCompetitions = [
  { id: "comp-1", name: "Test League", season: "2024", league: "NBL" },
];

describe("HomeStandingsLeaders", () => {
  it("renders leaders and standings (inner component) when data is available", async () => {
    vi.mocked(getLeaders).mockResolvedValue([
      {
        player_id: "p1",
        player_name: "Test Player",
        team_name: "Test Team",
        pts: 25,
        oreb: 2,
        dreb: 5,
        ast: 3,
        stl: 1,
        blk: 0,
        competition_id: "comp-1",
        player_photo_url: null,
        team_primary_color: null,
        qualified: true,
        team_games_played: 10,
        gp: 10,
        tpm: 3,
        tpa: 8,
        ftm: 4,
        fta: 5,
        fgm: 9,
        fga: 18,
        tov: 2,
        pf: 3,
        team_short_code: "TST",
        team_slug: "test-team",
        team_season_id: "ts-1",
        team_secondary_color: null,
        team_logo_url: null,
        player_name_latin: null,
        points_per_game: 25,
        assists_per_game: 3,
        rebounds_per_game: 7,
      },
    ]);

    vi.mocked(getStandings).mockResolvedValue([
      {
        team_season_id: "ts-1",
        team_name: "Test Team",
        team_slug: "test-team",
        wins: 5,
        losses: 2,
        win_pct: 0.714,
        points_for: 450,
        points_against: 380,
        competition_id: "comp-1",
        team_logo_url: null,
        team_short_code: "TST",
        team_primary_color: null,
        team_secondary_color: null,
        w: 5,
        l: 2,
        gb: 0,
        streak: "W2",
        home_w: 3,
        home_l: 1,
        standings_w: null,
        standings_l: null,
        away_w: 2,
        away_l: 1,
        road: null,
        league: null,
        conference: null,
        division: null,
        team_games_played: 7,
        home_games_played: 4,
        away_games_played: 3,
        road_w: null,
        road_l: null,
        ot_w: null,
        ot_l: null,
        last_10: "5-2",
        pool_round: null,
        pool_rank: null,
        max_pool_teams: null,
        advanced_to_final: false,
        eliminated: false,
        classification: null,
        team_season: null,
      },
    ]);

    const { container } = render(
      await StandingsLeadersInner({
        competitions: mockCompetitions,
        activeCompetitionId: "comp-1",
      }),
    );

    // Should render without crashing
    expect(container.querySelector("section")).toBeTruthy();
    // Should render leader names in the list
    expect(container.textContent).toContain("Test Player");
    expect(container.textContent).toContain("Test Team");
  });

  it("renders empty state (inner component) when no leaders data", async () => {
    vi.mocked(getLeaders).mockResolvedValue([]);
    vi.mocked(getStandings).mockResolvedValue([]);

    const { container } = render(
      await StandingsLeadersInner({
        competitions: mockCompetitions,
        activeCompetitionId: "comp-1",
      }),
    );

    expect(container.querySelector("section")).toBeTruthy();
    expect(container.textContent).toContain("Тэргүүлэгч тодроогүй");
  });
});
