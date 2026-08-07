/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/components/ui", () => ({
  Badge: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardAction: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-action">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="card-title">{children}</h3>
  ),
}));

vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({ name, size }: { name: string; size?: string }) => (
    <div data-testid="player-avatar" data-name={name} data-size={size} />
  ),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...inputs: (string | undefined | null | false)[]) =>
    inputs.filter(Boolean).join(" "),
}));

import type { BoxScoreRow, GameWithTeams } from "../../../lib/shared";
import { RecapHeader } from "../recap-header";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGame(overrides: Partial<GameWithTeams> = {}): GameWithTeams {
  return {
    id: "game-1",
    home_team_season_id: "home-ts-1",
    home_team_name: "Ховд",
    home_team_short_code: "ХОВ",
    home_team_logo_url: null,
    away_team_season_id: "away-ts-1",
    away_team_name: "Дархан",
    away_team_short_code: "ДАР",
    away_team_logo_url: null,
    venue_name: "Ховд спорт цогцолбор",
    competition_name: "МҮБТ",
    season_id: "season-1",
    season_name: "2024-25",
    league_id: "league-1",
    league_name: "Монголын Үндэсний Дээд Лиг",
    league_slug: "mn-верхняя-лига",
    revision_id: "rev-1",
    revision_number: 1,
    revision_approved_at: "2025-01-15T10:00:00Z",
    source_submission_id: "sub-1",
    source_type: "official_score_sheet",
    evidence_url: null,
    source_reviewer_id: null,
    source_reviewed_at: null,
    home_name: "Ховд",
    home_short: "ХОВ",
    home_color: null,
    away_name: "Дархан",
    away_short: "ДАР",
    away_color: null,
    venue_city: null,
    is_provisional: false,
    home_team_primary_color: null,
    away_team_primary_color: null,
    home_team_slug: "khovd",
    away_team_slug: "darkhan",
    home_team_id: "home-team-1",
    home_score: 85,
    away_score: 72,
    status: "official" as const,
    scheduled_at: "2025-01-14T18:00:00Z",
    current_period: null,
    ...overrides,
  };
}

function makeRow(overrides: Partial<BoxScoreRow> = {}): BoxScoreRow {
  return {
    game_id: "game-1",
    revision_id: "rev-1",
    revision_number: 1,
    revision_approved_at: "2025-01-15T10:00:00Z",
    player_id: `player-${Math.random()}`,
    player_name: "Test Player",
    player_name_latin: null,
    player_position: "G",
    team_season_id: "home-ts-1",
    team_id: "team-1",
    team_name: "Ховд",
    jersey_number: null,
    seconds_played: 1200,
    pts: 20,
    fgm: 8,
    fga: 15,
    tpm: 2,
    tpa: 5,
    ftm: 2,
    fta: 3,
    oreb: 2,
    dreb: 4,
    ast: 5,
    stl: 1,
    blk: 0,
    tov: 3,
    pf: 2,
    source_type: "official_score_sheet",
    evidence_url: null,
    source_reviewed_at: null,
    team_short: "ХОВ",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RecapHeader", () => {
  it("renders winner and margin narrative", () => {
    const game = makeGame({ home_score: 85, away_score: 72 });
    render(<RecapHeader game={game} boxScore={[]} leadChanges={3} />);

    expect(screen.getByText(/Ховд/)).toBeInTheDocument();
    expect(screen.getByText(/13/)).toBeInTheDocument();
    expect(screen.getByText(/онооны зөрүүгээр/)).toBeInTheDocument();
  });

  it("shows provisional badge for final_pending_review games", () => {
    const game = makeGame({ status: "final_pending_review" });
    render(<RecapHeader game={game} boxScore={[]} leadChanges={0} />);

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveTextContent("Урьдчилсан");
    expect(badge).toHaveAttribute("data-variant", "provisional");
  });

  it("does not show provisional badge for verified games", () => {
    const game = makeGame({ status: "official" });
    render(<RecapHeader game={game} boxScore={[]} leadChanges={0} />);

    expect(screen.queryByTestId("badge")).not.toBeInTheDocument();
  });

  it("shows lead change count when > 0", () => {
    const game = makeGame();
    render(<RecapHeader game={game} boxScore={[]} leadChanges={5} />);

    expect(screen.getByText(/5 удаа/)).toBeInTheDocument();
  });

  it("hides lead change text when 0", () => {
    const game = makeGame();
    render(<RecapHeader game={game} boxScore={[]} leadChanges={0} />);

    expect(
      screen.queryByText(/удаа илүү ээлж солигдлоо/),
    ).not.toBeInTheDocument();
  });

  it("renders top 3 performers by EFF with PlayerAvatar", () => {
    const game = makeGame();
    const rows = [
      makeRow({
        player_id: "p1",
        player_name: "Player One",
        pts: 30,
        oreb: 1,
        dreb: 5,
        ast: 4,
        stl: 2,
        blk: 1,
        tov: 2,
      }),
      makeRow({
        player_id: "p2",
        player_name: "Player Two",
        pts: 20,
        oreb: 0,
        dreb: 3,
        ast: 8,
        stl: 1,
        blk: 0,
        tov: 1,
      }),
      makeRow({
        player_id: "p3",
        player_name: "Player Three",
        pts: 15,
        oreb: 2,
        dreb: 2,
        ast: 3,
        stl: 0,
        blk: 0,
        tov: 4,
      }),
      makeRow({
        player_id: "p4",
        player_name: "Player Four",
        pts: 5,
        oreb: 0,
        dreb: 0,
        ast: 1,
        stl: 0,
        blk: 0,
        tov: 0,
      }),
    ];

    render(<RecapHeader game={game} boxScore={rows} leadChanges={0} />);

    // Player One appears in both narrative and card — two occurrences
    expect(screen.getAllByText(/Player One/)).toHaveLength(2);
    expect(screen.getByText(/Player Two/)).toBeInTheDocument();
    expect(screen.getByText(/Player Three/)).toBeInTheDocument();
    expect(screen.queryByText(/Player Four/)).not.toBeInTheDocument();

    // Mentions top scorer in narrative
    expect(
      screen.getByText(/30 оноогоор тоглолтыг тэргүүлэв/),
    ).toBeInTheDocument();
  });

  it("handles away win correctly", () => {
    const game = makeGame({ home_score: 65, away_score: 78 });
    render(<RecapHeader game={game} boxScore={[]} leadChanges={1} />);

    expect(screen.getByText(/Дархан/)).toBeInTheDocument();
    expect(screen.getByText(/13/)).toBeInTheDocument();
  });

  it("renders empty state when no box score rows", () => {
    const game = makeGame();
    render(<RecapHeader game={game} boxScore={[]} leadChanges={0} />);

    // Should render no performer cards
    expect(screen.queryByText(/PTS/)).not.toBeInTheDocument();
    // Summary text should still render
    expect(screen.getByText(/онооны зөрүүгээр/)).toBeInTheDocument();
  });
});
