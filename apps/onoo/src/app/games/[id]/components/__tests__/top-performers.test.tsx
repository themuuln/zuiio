/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/components/ui", () => ({
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
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="card-description">{children}</p>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="card-title">{children}</h3>
  ),
}));

vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({
    name,
    size,
    primaryColor,
  }: {
    name: string;
    size?: string;
    primaryColor?: string | null;
  }) => (
    <div
      data-testid="player-avatar"
      data-name={name}
      data-size={size}
      data-primary-color={primaryColor}
    />
  ),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...inputs: (string | undefined | null | false)[]) =>
    inputs.filter(Boolean).join(" "),
}));

vi.mock("../../../lib/summaries", () => ({
  generatePlayerGameSummary: vi.fn(
    (stats: { player_name: string }) => `${stats.player_name} тоглогчийн дүн`,
  ),
}));

import type { BoxScoreRow } from "../../../lib/shared";
import {
  getTopPodium,
  PlayerHighlights,
  TopPerformers,
} from "../top-performers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    pts: 10,
    fgm: 4,
    fga: 10,
    tpm: 1,
    tpa: 3,
    ftm: 1,
    fta: 2,
    oreb: 1,
    dreb: 3,
    ast: 2,
    stl: 0,
    blk: 0,
    tov: 1,
    pf: 2,
    source_type: "official_score_sheet",
    evidence_url: null,
    source_reviewed_at: null,
    team_short: "ХОВ",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Unit: getTopPodium
// ---------------------------------------------------------------------------

describe("getTopPodium", () => {
  it("returns top 3 by weighted score", () => {
    const rows = [
      makeRow({
        player_id: "p1",
        player_name: "High Scorer",
        pts: 30,
        oreb: 2,
        dreb: 3,
        ast: 5,
      }),
      makeRow({
        player_id: "p2",
        player_name: "Medium",
        pts: 15,
        oreb: 0,
        dreb: 2,
        ast: 3,
      }),
      makeRow({
        player_id: "p3",
        player_name: "Low",
        pts: 5,
        oreb: 0,
        dreb: 1,
        ast: 1,
      }),
      makeRow({
        player_id: "p4",
        player_name: "Should Not Appear",
        pts: 2,
        ast: 0,
      }),
    ];

    const result = getTopPodium(rows);
    expect(result).toHaveLength(3);
    expect(result[0].player_name).toBe("High Scorer");
    expect(result[1].player_name).toBe("Medium");
    expect(result[2].player_name).toBe("Low");
  });

  it("returns empty array when given empty rows", () => {
    expect(getTopPodium([])).toEqual([]);
  });

  it("returns fewer than 3 when given fewer rows", () => {
    const rows = [makeRow({ player_id: "p1" })];
    expect(getTopPodium(rows)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// TopPerformers
// ---------------------------------------------------------------------------

describe("TopPerformers", () => {
  const defaultProps = {
    homeTeamSeasonId: "home-ts-1",
    homeTeamPrimaryColor: "#ff0000",
    awayTeamPrimaryColor: "#0000ff",
  };

  it("renders podium with 3 players", () => {
    const rows = [
      makeRow({
        player_id: "p1",
        player_name: "Amar",
        pts: 30,
        team_season_id: "home-ts-1",
      }),
      makeRow({
        player_id: "p2",
        player_name: "Bold",
        pts: 20,
        team_season_id: "away-ts-1",
      }),
      makeRow({
        player_id: "p3",
        player_name: "Chimed",
        pts: 15,
        team_season_id: "home-ts-1",
      }),
    ];

    render(<TopPerformers rows={rows} {...defaultProps} />);
    expect(screen.getByText(/Amar/)).toBeInTheDocument();
    expect(screen.getByText(/Bold/)).toBeInTheDocument();
    expect(screen.getByText(/Chimed/)).toBeInTheDocument();
  });

  it("highlights 1st place with larger size", () => {
    const rows = [
      makeRow({
        player_id: "p1",
        player_name: "Best Player",
        pts: 40,
      }),
      makeRow({
        player_id: "p2",
        player_name: "Second Player",
        pts: 20,
      }),
    ];

    render(<TopPerformers rows={rows} {...defaultProps} />);

    const avatars = screen.getAllByTestId("player-avatar");
    const bestAvatar = avatars.find(
      (a) => a.getAttribute("data-name") === "Best Player",
    );
    expect(bestAvatar).toHaveAttribute("data-size", "lg");
  });

  it("shows empty message when no rows", () => {
    render(<TopPerformers rows={[]} {...defaultProps} />);
    expect(
      screen.getByText("Тоглогчийн мөр хараахан нийтлэгдээгүй байна."),
    ).toBeInTheDocument();
  });

  it("renders with 2 players (3rd slot hidden)", () => {
    const rows = [
      makeRow({ player_id: "p1", player_name: "First", pts: 30 }),
      makeRow({ player_id: "p2", player_name: "Second", pts: 20 }),
    ];

    render(<TopPerformers rows={rows} {...defaultProps} />);
    expect(screen.getByText(/First/)).toBeInTheDocument();
    expect(screen.getByText(/Second/)).toBeInTheDocument();
    // Player 3 should not exist
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PlayerHighlights
// ---------------------------------------------------------------------------

describe("PlayerHighlights", () => {
  const defaultProps = {
    homeTeamSeasonId: "home-ts-1",
    awayTeamSeasonId: "away-ts-1",
    homeWon: true,
    homeScore: 85,
    awayScore: 72,
    homeTeamShortCode: "ХОВ",
    awayTeamShortCode: "ДАР",
    homeTeamPrimaryColor: "#ff0000",
    awayTeamPrimaryColor: "#0000ff",
  };

  it("renders highlight cards for top 3 performers", () => {
    const rows = [
      makeRow({
        player_id: "p1",
        player_name: "Player One",
        pts: 30,
        team_season_id: "home-ts-1",
      }),
      makeRow({
        player_id: "p2",
        player_name: "Player Two",
        pts: 20,
        team_season_id: "away-ts-1",
      }),
      makeRow({
        player_id: "p3",
        player_name: "Player Three",
        pts: 15,
        team_season_id: "home-ts-1",
      }),
    ];

    render(<PlayerHighlights rows={rows} {...defaultProps} />);

    expect(screen.getAllByText(/Тоглогчдын онцлох үе/)).toHaveLength(2);
    expect(screen.getByText("Player One")).toBeInTheDocument();
    expect(screen.getByText("Player Two")).toBeInTheDocument();
    expect(screen.getByText("Player Three")).toBeInTheDocument();
  });

  it("returns null when no rows", () => {
    const { container } = render(
      <PlayerHighlights rows={[]} {...defaultProps} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders stat line with PTS/REB/AST/STL/BLK", () => {
    const rows = [
      makeRow({
        player_id: "p1",
        player_name: "Stat King",
        pts: 25,
        oreb: 3,
        dreb: 7,
        ast: 8,
        stl: 2,
        blk: 1,
      }),
    ];

    render(<PlayerHighlights rows={rows} {...defaultProps} />);

    // Summary: "Stat King 25 оноо цохиж, багтаа ялалт авлаа"
    // Stat line: "25 оноо · 10 самбар · 8 дамжуулалт · 2 таслалт · 1 хаалт"
    expect(screen.getAllByText(/25 оноо/)).toHaveLength(2);
    expect(screen.getByText(/10 самбар/)).toBeInTheDocument();
    expect(screen.getByText(/8 дамжуулалт/)).toBeInTheDocument();
    expect(screen.getByText(/2 таслалт/)).toBeInTheDocument();
    expect(screen.getByText(/1 хаалт/)).toBeInTheDocument();
  });
});
