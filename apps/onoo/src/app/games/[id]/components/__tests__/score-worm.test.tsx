/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock Recharts completely to avoid SVG/rendering issues in jsdom
vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  CartesianGrid: () => null,
  ReferenceLine: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

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
}));

vi.mock("@/components/ui/chart", () => ({
  ChartContainer: ({
    children,
    config,
    className,
  }: {
    children: React.ReactNode;
    config: unknown;
    className?: string;
  }) => (
    <div data-testid="chart-container" className={className}>
      {children}
    </div>
  ),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));

import type { PlayByPlayRow } from "../../../lib/shared";
import { ScoreWorm } from "../score-worm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<PlayByPlayRow> = {}): PlayByPlayRow {
  return {
    game_id: "game-1",
    event_id: `evt-${Math.random()}`,
    operation_id: "op-1",
    local_seq: 1,
    event_type: "shot_2pt_made",
    period: 1,
    clock_seconds: 600,
    team_season_id: "home-ts-1",
    team_name: "Ховд",
    player_id: "player-1",
    player_name: "Player One",
    player_name_latin: null,
    jersey_number: null,
    payload: null,
    created_at: "2025-01-14T18:00:00Z",
    ...overrides,
  };
}

function defaultProps() {
  return {
    homeTeamSeasonId: "home-ts-1",
    homeTeamShortCode: "ХОВ",
    awayTeamShortCode: "ДАР",
    homeTeamColor: "#ff0000",
    awayTeamColor: "#0000ff",
    homeScore: 85,
    awayScore: 72,
    leadChanges: 3,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ScoreWorm", () => {
  it("renders section title and team labels", () => {
    const events = [makeEvent()];
    render(<ScoreWorm events={events} {...defaultProps()} />);

    expect(screen.getAllByText("Илүү ээлжийн урсгал")).toHaveLength(2);
    expect(screen.getByText("ХОВ")).toBeInTheDocument();
    expect(screen.getByText("ДАР")).toBeInTheDocument();
  });

  it("shows lead change count", () => {
    const events = [makeEvent()];
    render(<ScoreWorm events={events} {...defaultProps()} />);

    expect(screen.getByText("3 удаа солигдлоо")).toBeInTheDocument();
  });

  it("shows final score line", () => {
    const events = [makeEvent()];
    render(<ScoreWorm events={events} {...defaultProps()} />);

    expect(screen.getByText("ХОВ 85 — 72 ДАР")).toBeInTheDocument();
  });

  it("renders with empty events", () => {
    render(<ScoreWorm events={[]} {...defaultProps()} />);

    // Should still render header and score
    expect(screen.getAllByText("Илүү ээлжийн урсгал")).toHaveLength(2);
    expect(screen.getByText("ХОВ 85 — 72 ДАР")).toBeInTheDocument();
  });

  it("handles null team colors gracefully", () => {
    const events = [makeEvent()];
    render(
      <ScoreWorm
        events={events}
        {...defaultProps()}
        homeTeamColor={null}
        awayTeamColor={null}
      />,
    );

    expect(screen.getAllByText("Илүү ээлжийн урсгал")).toHaveLength(2);
  });

  it("renders chart container for data", () => {
    const events = [makeEvent({ event_type: "shot_3pt_made" })];
    render(<ScoreWorm events={events} {...defaultProps()} />);

    expect(screen.getByTestId("chart-container")).toBeInTheDocument();
  });
});
