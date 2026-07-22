/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/leaders"),
}));

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
    ...props
  }: {
    name: string;
    [key: string]: unknown;
  }) => <span data-testid="player-avatar">{name}</span>,
}));

vi.mock("@/components/team-logo", () => ({
  TeamLogo: () => <span data-testid="team-logo" />,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <span className={className}>{children}</span>,
}));

vi.mock("lucide-react", () => ({
  Trophy: () => <span data-testid="icon-trophy" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  Users: () => <span data-testid="icon-users" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronUp: () => <span data-testid="icon-chevron-up" />,
}));

vi.mock("@/components/ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
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

// ---------------------------------------------------------------------------
// Mock data — created via vi.hoisted so it's available to both the factory
// below and test assertions.
// ---------------------------------------------------------------------------

const { mockLeaders, mockMvpCandidates } = vi.hoisted(() => {
  const leaders: Array<Record<string, unknown>> = [];

  // 10 leaders in competition "comp-1" (Монголын сагсан бөмбөгийн лиг)
  for (let i = 1; i <= 10; i++) {
    leaders.push({
      competition_id: "comp-1",
      competition_name: "Монголын сагсан бөмбөгийн лиг",
      season_id: "season-1",
      league_id: "league-1",
      player_id: `player-${i}`,
      player_name: `Тоглогч ${i}`,
      player_name_latin: `Player ${i}`,
      player_position: i % 2 === 0 ? "G" : "F",
      team_season_id: "ts-1",
      team_id: "team-1",
      team_name: "Баг 1",
      gp: 10,
      mpg: 30,
      pts: 36 - i * 3,
      fgm: 10,
      fga: 20,
      tpm: 3,
      tpa: 8,
      ftm: 5,
      fta: 6,
      oreb: 2,
      dreb: 5,
      ast: 10 - i,
      stl: 5 - Math.floor(i / 3),
      blk: 3 - Math.floor(i / 4),
      tov: 2,
      pf: 2,
      player_latin: `Player ${i}`,
      team_short: "БАГ",
      team_color: "#e63946",
      seconds_played: 1800,
      player_photo_url: null,
      team_primary_color: "#e63946",
      team_logo_url: null,
      team_short_code: "БАГ",
      photo_url: null,
      points_per_game: 10 + i,
      rebounds_per_game: 7,
      assists_per_game: 5,
      team_slug: "bag-1",
      games_played: 10,
      qualified: true,
      team_games_played: 10,
    });
  }

  // 3 leaders in competition "comp-2" (Монголын багын аварга)
  for (let i = 11; i <= 13; i++) {
    leaders.push({
      competition_id: "comp-2",
      competition_name: "Монголын багын аварга",
      season_id: "season-2",
      league_id: "league-2",
      player_id: `player-${i}`,
      player_name: `Тоглогч ${i}`,
      player_name_latin: `Player ${i}`,
      player_position: "G",
      team_season_id: "ts-2",
      team_id: "team-2",
      team_name: "Баг 2",
      gp: 8,
      mpg: 28,
      pts: 32 - (i - 11) * 4,
      fgm: 8,
      fga: 16,
      tpm: 2,
      tpa: 6,
      ftm: 4,
      fta: 5,
      oreb: 1,
      dreb: 4,
      ast: 6,
      stl: 3,
      blk: 1,
      tov: 2,
      pf: 1,
      player_latin: `Player ${i}`,
      team_short: "БА2",
      team_color: "#1d3557",
      seconds_played: 1440,
      player_photo_url: null,
      team_primary_color: "#1d3557",
      team_logo_url: null,
      team_short_code: "БА2",
      photo_url: null,
      points_per_game: 8,
      rebounds_per_game: 5,
      assists_per_game: 3,
      team_slug: "bag-2",
      games_played: 8,
      qualified: true,
      team_games_played: 8,
    });
  }

  const mvpCandidates = [
    {
      player_id: "player-1",
      canonical_name: "Тоглогч 1",
      team_short_code: "БАГ",
      photo_url: null,
      eff: 28.5,
      pts: 33,
      reb: 7,
      ast: 9,
      stl: 5,
      blk: 3,
      tov: 2,
      gp: 10,
      team_primary_color: "#e63946",
      team_slug: "bag-1",
    },
    {
      player_id: "player-2",
      canonical_name: "Тоглогч 2",
      team_short_code: "БАГ",
      photo_url: null,
      eff: 25.0,
      pts: 30,
      reb: 7,
      ast: 8,
      stl: 5,
      blk: 3,
      tov: 2,
      gp: 10,
      team_primary_color: "#e63946",
      team_slug: "bag-1",
    },
    {
      player_id: "player-3",
      canonical_name: "Тоглогч 3",
      team_short_code: "БАГ",
      photo_url: null,
      eff: 22.0,
      pts: 27,
      reb: 7,
      ast: 7,
      stl: 4,
      blk: 2,
      tov: 2,
      gp: 10,
      team_primary_color: "#e63946",
      team_slug: "bag-1",
    },
  ];

  return { mockLeaders: leaders, mockMvpCandidates: mvpCandidates };
});

vi.mock("@/app/lib/data", () => ({
  getLeaders: vi.fn((includeUnqualified?: boolean) =>
    Promise.resolve(
      includeUnqualified
        ? mockLeaders
        : mockLeaders.filter((r: Record<string, unknown>) => r.qualified),
    ),
  ),
  getMvpRace: vi.fn().mockResolvedValue(mockMvpCandidates),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import LeadersPage from "../page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function renderPage(searchParams?: Record<string, string>) {
  return render(
    await LeadersPage({ searchParams: Promise.resolve(searchParams ?? {}) }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LeadersPage", () => {
  it("renders header and default stat tab is pts", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", { name: "Тэргүүлэгчид" }),
    ).toBeInTheDocument();

    const tabsNav = screen.getByRole("navigation", {
      name: "Үзүүлэлт сонгох",
    });
    const tabLinks = tabsNav.querySelectorAll("a");
    expect(tabLinks.length).toBe(5);

    expect(tabLinks[0]).toHaveAttribute(
      "href",
      expect.stringContaining("stat=pts"),
    );
  });

  it("renders podium and leader rows when data exists", async () => {
    await renderPage();

    const avatars = screen.getAllByTestId("player-avatar");
    // 3 (podium) + 7 (rows 4-10) + 3 (MVP race) = 13 total
    expect(avatars.length).toBe(13);

    const names = avatars.map((el) => el.textContent);
    expect(names.slice(0, 3)).toEqual(["Тоглогч 1", "Тоглогч 2", "Тоглогч 3"]);
  });

  it("renders competition selector with multiple competitions", async () => {
    await renderPage();

    const compNav = screen.getByRole("navigation", {
      name: "Тэмцээн сонгох",
    });
    expect(compNav).toBeInTheDocument();

    const compLinks = compNav.querySelectorAll("a");
    expect(compLinks.length).toBe(2);

    expect(compLinks[0]).toHaveAttribute(
      "href",
      expect.stringContaining("competition=comp-1"),
    );
  });

  it("renders all stat tabs with correct stat parameters", async () => {
    await renderPage();

    const tabsNav = screen.getByRole("navigation", {
      name: "Үзүүлэлт сонгох",
    });
    const tabLinks = tabsNav.querySelectorAll("a");

    const expected = ["pts", "reb", "ast", "stl", "blk"];
    tabLinks.forEach((link, i) => {
      expect(link).toHaveAttribute(
        "href",
        expect.stringContaining(`stat=${expected[i]}`),
      );
    });
  });
  it("renders MVP race section", async () => {
    await renderPage();

    expect(screen.getByText("MVP уралдаан")).toBeInTheDocument();
    // Names appear in both podium and MVP race section
    expect(screen.getAllByText("Тоглогч 1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Тоглогч 2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Тоглогч 3").length).toBeGreaterThanOrEqual(1);
  });
});
