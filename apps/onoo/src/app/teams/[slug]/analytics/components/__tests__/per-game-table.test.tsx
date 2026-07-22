/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    className,
    variant,
  }: {
    children?: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

vi.mock("@/components/ui/table", () => ({
  Table: ({ children }: { children: React.ReactNode }) => (
    <table data-testid="table">{children}</table>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody data-testid="table-body">{children}</tbody>
  ),
  TableCell: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <td data-testid="table-cell" className={className}>
      {children}
    </td>
  ),
  TableHead: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <th data-testid="table-head" className={className}>
      {children}
    </th>
  ),
  TableHeader: ({ children }: { children: React.ReactNode }) => (
    <thead data-testid="table-header">{children}</thead>
  ),
  TableRow: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <tr data-testid="table-row" className={className}>
      {children}
    </tr>
  ),
}));

// ---------------------------------------------------------------------------
// Component under test
// ---------------------------------------------------------------------------

import type { TeamAdvancedStatsPerGame } from "@/app/lib/shared";
import { PerGameTable } from "../per-game-table";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function createGame(
  overrides: Partial<TeamAdvancedStatsPerGame> & { game_id: string },
): TeamAdvancedStatsPerGame {
  return {
    scheduled_at: "2026-07-15T12:00:00Z",
    opponent_name: "Хасууд",
    opponent_slug: "khasuud",
    home_away: "home",
    team_score: 85,
    opp_score: 72,
    result: "W",
    ortg: 115.5,
    drtg: 98.2,
    net_rtg: 17.3,
    pace: 95.8,
    efg: 0.525,
    tov_pct: 12.3,
    oreb_pct: 28.5,
    fta_rate: 0.225,
    pie: 58.2,
    ...overrides,
  };
}

const mockGames: TeamAdvancedStatsPerGame[] = [
  createGame({
    game_id: "1",
    opponent_name: "Хасууд",
    opponent_slug: "khasuud",
    home_away: "home",
    team_score: 85,
    opp_score: 72,
    result: "W",
    ortg: 115.5,
    drtg: 98.2,
    net_rtg: 17.3,
    pace: 95.8,
    pie: 58.2,
  }),
  createGame({
    game_id: "2",
    opponent_name: "Говь",
    opponent_slug: "govi",
    home_away: "away",
    team_score: 64,
    opp_score: 78,
    result: "L",
    ortg: 92.1,
    drtg: 110.4,
    net_rtg: -18.3,
    pace: 88.6,
    pie: 42.1,
  }),
  createGame({
    game_id: "3",
    opponent_name: "Шонхорууд",
    opponent_slug: "shonkhoruud",
    home_away: "home",
    team_score: 91,
    opp_score: 88,
    result: "W",
    ortg: 120.3,
    drtg: 105.7,
    net_rtg: 14.6,
    pace: 102.1,
    pie: 55.0,
  }),
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PerGameTable", () => {
  it("shows empty state when no games provided", () => {
    render(<PerGameTable games={[]} />);
    expect(
      screen.getByText("Тоглолтын өгөгдөл байхгүй байна."),
    ).toBeInTheDocument();
  });

  it("renders all table headers", () => {
    render(<PerGameTable games={mockGames} />);
    expect(screen.getByText("Өдөр")).toBeInTheDocument();
    expect(screen.getByText("Өрсөлдөгч")).toBeInTheDocument();
    expect(screen.getByText("Үр дүн")).toBeInTheDocument();
    expect(screen.getByText("Оноо")).toBeInTheDocument();
    expect(screen.getByText("ORtg")).toBeInTheDocument();
    expect(screen.getByText("DRtg")).toBeInTheDocument();
    expect(screen.getByText("NetRtg")).toBeInTheDocument();
    expect(screen.getByText("Pace")).toBeInTheDocument();
    expect(screen.getByText("PIE")).toBeInTheDocument();
  });

  it("renders one header row and one data row per game", () => {
    render(<PerGameTable games={mockGames} />);
    const rows = screen.getAllByTestId("table-row");
    // 1 header row + 3 game rows = 4 total
    expect(rows).toHaveLength(4);
  });

  it("links opponent name to their team page", () => {
    render(<PerGameTable games={mockGames} />);
    const link = screen.getByText(/vs Хасууд/).closest("a");
    expect(link).toHaveAttribute("href", "/teams/khasuud");
  });

  it("shows home prefix vs before opponent name", () => {
    render(<PerGameTable games={mockGames} />);
    expect(screen.getByText(/vs Хасууд/)).toBeInTheDocument();
  });

  it("shows away prefix @ before opponent name", () => {
    render(<PerGameTable games={mockGames} />);
    expect(screen.getByText(/@ Говь/)).toBeInTheDocument();
  });

  it("shows ЯЛАЛТ badge for wins", () => {
    render(<PerGameTable games={mockGames} />);
    const badges = screen.getAllByTestId("badge");
    // Game 1 and 3 are wins
    expect(badges[0]).toHaveTextContent("ЯЛАЛТ");
    expect(badges[2]).toHaveTextContent("ЯЛАЛТ");
  });

  it("shows ЯЛАГДАЛ badge for losses", () => {
    render(<PerGameTable games={mockGames} />);
    const badges = screen.getAllByTestId("badge");
    // Game 2 is a loss
    expect(badges[1]).toHaveTextContent("ЯЛАГДАЛ");
  });

  it("formats score as XX–YY", () => {
    render(<PerGameTable games={mockGames} />);
    // Game 1: 85–72
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
  });

  it("renders ORtg with toFixed(1)", () => {
    render(<PerGameTable games={mockGames} />);
    expect(screen.getByText("115.5")).toBeInTheDocument();
    expect(screen.getByText("92.1")).toBeInTheDocument();
  });

  it("renders DRtg with toFixed(1)", () => {
    render(<PerGameTable games={mockGames} />);
    expect(screen.getByText("98.2")).toBeInTheDocument();
    expect(screen.getByText("110.4")).toBeInTheDocument();
  });

  it("renders Pace with toFixed(1)", () => {
    render(<PerGameTable games={mockGames} />);
    expect(screen.getByText("95.8")).toBeInTheDocument();
    expect(screen.getByText("88.6")).toBeInTheDocument();
  });

  it("renders PIE with toFixed(1)", () => {
    render(<PerGameTable games={mockGames} />);
    expect(screen.getByText("58.2")).toBeInTheDocument();
    expect(screen.getByText("42.1")).toBeInTheDocument();
  });

  it("formats positive NetRtg with + sign", () => {
    render(<PerGameTable games={mockGames} />);
    expect(screen.getByText("+17.3")).toBeInTheDocument();
    expect(screen.getByText("+14.6")).toBeInTheDocument();
  });

  it("formats negative NetRtg without + sign", () => {
    render(<PerGameTable games={mockGames} />);
    expect(screen.getByText("-18.3")).toBeInTheDocument();
  });
  it("formats date from scheduled_at using mn-MN locale", () => {
    render(<PerGameTable games={mockGames} />);
    // The mn-MN locale renders July as "VII" (Roman numeral)
    const dates = screen.getAllByText(/VII\/15/);
    expect(dates).toHaveLength(3);
  });

  it("shows proper Badge variant for wins (default) and losses (secondary)", () => {
    render(<PerGameTable games={mockGames} />);
    const badges = screen.getAllByTestId("badge");
    expect(badges[0]).toHaveAttribute("data-variant", "default");
    expect(badges[1]).toHaveAttribute("data-variant", "secondary");
  });

  it("applies className when provided", () => {
    const { container } = render(
      <PerGameTable games={mockGames} className="test-class" />,
    );
    // The outermost element is the Card wrapper
    expect(container.firstChild).toHaveClass("test-class");
  });
});
