/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({
    name,
    size,
  }: {
    name: string;
    size?: string;
    photoUrl?: string | null;
    primaryColor?: string | null;
  }) => (
    <span data-testid="player-avatar">
      {name} ({size})
    </span>
  ),
}));

import { RosterGrid } from "../roster-grid";

const mockPlayers = [
  {
    team_season_id: "ts1",
    competition_id: "c1",
    team_id: "t1",
    team_name: "Хасууд",
    team_slug: "khasuud",
    roster_entry_id: "re1",
    jersey_number: 10,
    roster_position: "PG",
    player_id: "p1",
    player_name: "Бат",
    player_name_latin: "Bat",
    player_position: "PG",
    photo_url: null,
    id: "p1",
    canonical_name: "Бат",
    name_latin: "Bat",
    position: "PG",
  },
  {
    team_season_id: "ts1",
    competition_id: "c1",
    team_id: "t1",
    team_name: "Хасууд",
    team_slug: "khasuud",
    roster_entry_id: "re2",
    jersey_number: 7,
    roster_position: "SG",
    player_id: "p2",
    player_name: "Дорж",
    player_name_latin: "Dorj",
    player_position: "SG",
    photo_url: null,
    id: "p2",
    canonical_name: "Дорж",
    name_latin: "Dorj",
    position: "SG",
  },
];

const mockLeaders = new Map([
  [
    "p1",
    {
      player_id: "p1",
      player_name: "Бат",
      team_id: "t1",
      team_name: "Хасууд",
      team_short_code: "ХАС",
      team_primary_color: null,
      team_slug: "khasuud",
      player_photo_url: null,
      pts: 22.5,
      ast: 5.1,
      reb: 4.3,
      oreb: 1.2,
      dreb: 3.1,
      stl: 1.5,
      blk: 0.3,
      gp: 5,
      rank_pts: 1,
      rank_ast: 2,
      rank_reb: 3,
      rank_stl: 4,
      rank_blk: 5,
    },
  ],
]);

describe("RosterGrid", () => {
  it("renders player names and jersey numbers", () => {
    render(
      <RosterGrid
        teamName="Хасууд"
        primaryColor={null}
        players={mockPlayers}
        leadersByPlayer={mockLeaders}
      />,
    );
    expect(screen.getByText("Бат")).toBeInTheDocument();
    expect(screen.getByText("Дорж")).toBeInTheDocument();
    expect(screen.getByText("#10 · PG")).toBeInTheDocument();
    expect(screen.getByText("#7 · SG")).toBeInTheDocument();
  });

  it("shows PPG for qualified players, dash for unqualified", () => {
    render(
      <RosterGrid
        teamName="Хасууд"
        primaryColor={null}
        players={mockPlayers}
        leadersByPlayer={
          new Map([
            [
              "p1",
              {
                player_id: "p1",
                player_name: "Бат",
                team_id: "t1",
                team_name: "Хасууд",
                team_short_code: "ХАС",
                team_primary_color: null,
                team_slug: "khasuud",
                player_photo_url: null,
                pts: 22.5,
                ast: 5.1,
                reb: 4.3,
                oreb: 1.2,
                dreb: 3.1,
                stl: 1.5,
                blk: 0.3,
                gp: 5,
                rank_pts: 1,
                rank_ast: 2,
                rank_reb: 3,
                rank_stl: 4,
                rank_blk: 5,
              },
            ],
          ])
        }
      />,
    );
    // First player has PPG
    const ptsElements = screen.getAllByText("22.5");
    expect(ptsElements.length).toBeGreaterThanOrEqual(1);
    // Second player gets dash
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders empty state when no players", () => {
    render(
      <RosterGrid
        teamName="Хасууд"
        primaryColor={null}
        players={[]}
        leadersByPlayer={new Map()}
      />,
    );
    expect(screen.getByText("Бүрэлдэхүүн нийтлэгдээгүй")).toBeInTheDocument();
  });

  it("renders player avatar for each player", () => {
    render(
      <RosterGrid
        teamName="Хасууд"
        primaryColor={null}
        players={mockPlayers}
        leadersByPlayer={mockLeaders}
      />,
    );
    const avatars = screen.getAllByTestId("player-avatar");
    expect(avatars).toHaveLength(2);
    expect(avatars[0]).toHaveTextContent("md");
  });

  it("links to correct player pages", () => {
    render(
      <RosterGrid
        teamName="Хасууд"
        primaryColor={null}
        players={mockPlayers}
        leadersByPlayer={mockLeaders}
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/players/p1");
    expect(links[1]).toHaveAttribute("href", "/players/p2");
  });

  it("uses grid-cols-2 base and md:grid-cols-4 classes", () => {
    const { container } = render(
      <RosterGrid
        teamName="Хасууд"
        primaryColor={null}
        players={mockPlayers}
        leadersByPlayer={mockLeaders}
      />,
    );
    const grid = container.querySelector(".grid");
    expect(grid?.classList.contains("grid-cols-2")).toBe(true);
    expect(grid?.classList.contains("md:grid-cols-4")).toBe(true);
  });

  it("shows jersey · position format", () => {
    render(
      <RosterGrid
        teamName="Хасууд"
        primaryColor={null}
        players={mockPlayers}
        leadersByPlayer={mockLeaders}
      />,
    );
    expect(screen.getByText(/#10 · PG/)).toBeInTheDocument();
    expect(screen.getByText(/#7 · SG/)).toBeInTheDocument();
  });

  it("handles null jersey number and position", () => {
    const playerNoJersey = {
      ...mockPlayers[0],
      jersey_number: null,
      roster_position: null,
      position: null,
    };
    render(
      <RosterGrid
        teamName="Хасууд"
        primaryColor={null}
        players={[playerNoJersey]}
        leadersByPlayer={new Map()}
      />,
    );
    expect(screen.getByText(/#— · Байрлалгүй/)).toBeInTheDocument();
  });
});
