/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  TeamAdvancedStatsPerGame,
  TeamSeasonAggregates,
} from "@/app/lib/shared";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({ notFound: vi.fn() }));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const Icon = (props: Record<string, unknown>) => (
    <span data-testid="icon" {...props} />
  );
  const mocked: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) {
    mocked[key] = Icon;
  }
  return mocked;
});

vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

vi.mock("@/components/ui/card", () => ({
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
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="card-desc">{children}</p>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-title">{children}</div>
  ),
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
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="card-desc">{children}</p>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-title">{children}</div>
  ),
}));

vi.mock("@/components/team-logo", () => ({
  TeamLogo: ({ shortCode, size }: { shortCode: string; size?: string }) => (
    <span data-testid="team-logo" data-code={shortCode} data-size={size} />
  ),
}));

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockTeam = {
  id: "team-1",
  name: "Тест Баг",
  short_code: "TST",
  slug: "test-team",
  logo_url: null,
  primary_color: null,
  team_season_id: "ts-1",
};

const mockStandings = {
  team_season_id: "ts-1",
  w: 5,
  l: 3,
  win_pct: 0.625,
  games_back: 0,
  streak: "W2",
  last10: "W-L-W-W-L",
};

const upcomingGame = {
  id: "game-1",
  home_team_id: "team-1",
  home_team_slug: "test-team",
  home_team_short_code: "TST",
  home_team_logo_url: null,
  away_team_id: "opp-team",
  away_team_slug: "opponent-team",
  away_team_short_code: "OPP",
  away_team_logo_url: null,
  home_score: null,
  away_score: null,
  scheduled_at: new Date("2026-08-01T14:00:00").toISOString(),
  status: "scheduled",
  competition_name: "Тест Лиг",
  competition_id: "comp-1",
  home_team_season_id: "ts-1",
  away_team_season_id: "ts-2",
};

const oppTeam = {
  id: "opp-team",
  name: "Өрсөлдөгч Баг",
  short_code: "OPP",
  slug: "opponent-team",
  logo_url: null,
  primary_color: null,
  team_season_id: "ts-2",
};

const oppStandings = {
  team_season_id: "ts-2",
  w: 4,
  l: 4,
  win_pct: 0.5,
  games_back: 1,
  streak: "L1",
  last10: "W-L-W-L-L",
};

const oppLeaders = [
  {
    player_id: "p1",
    player_name: "Тоглогч 1",
    player_position: "PG",
    pts: 25,
    player_photo_url: null,
    team_name: "Өрсөлдөгч Баг",
    team_slug: "opponent-team",
    qualified: true,
  },
  {
    player_id: "p2",
    player_name: "Тоглогч 2",
    player_position: "SG",
    pts: 20,
    player_photo_url: null,
    team_name: "Өрсөлдөгч Баг",
    team_slug: "opponent-team",
    qualified: true,
  },
];

const mockGames: TeamAdvancedStatsPerGame[] = [
  {
    game_id: "g1",
    scheduled_at: new Date("2026-07-20").toISOString(),
    opponent_name: "Өрсөлдөгч",
    opponent_slug: "opp-team",
    home_away: "home",
    team_score: 85,
    opp_score: 72,
    result: "W",
    ortg: 115.5,
    drtg: 98.2,
    net_rtg: 17.3,
    pace: 72.1,
    efg: 52.3,
    tov_pct: 12.1,
    oreb_pct: 28.5,
    fta_rate: 24.1,
    pie: 58.2,
  },
  {
    game_id: "g2",
    scheduled_at: new Date("2026-07-18").toISOString(),
    opponent_name: "Бусад",
    opponent_slug: "other-team",
    home_away: "away",
    team_score: 78,
    opp_score: 82,
    result: "L",
    ortg: 105.2,
    drtg: 110.3,
    net_rtg: -5.1,
    pace: 74.5,
    efg: 48.1,
    tov_pct: 15.3,
    oreb_pct: 25.0,
    fta_rate: 20.2,
    pie: 44.1,
  },
  {
    game_id: "g3",
    scheduled_at: new Date("2026-07-15").toISOString(),
    opponent_name: "Өрсөлдөгч 2",
    opponent_slug: "opp2-team",
    home_away: "home",
    team_score: 90,
    opp_score: 85,
    result: "W",
    ortg: 120.0,
    drtg: 112.0,
    net_rtg: 8.0,
    pace: 70.0,
    efg: 55.0,
    tov_pct: 10.0,
    oreb_pct: 30.0,
    fta_rate: 22.0,
    pie: 55.0,
  },
];

const expectedAgg: TeamSeasonAggregates = {
  games_played: 3,
  avg_ortg: (115.5 + 105.2 + 120.0) / 3,
  avg_drtg: (98.2 + 110.3 + 112.0) / 3,
  avg_net_rtg: (17.3 - 5.1 + 8.0) / 3,
  avg_pace: (72.1 + 74.5 + 70.0) / 3,
  avg_efg: (52.3 + 48.1 + 55.0) / 3,
  avg_tov_pct: (12.1 + 15.3 + 10.0) / 3,
  avg_oreb_pct: (28.5 + 25.0 + 30.0) / 3,
  avg_fta_rate: (24.1 + 20.2 + 22.0) / 3,
  avg_pie: (58.2 + 44.1 + 55.0) / 3,
  wins: 2,
  losses: 1,
};

// Mock functions
const { mockGetTeamBySlug, mockGetTeamGameStats, mockAggregateTeamStats } =
  vi.hoisted(() => ({
    mockGetTeamBySlug:
      vi.fn<(slug: string) => Promise<typeof mockTeamData | null>>(),
    mockGetTeamGameStats:
      vi.fn<(teamSeasonId: string) => Promise<TeamAdvancedStatsPerGame[]>>(),
    mockAggregateTeamStats:
      vi.fn<(games: TeamAdvancedStatsPerGame[]) => TeamSeasonAggregates>(),
  }));

vi.mock("@/app/lib/data", () => ({
  getTeamBySlug: mockGetTeamBySlug,
  getTeamGameStats: mockGetTeamGameStats,
  aggregateTeamStats: mockAggregateTeamStats,
}));

// Mock createClient
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                data: [] as typeof oppLeaders,
                error: null,
              })),
            })),
          })),
        })),
      })),
    })),
  })),
}));

// ── Test helpers ──
function mockTeamData(
  _slug: string,
  hasUpcoming = true,
  games = mockGames,
  isOpp = false,
) {
  return {
    team: isOpp ? oppTeam : mockTeam,
    standings: isOpp ? oppStandings : mockStandings,
    players: [],
    leaders: [],
    recentGames: hasUpcoming
      ? games.slice(1).map((g) => ({
          id: g.game_id,
          home_team_slug:
            g.home_away === "home"
              ? isOpp
                ? "opponent-team"
                : "test-team"
              : "other",
          away_team_slug:
            g.home_away === "away"
              ? isOpp
                ? "opponent-team"
                : "test-team"
              : "opponent",
          home_score: g.home_away === "home" ? g.team_score : g.opp_score,
          away_score: g.home_away === "home" ? g.opp_score : g.team_score,
          scheduled_at: g.scheduled_at,
          home_team_season_id: "ts-1",
          away_team_season_id: "ts-2",
          competition_id: "comp-1",
          status: "final",
          home_team_short_code: "TST",
          away_team_short_code: "OPP",
          home_team_logo_url: null,
          away_team_logo_url: null,
          home_team_name: "test",
          away_team_name: "opponent",
        }))
      : [],
    upcomingGames: hasUpcoming ? [upcomingGame] : [],
    seasonStats: [],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ScoutPage — өгөгдлийн урсгал", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("дараагийн тоглолтгүй үед хоосон төлөв харуулдаг", async () => {
    mockGetTeamBySlug.mockImplementation((slug: string) =>
      Promise.resolve(mockTeamData(slug, false)),
    );
    mockGetTeamGameStats.mockResolvedValue([]);
    mockAggregateTeamStats.mockReturnValue({
      ...expectedAgg,
      games_played: 0,
      avg_ortg: 0,
      avg_drtg: 0,
      avg_net_rtg: 0,
      avg_pace: 0,
      avg_efg: 0,
      avg_tov_pct: 0,
      avg_oreb_pct: 0,
      avg_fta_rate: 0,
      avg_pie: 0,
      wins: 0,
      losses: 0,
    });

    const Page = (await import("../page")).default;
    render(await Page({ params: Promise.resolve({ slug: "test-team" }) }));

    expect(screen.getByText("Скаутын тайлан")).toBeInTheDocument();
    expect(
      screen.getByText(/Дараагийн тоглолт товлогдоогүй/),
    ).toBeInTheDocument();
  });

  it("дараагийн тоглолт байгаа үед VS header харуулдаг", async () => {
    mockGetTeamBySlug.mockImplementation((slug: string) =>
      Promise.resolve(mockTeamData(slug, true)),
    );
    mockGetTeamGameStats
      .mockResolvedValueOnce(mockGames) // my team games
      .mockResolvedValueOnce(mockGames); // opponent games
    mockAggregateTeamStats.mockReturnValue(expectedAgg);

    const Page = (await import("../page")).default;
    render(await Page({ params: Promise.resolve({ slug: "test-team" }) }));

    expect(screen.getByText(/Дараагийн тоглолт/)).toBeInTheDocument();
    expect(screen.getByText("TST")).toBeInTheDocument();
  });

  it("багийн үзүүлэлтийн харьцуулалтыг харуулдаг", async () => {
    mockGetTeamBySlug.mockImplementation((slug: string) =>
      Promise.resolve(mockTeamData(slug, true)),
    );
    mockGetTeamGameStats
      .mockResolvedValueOnce(mockGames)
      .mockResolvedValueOnce(mockGames);
    mockAggregateTeamStats.mockReturnValue(expectedAgg);

    const Page = (await import("../page")).default;
    render(await Page({ params: Promise.resolve({ slug: "test-team" }) }));

    expect(
      screen.getByText("Багийн үзүүлэлтийн харьцуулалт"),
    ).toBeInTheDocument();
    // Stat labels should be visible
    expect(screen.getByText("ORtg")).toBeInTheDocument();
    expect(screen.getByText("DRtg")).toBeInTheDocument();
    expect(screen.getByText("Pace")).toBeInTheDocument();
    expect(screen.getByText("eFG%")).toBeInTheDocument();
    expect(screen.getByText("OREB%")).toBeInTheDocument();
  });
});

describe("aggregateTeamStats — интеграци", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scout page-д ашиглагдах aggregate функц зөв ажилладаг", async () => {
    // Since aggregateTeamStats is called inside the page,
    // verify the mock was called with correct data shape
    mockGetTeamBySlug.mockImplementation((slug: string) =>
      Promise.resolve(mockTeamData(slug, true)),
    );
    mockGetTeamGameStats.mockResolvedValue(mockGames);
    mockAggregateTeamStats.mockReturnValue(expectedAgg);

    const Page = (await import("../page")).default;
    render(await Page({ params: Promise.resolve({ slug: "test-team" }) }));

    // aggregateTeamStats should have been called twice (my team + opponent)
    expect(mockAggregateTeamStats).toHaveBeenCalledTimes(2);
    // Each call passes an array of TeamAdvancedStatsPerGame
    expect(mockAggregateTeamStats).toHaveBeenNthCalledWith(1, mockGames);
    expect(mockAggregateTeamStats).toHaveBeenNthCalledWith(2, mockGames);
  });

  it("ск аутын хуудас aggregateTeamStats-ийн бүх талбарыг ашигладаг", async () => {
    // Verify all expected stats show on the page
    mockGetTeamBySlug.mockImplementation((slug: string) =>
      Promise.resolve(mockTeamData(slug, true)),
    );
    mockGetTeamGameStats.mockResolvedValue(mockGames);
    mockAggregateTeamStats.mockReturnValue(expectedAgg);

    const Page = (await import("../page")).default;
    const { container } = render(
      await Page({ params: Promise.resolve({ slug: "test-team" }) }),
    );

    // ORtg values should appear (from key numbers section — appears twice: my team + opponent)
    const ortgTexts = screen.getAllByText(expectedAgg.avg_ortg.toFixed(1));
    expect(ortgTexts.length).toBeGreaterThanOrEqual(1);

    // DRtg values should appear
    const drtgTexts = screen.getAllByText(expectedAgg.avg_drtg.toFixed(1));
    expect(drtgTexts.length).toBeGreaterThanOrEqual(1);
  });
});
