/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const Icon = ({ className, ...rest }: { className?: string }) => (
    <span data-testid="icon" className={className} {...rest} />
  );
  const mocked: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) {
    mocked[key] = Icon;
  }
  return mocked;
});

// Mock PlayerAvatar
vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({ name, size }: { name: string; size?: string }) => (
    <span data-testid="player-avatar" data-size={size}>
      {name}
    </span>
  ),
}));

// Mock TeamLogo
vi.mock("@/components/team-logo", () => ({
  TeamLogo: ({ shortCode }: { shortCode: string }) => (
    <span data-testid="team-logo">{shortCode}</span>
  ),
}));

// Mock UI card
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="card" {...props}>
      {children as React.ReactNode}
    </div>
  ),
  CardContent: ({ children }: Record<string, unknown>) => (
    <div data-testid="card-content">{children as React.ReactNode}</div>
  ),
  CardHeader: ({ children }: Record<string, unknown>) => (
    <div data-testid="card-header">{children as React.ReactNode}</div>
  ),
  CardTitle: ({ children }: Record<string, unknown>) => (
    <div data-testid="card-title">{children as React.ReactNode}</div>
  ),
}));

// Mock Badge
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: Record<string, unknown>) => (
    <span data-testid="badge">{children as React.ReactNode}</span>
  ),
}));

// Mock Button
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: Record<string, unknown>) => (
    <button onClick={onClick as () => void} {...props}>
      {children as React.ReactNode}
    </button>
  ),
}));

import type { MvpCandidate, PlayerOfTheWeek } from "../award-card";
import { AwardCards } from "../award-card";

function makePlayerOfTheWeek(
  overrides: Partial<PlayerOfTheWeek> = {},
): PlayerOfTheWeek {
  return {
    player_id: "player-1",
    player_name: "Баатар",
    player_name_latin: "Baatar",
    player_photo_url: null,
    team_name: "Хасууд",
    team_short_code: "ХАС",
    team_primary_color: "#e63946",
    team_logo_url: null,
    team_slug: "khasuud",
    pts: 28.5,
    reb: 8.2,
    ast: 6.1,
    stl: 2.3,
    blk: 1.1,
    gp: 10,
    score: 45.2,
    ...overrides,
  };
}

function makeMvpCandidate(overrides: Partial<MvpCandidate> = {}): MvpCandidate {
  return {
    player_id: "player-1",
    player_name: "Баатар",
    player_name_latin: "Baatar",
    player_photo_url: null,
    team_name: "Хасууд",
    team_short_code: "ХАС",
    team_primary_color: "#e63946",
    team_logo_url: null,
    team_slug: "khasuud",
    pts: 28.5,
    reb: 8.2,
    ast: 6.1,
    stl: 2.3,
    blk: 1.1,
    gp: 10,
    cumulativeScore: 452,
    ...overrides,
  };
}

function makeMvpTop5(): MvpCandidate[] {
  return [
    makeMvpCandidate({
      player_id: "player-1",
      player_name: "Баатар",
      cumulativeScore: 452,
    }),
    makeMvpCandidate({
      player_id: "player-2",
      player_name: "Мөнхбат",
      cumulativeScore: 380,
    }),
    makeMvpCandidate({
      player_id: "player-3",
      player_name: "Болд",
      cumulativeScore: 340,
    }),
    makeMvpCandidate({
      player_id: "player-4",
      player_name: "Ганзориг",
      cumulativeScore: 290,
    }),
    makeMvpCandidate({
      player_id: "player-5",
      player_name: "Энхтүвшин",
      cumulativeScore: 250,
    }),
  ];
}

describe("AwardCards", () => {
  it("renders Player of the Week card when potw is provided", () => {
    const potw = makePlayerOfTheWeek();
    render(<AwardCards potw={potw} mvpTop5={[]} />);
    expect(screen.getByText("ИЛДЭР ТОГЛОГЧ")).toBeInTheDocument();
    expect(screen.getAllByText(potw.player_name).length).toBeGreaterThan(0);
    expect(screen.getByText(potw.team_name)).toBeInTheDocument();
  });

  it("renders stat pills with player stats", () => {
    const potw = makePlayerOfTheWeek({
      pts: 30,
      reb: 10,
      ast: 8,
      stl: 3,
      blk: 2,
    });
    render(<AwardCards potw={potw} mvpTop5={[]} />);
    expect(screen.getByText("Оноо")).toBeInTheDocument();
    expect(screen.getByText("Давсан")).toBeInTheDocument();
    expect(screen.getByText("Олгосон")).toBeInTheDocument();
    expect(screen.getByText("Булаасан")).toBeInTheDocument();
    expect(screen.getByText("Хаасан")).toBeInTheDocument();
  });

  it("renders games played badge", () => {
    const potw = makePlayerOfTheWeek({ gp: 12 });
    render(<AwardCards potw={potw} mvpTop5={[]} />);
    expect(screen.getByText("12 тоглолт")).toBeInTheDocument();
  });

  it("renders Share button for POTW", () => {
    const potw = makePlayerOfTheWeek();
    render(<AwardCards potw={potw} mvpTop5={[]} />);
    expect(screen.getByText("Нийтлэх")).toBeInTheDocument();
  });

  it("renders MVP race section when candidates provided", () => {
    const potw = makePlayerOfTheWeek();
    render(<AwardCards potw={potw} mvpTop5={makeMvpTop5()} />);
    expect(screen.getByText("MVP УРАЛДААН")).toBeInTheDocument();
  });

  it("renders top 3 players on the podium", () => {
    const potw = makePlayerOfTheWeek();
    render(<AwardCards potw={potw} mvpTop5={makeMvpTop5()} />);
    expect(screen.getAllByText("Баатар").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Мөнхбат").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Болд").length).toBeGreaterThan(0);
  });

  it("renders 4th and 5th place as rows", () => {
    const potw = makePlayerOfTheWeek();
    render(<AwardCards potw={potw} mvpTop5={makeMvpTop5()} />);
    expect(screen.getAllByText("Ганзориг").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Энхтүвшин").length).toBeGreaterThan(0);
  });

  it("renders cumulative scores for podium players", () => {
    const potw = makePlayerOfTheWeek();
    render(<AwardCards potw={potw} mvpTop5={makeMvpTop5()} />);
    // Cumulative scores as integers (toFixed(0))
    expect(screen.getByText("452")).toBeInTheDocument();
    expect(screen.getByText("380")).toBeInTheDocument();
    expect(screen.getByText("340")).toBeInTheDocument();
  });

  it("shows empty state when no potw and empty mvpTop5", () => {
    render(<AwardCards potw={null} mvpTop5={[]} />);
    expect(screen.getByText("Мэдээлэл байхгүй байна")).toBeInTheDocument();
  });

  it("still renders POTW section even if mvpTop5 is empty", () => {
    const potw = makePlayerOfTheWeek();
    render(<AwardCards potw={potw} mvpTop5={[]} />);
    expect(screen.getByText("ИЛДЭР ТОГЛОГЧ")).toBeInTheDocument();
    expect(screen.queryByText("MVP УРАЛДААН")).not.toBeInTheDocument();
  });

  it("renders MVP race without POTW when potw is null", () => {
    render(<AwardCards potw={null} mvpTop5={makeMvpTop5()} />);
    expect(screen.queryByText("ИЛДЭР ТОГЛОГЧ")).not.toBeInTheDocument();
    expect(screen.getByText("MVP УРАЛДААН")).toBeInTheDocument();
  });

  it("renders player name in latin when available", () => {
    const potw = makePlayerOfTheWeek({ player_name_latin: "Baatar" });
    render(<AwardCards potw={potw} mvpTop5={[]} />);
    expect(screen.getByText("Baatar")).toBeInTheDocument();
  });

  it("POTW link goes to player detail page", () => {
    const potw = makePlayerOfTheWeek({ player_id: "player-123" });
    render(<AwardCards potw={potw} mvpTop5={[]} />);
    const links = screen.getAllByRole("link");
    const playerLink = links.find(
      (l) => l.getAttribute("href") === "/players/player-123",
    );
    expect(playerLink).toBeInTheDocument();
  });

  it("POTW team link goes to team page", () => {
    const potw = makePlayerOfTheWeek({ team_slug: "khasuud" });
    render(<AwardCards potw={potw} mvpTop5={[]} />);
    const links = screen.getAllByRole("link");
    const teamLink = links.find(
      (l) => l.getAttribute("href") === "/teams/khasuud",
    );
    expect(teamLink).toBeInTheDocument();
  });
});

describe("MvpPodium", () => {
  it("renders medals for top 3", () => {
    const potw = makePlayerOfTheWeek();
    render(<AwardCards potw={potw} mvpTop5={makeMvpTop5()} />);
    // Podium renders all top-3 names
    expect(screen.getAllByText("Баатар").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Мөнхбат").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Болд").length).toBeGreaterThan(0);
  });
});

describe("MvpRow", () => {
  it("renders rank numbers for 4th and 5th", () => {
    const potw = makePlayerOfTheWeek();
    render(<AwardCards potw={potw} mvpTop5={makeMvpTop5()} />);
    // Only 4th and 5th get rank indicators in rows
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("links 4th place to player page", () => {
    const potw = makePlayerOfTheWeek();
    render(<AwardCards potw={potw} mvpTop5={makeMvpTop5()} />);
    const links = screen.getAllByRole("link");
    const player4Link = links.find(
      (l) => l.getAttribute("href") === "/players/player-4",
    );
    expect(player4Link).toBeInTheDocument();
  });
});
