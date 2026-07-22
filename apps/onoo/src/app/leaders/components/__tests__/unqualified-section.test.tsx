/// <reference types="@testing-library/jest-dom/vitest" />
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LeaderRow } from "@/app/lib/shared";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({ name }: { name: string }) => (
    <span data-testid="player-avatar">{name}</span>
  ),
}));

import { UnqualifiedSection } from "../unqualified-section";

function makePlayer(overrides: Partial<LeaderRow> = {}): LeaderRow {
  return {
    competition_id: "c1",
    competition_name: "Test",
    season_id: "s1",
    league_id: "l1",
    player_id: "p1",
    player_name: "Бат",
    player_name_latin: null,
    player_position: "PG",
    team_season_id: "ts1",
    team_id: "t1",
    team_name: "Хасууд",
    gp: 1,
    mpg: 30,
    pts: 28.0,
    fgm: 10,
    fga: 15,
    tpm: 4,
    tpa: 8,
    ftm: 4,
    fta: 5,
    oreb: 2,
    dreb: 3,
    ast: 5,
    stl: 1,
    blk: 0,
    tov: 3,
    pf: 2,
    season_name: "2026",
    league_name: "Test League",
    league_slug: "test",
    team_slug: "khasuud",
    team_short_code: "ХАС",
    team_logo_url: null,
    team_primary_color: null,
    player_photo_url: null,
    games_played: 1,
    assists_per_game: 5,
    qualified: false,
    team_games_played: 10,
    ...overrides,
  } as unknown as LeaderRow;
}

describe("UnqualifiedSection", () => {
  it("renders nothing when no unqualified players", () => {
    const { container } = render(
      <UnqualifiedSection unqualifiedPlayers={[]} statLabel="Оноо" />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows count of unqualified players", () => {
    const players = [
      makePlayer({ player_id: "p1", player_name: "Бат" }),
      makePlayer({ player_id: "p2", player_name: "Дорж" }),
    ];
    render(
      <UnqualifiedSection unqualifiedPlayers={players} statLabel="Оноо" />,
    );
    // Count should be visible in the header (always shown)
    expect(screen.getByText("Шалгуур хангаагүй (2)")).toBeInTheDocument();
  });

  it("shows games needed when expanded", () => {
    render(
      <UnqualifiedSection
        unqualifiedPlayers={[makePlayer({ gp: 1, team_games_played: 10 })]}
        statLabel="Оноо"
      />,
    );
    // Click to expand
    fireEvent.click(screen.getByText("Шалгуур хангаагүй (1)"));
    // max(3, ceil(0.5 * 10)) - 1 = max(3, 5) - 1 = 4
    expect(screen.getByText("4 тоглолт дутуу")).toBeInTheDocument();
  });

  it("shows threshold = 3 for 3-game team", () => {
    render(
      <UnqualifiedSection
        unqualifiedPlayers={[makePlayer({ gp: 0, team_games_played: 3 })]}
        statLabel="Оноо"
      />,
    );
    fireEvent.click(screen.getByText("Шалгуур хангаагүй (1)"));
    // max(3, ceil(0.5 * 3)) - 0 = max(3, 2) - 0 = 3
    expect(screen.getByText("3 тоглолт дутуу")).toBeInTheDocument();
  });

  it("toggles expanded state on click", () => {
    render(
      <UnqualifiedSection
        unqualifiedPlayers={[makePlayer({ player_name: "Бат" })]}
        statLabel="Оноо"
      />,
    );
    // Player should not be visible initially (collapsed)
    expect(screen.queryByText("Бат")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText("Шалгуур хангаагүй (1)"));
    // Player name appears in both avatar and <p>
    expect(screen.getAllByText("Бат").length).toBeGreaterThanOrEqual(1);

    // Click to collapse
    fireEvent.click(screen.getByText("Шалгуур хангаагүй (1)"));
    expect(screen.queryByText("Бат")).not.toBeInTheDocument();
  });

  it("shows player name and team code when expanded", () => {
    render(
      <UnqualifiedSection
        unqualifiedPlayers={[
          makePlayer({ player_name: "Бат", team_short_code: "ХАС" }),
        ]}
        statLabel="Оноо"
      />,
    );
    fireEvent.click(screen.getByText("Шалгуур хангаагүй (1)"));
    expect(screen.getAllByText("Бат").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("ХАС")).toBeInTheDocument();
  });
});
