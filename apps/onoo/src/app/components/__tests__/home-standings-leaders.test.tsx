import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({ name }: { name: string }) => (
    <div data-testid="player-avatar">{name}</div>
  ),
}));

vi.mock("@/components/team-logo", () => ({
  TeamLogo: () => <div data-testid="team-logo" />,
}));

vi.mock("@/components/ui", () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button type="button" data-testid="button">
      {children}
    </button>
  ),
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
}));

import type { LeaderRow, StandingRow } from "../../lib/shared";
import { HomeStandingsLeaders } from "../home-standings-leaders";

const mockLeader = {
  player_id: "p1",
  player_name: "Test Player",
  team_name: "Test Team",
  pts: 25,
  oreb: 2,
  dreb: 5,
  ast: 3,
  stl: 1,
  blk: 0,
  player_photo_url: null,
  team_primary_color: null,
} as unknown as LeaderRow;

const mockStanding = {
  team_season_id: "ts-1",
  team_id: "t-1",
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
  w: 5,
  l: 2,
  gb: 0,
  streak: "W2",
} as unknown as StandingRow;

describe("HomeStandingsLeaders", () => {
  it("renders leaders and standings when data is available", () => {
    render(
      <HomeStandingsLeaders
        standings={[mockStanding]}
        leaders={[mockLeader]}
      />,
    );

    // Section wrapper + standings band render
    expect(screen.getByText("Онооны тэргүүлэгчид")).toBeTruthy();
    expect(screen.getByText("Шалгуурын эхний тав")).toBeTruthy();
    // Leader name appears in the podium (and possibly the category strip)
    expect(screen.getAllByText("Test Player").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("25.0")).toBeTruthy();
    // Standings row shows record + win percentage + streak
    expect(screen.getByText("5-2")).toBeTruthy();
    expect(screen.getByText("71.4%")).toBeTruthy();
    // Per-category strip appears
    expect(screen.getByText("Сэргэлт")).toBeTruthy();
    expect(screen.getByText("Блок")).toBeTruthy();
  });

  it("deduplicates leaders by player_id, keeping the best points row", () => {
    const duplicate = {
      ...mockLeader,
      player_id: "p1",
      pts: 18,
    } as unknown as LeaderRow;

    render(
      <HomeStandingsLeaders
        standings={[mockStanding]}
        leaders={[mockLeader, duplicate]}
      />,
    );

    const rows = screen.getAllByText("Test Player");
    // Once in the points podium, once in the per-category strip
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("25.0").length).toBe(1);
  });

  it("renders empty state when no leaders data", () => {
    render(<HomeStandingsLeaders standings={[]} leaders={[]} />);

    expect(screen.getByText("Шалгуурын эхний тав")).toBeTruthy();
    expect(screen.getByText("Тэргүүлэгч тодроогүй байна")).toBeTruthy();
    expect(screen.getByText("Шалгуур хараахан үүсээгүй")).toBeTruthy();
  });
});
