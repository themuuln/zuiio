/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next/navigation and next/link
vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// Mock TeamLogo — simple display
vi.mock("@/components/team-logo", () => ({
  TeamLogo: ({ shortCode }: { shortCode: string }) => (
    <span data-testid="team-logo">{shortCode}</span>
  ),
}));

// Mock date-fns-tz
vi.mock("date-fns-tz", () => ({
  formatInTimeZone: () => "19:00",
}));

import type { GameWithTeams } from "@/app/lib/shared";
import { GameCard } from "../game-card";

function makeGame(overrides: Partial<GameWithTeams> = {}): GameWithTeams {
  return {
    id: "game-1",
    status: "scheduled",
    scheduled_at: "2026-07-22T11:00:00Z",
    home_team_name: "Хасууд",
    home_team_short_code: "ХАС",
    home_team_logo_url: null,
    home_team_primary_color: "#e63946",
    home_team_slug: "khasuud",
    home_score: null,
    away_team_name: "Арслангууд",
    away_team_short_code: "АРС",
    away_team_logo_url: null,
    away_team_primary_color: "#1d3557",
    away_team_slug: "arslanuud",
    away_score: null,
    venue_name: "Төв цэнгэлдэх",
    competition_name: "Test League",
    season_id: "s1",
    season_name: "2026",
    league_id: "l1",
    league_name: "Test League",
    league_slug: "test",
    revision_id: "r1",
    revision_number: 1,
    revision_approved_at: "2026-07-22T12:00:00Z",
    source_submission_id: "ss1",
    source_type: "web",
    evidence_url: null,
    source_reviewer_id: "usr1",
    source_reviewed_at: "2026-07-22T12:00:00Z",
    home_team_season_id: "ts1",
    away_team_season_id: "ts2",
    home_name: "Хасууд",
    home_short: "ХАС",
    home_color: null,
    away_name: "Арслангууд",
    away_short: "АРС",
    away_color: null,
    venue_city: null,
    is_provisional: false,
    home_team_id: "t1",
    ...overrides,
  };
}

describe("GameCard", () => {
  it("shows start time for scheduled games", () => {
    render(<GameCard game={makeGame()} />);
    expect(screen.getByText("ХАС")).toBeInTheDocument();
    expect(screen.getByText("АРС")).toBeInTheDocument();
    expect(screen.getByText("19:00")).toBeInTheDocument();
  });

  it("shows scores for finished games with winner bold", () => {
    const game = makeGame({
      status: "league_verified",
      home_score: 85,
      away_score: 72,
    });
    render(<GameCard game={game} showWinner />);
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("Эцсийн")).toBeInTheDocument();
  });

  it("shows LIVE pulse chip for live games", () => {
    const game = makeGame({
      status: "live_provisional",
      home_score: 42,
      away_score: 38,
    });
    render(<GameCard game={game} showWinner={false} />);
    expect(screen.getByText("Шууд")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("38")).toBeInTheDocument();
  });

  it("links to game detail page", () => {
    render(<GameCard game={makeGame()} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/games/game-1");
  });
  it("shows Урьдчилсан badge for provisional final_pending_review game", () => {
    const game = makeGame({
      status: "final_pending_review",
      is_provisional: true,
      home_score: 72,
      away_score: 65,
    });
    render(<GameCard game={game} showWinner={false} />);
    expect(screen.getByText("Дууссан · Урьдчилсан")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument();
  });

  it("shows Live indicator for provisional live game", () => {
    const game = makeGame({
      status: "live_provisional",
      is_provisional: true,
      home_score: 42,
      away_score: 38,
    });
    render(<GameCard game={game} showWinner={false} />);
    expect(screen.getByText("Шууд")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("38")).toBeInTheDocument();
  });

  it("shows outline badge for non-provisional final_pending_review", () => {
    const game = makeGame({
      status: "final_pending_review",
      is_provisional: false,
      home_score: 55,
      away_score: 50,
    });
    render(<GameCard game={game} showWinner={false} />);
    expect(screen.getByText("Дууссан")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });
});
