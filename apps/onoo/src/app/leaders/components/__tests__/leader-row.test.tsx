/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next/link — renders a plain <a> so we can assert href
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// Mock PlayerAvatar — renders a placeholder with the player name for testing
vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({
    name,
  }: {
    name: string;
    photoUrl?: string | null;
    primaryColor?: string | null;
  }) => <span data-testid="player-avatar">{name}</span>,
}));

import type { LeaderRow } from "@/app/lib/shared";
import { CompactLeaderRow } from "../leader-row";

function makeLeader(overrides: Partial<LeaderRow> = {}): LeaderRow {
  return {
    competition_id: "c1",
    competition_name: "Test League",
    season_id: "s1",
    league_id: "l1",
    player_id: "p1",
    player_name: "Tsetsegiin Tömörtsög",
    player_name_latin: "Tsetsegiin Tömörtsög",
    player_position: "G",
    team_season_id: "ts1",
    team_id: "t1",
    team_name: "Хасууд",
    gp: 10,
    mpg: 30,
    pts: 25,
    fgm: 8.5,
    fga: 15,
    tpm: 3,
    tpa: 7,
    ftm: 5,
    fta: 6,
    oreb: 2,
    dreb: 5,
    ast: 6,
    stl: 1.5,
    blk: 0.5,
    tov: 3,
    pf: 2,
    player_latin: null,
    team_short: "ХАС",
    team_color: "#e63946",
    seconds_played: 1800,
    player_photo_url: null,
    team_primary_color: "#e63946",
    team_logo_url: null,
    team_short_code: "ХАС",
    photo_url: null,
    points_per_game: 25,
    rebounds_per_game: 7,
    assists_per_game: 6,
    team_slug: "khasuud",
    games_played: 10,
    qualified: true,
    team_games_played: 10,
    ...overrides,
  };
}

describe("CompactLeaderRow", () => {
  it("renders the rank number", () => {
    render(
      <CompactLeaderRow leader={makeLeader()} rank={3} statValue={25.0} />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the player name", () => {
    render(
      <CompactLeaderRow
        leader={makeLeader({ player_name: "Bat-Erdene Batzorig" })}
        rank={1}
        statValue={30.5}
      />,
    );
    expect(screen.getAllByText("Bat-Erdene Batzorig").length).toBeGreaterThan(
      0,
    );
  });

  it("renders the stat value formatted with toFixed(1)", () => {
    render(
      <CompactLeaderRow leader={makeLeader()} rank={5} statValue={12.333} />,
    );
    // toFixed(1) => "12.3"
    expect(screen.getByText("12.3")).toBeInTheDocument();
  });

  it("links to /players/[player_id]", () => {
    render(
      <CompactLeaderRow
        leader={makeLeader({ player_id: "p-abc-123" })}
        rank={2}
        statValue={18.0}
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/players/p-abc-123");
  });
});
