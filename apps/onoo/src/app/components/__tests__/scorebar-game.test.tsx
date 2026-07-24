import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next/image — TeamLogo renders it when a logo URL is present.
vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string; [k: string]: unknown }) => (
    // biome-ignore lint/performance/noImgElement: test mock, not production
    <img src={props.src} alt={props.alt} />
  ),
}));

// Mock next/link — render a plain anchor so href is inspectable.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import type { GameWithTeams } from "../../lib/shared";
import { ScorebarGame } from "../scorebar-game";

function makeGame(overrides: Partial<GameWithTeams>): GameWithTeams {
  return {
    id: "game-1",
    status: "scheduled",
    scheduled_at: "2026-07-22T18:00:00Z",
    home_team_name: "Hawks",
    home_team_short_code: "HWK",
    home_team_logo_url: null,
    home_team_primary_color: null,
    home_score: null,
    away_team_name: "Bulls",
    away_team_short_code: "BUL",
    away_team_logo_url: null,
    away_team_primary_color: null,
    away_score: null,
    is_provisional: false,
    ...overrides,
  } as unknown as GameWithTeams;
}

describe("ScorebarGame", () => {
  it("links to the game detail page", () => {
    render(<ScorebarGame game={makeGame({ id: "abc" })} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/games/abc");
  });

  it("shows scores and the live label for a live game", () => {
    render(
      <ScorebarGame
        game={makeGame({
          status: "live_provisional",
          home_score: 89,
          away_score: 85,
        })}
      />,
    );
    expect(screen.getByText("89")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("Шууд")).toBeInTheDocument();
  });

  it("shows final scores without a time", () => {
    render(
      <ScorebarGame
        game={makeGame({
          status: "league_verified",
          home_score: 101,
          away_score: 95,
        })}
      />,
    );
    expect(screen.getByText("101")).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
    // No em-dash placeholders once a final score exists.
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });

  it("shows tip-off time and dashes for a scheduled game", () => {
    render(<ScorebarGame game={makeGame({ status: "scheduled" })} />);
    // Two em-dash placeholders, one per team, before tip-off.
    expect(screen.getAllByText("—")).toHaveLength(2);
    // Status labels are not shown for scheduled games in the scorebar.
    expect(screen.queryByText("Шууд")).not.toBeInTheDocument();
  });
});
