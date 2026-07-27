/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LeaderRow } from "@/app/lib/shared";

// ---------------------------------------------------------------------------
// Hoisted mock functions — accessible from both factory closures and tests
// ---------------------------------------------------------------------------

const {
  mockGetPlayers,
  mockGetPlayerById,
  mockGetPlayerCompetitions,
  mockGetPlayerShootingProfile,
  mockGetLeagueAverages,
  mockGetPlayerCareerTotals,
  mockGetPlayerGameLog,
  mockGetPlayerAwards,
  mockGetPlayerShotZones,
  mockGetPlayerShotScatter,
  mockFormatMinutes,
  mockAggregateMonthlyStats,
  mockDetectMilestones,
  mockNotFound,
} = vi.hoisted(() => ({
  mockGetPlayers:
    vi.fn<
      (
        includeUnqualified?: boolean,
        searchQuery?: string,
      ) => Promise<LeaderRow[]>
    >(),
  mockGetPlayerById:
    vi.fn<(id: string) => Promise<Record<string, unknown> | null>>(),
  mockGetPlayerCompetitions: vi.fn<
    (playerId: string) => Promise<Array<Record<string, unknown>>>
  >(() => Promise.resolve([])),
  mockGetPlayerShootingProfile: vi.fn<
    (
      playerId: string,
      competitionId: string,
    ) => Promise<Record<string, unknown> | null>
  >(() => Promise.resolve(null)),
  mockGetLeagueAverages: vi.fn<
    (competitionId: string) => Promise<Record<string, unknown> | null>
  >(() => Promise.resolve(null)),
  mockGetPlayerCareerTotals: vi.fn<
    (playerId: string) => Promise<Record<string, unknown> | null>
  >(() => Promise.resolve(null)),
  mockGetPlayerGameLog: vi.fn<
    (
      playerId: string,
      competitionId?: string | null,
    ) => Promise<Record<string, unknown>[]>
  >(() => Promise.resolve([])),
  mockGetPlayerAwards: vi.fn<
    (playerId: string) => Promise<Record<string, unknown>[]>
  >(() => Promise.resolve([])),
  mockGetPlayerShotZones: vi.fn<
    (
      playerId: string,
      competitionId: string,
    ) => Promise<Record<string, unknown>[]>
  >(() => Promise.resolve([])),
  mockGetPlayerShotScatter: vi.fn<
    (
      playerId: string,
      competitionId?: string | null,
    ) => Promise<Record<string, unknown>[]>
  >(() => Promise.resolve([])),
  mockFormatMinutes: vi.fn((_seconds: number | null) => "12:00"),
  mockAggregateMonthlyStats: vi.fn(() => []),
  mockDetectMilestones: vi.fn(() => []),
  mockNotFound: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Static mock data
// ---------------------------------------------------------------------------

const mockPlayers: LeaderRow[] = [
  {
    competition_id: "comp-1",
    competition_name: "Монголын сагсан бөмбөгийн лиг",
    season_id: "season-1",
    league_id: "league-1",
    player_id: "player-1",
    player_name: "Бат-Эрдэнэ",
    player_name_latin: "Bat-Erdene",
    player_position: "PG",
    team_season_id: "ts-1",
    team_id: "team-1",
    team_name: "Хасууд",
    gp: 10,
    mpg: 28.5,
    pts: 183,
    fgm: 62,
    fga: 121,
    tpm: 21,
    tpa: 53,
    ftm: 38,
    fta: 42,
    oreb: 12,
    dreb: 35,
    ast: 57,
    stl: 13,
    blk: 4,
    tov: 21,
    pf: 18,
    player_latin: "Bat-Erdene",
    team_short: "ХАС",
    team_color: null,
    seconds_played: 17100,
    player_photo_url: null,
    team_primary_color: null,
    team_logo_url: null,
    team_short_code: "ХАС",
    photo_url: null,
    points_per_game: 18.3,
    rebounds_per_game: 4.7,
    assists_per_game: 5.7,
    team_slug: "khasuud",
    games_played: 10,
    qualified: true,
    team_games_played: 15,
  },
  {
    competition_id: "comp-1",
    competition_name: "Монголын сагсан бөмбөгийн лиг",
    season_id: "season-1",
    league_id: "league-1",
    player_id: "player-2",
    player_name: "Ганболд",
    player_name_latin: "Ganbold",
    player_position: "SF",
    team_season_id: "ts-2",
    team_id: "team-2",
    team_name: "Арслангууд",
    gp: 12,
    mpg: 32.1,
    pts: 260,
    fgm: 95,
    fga: 180,
    tpm: 30,
    tpa: 72,
    ftm: 40,
    fta: 50,
    oreb: 20,
    dreb: 50,
    ast: 35,
    stl: 18,
    blk: 8,
    tov: 25,
    pf: 15,
    player_latin: "Ganbold",
    team_short: "АРС",
    team_color: null,
    seconds_played: 23112,
    player_photo_url: null,
    team_primary_color: null,
    team_logo_url: null,
    team_short_code: "АРС",
    photo_url: null,
    points_per_game: 21.7,
    rebounds_per_game: 5.8,
    assists_per_game: 2.9,
    team_slug: "arslanuud",
    games_played: 12,
    qualified: true,
    team_games_played: 15,
  },
];

const mockPlayerProfile = {
  player_id: "player-1",
  player_name: "Бат-Эрдэнэ",
  player_name_latin: "Bat-Erdene",
  dob: null,
  height_cm: null,
  weight_kg: null,
  player_position: "PG",
  nationality: "Mongolia",
  photo_url: null,
  social_links: {},
  team_season_id: "ts-1",
  team_id: "t1",
  team_name: "Хасууд",
  team_slug: "khasuud",
  team_logo_url: null,
  competition_id: "comp-1",
  competition_name: "Монголын сагсан бөмбөгийн лиг",
  season_id: "season-1",
  season_name: "2026",
  league_id: "l1",
  league_name: "Test League",
  league_slug: "test",
  jersey_number: 7,
  games_played: 10,
  minutes_per_game: 28.5,
  points_per_game: 18.3,
  fgm_per_game: 6.2,
  fga_per_game: 12.1,
  tpm_per_game: 2.1,
  tpa_per_game: 5.3,
  ftm_per_game: 3.8,
  ftp_per_game: 4.2,
  oreb_per_game: 1.2,
  dreb_per_game: 3.5,
  ast_per_game: 5.7,
  stl_per_game: 1.3,
  blk_per_game: 0.4,
  tov_per_game: 2.1,
  pf_per_game: 1.8,
  canonical_name: "Бат-Эрдэнэ",
  name_latin: "Bat-Erdene",
  position: "PG",
};

const mockCompetitions = [
  {
    competition_id: "comp-1",
    competition_name: "Монголын сагсан бөмбөгийн лиг",
    season_name: "2026",
    league_name: "Test League",
  },
];

// ---------------------------------------------------------------------------
// Module mocks (runs before any import)
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({ notFound: mockNotFound }));

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

vi.mock("lucide-react", () => ({
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  ChartNoAxesCombined: () => <span data-testid="icon-chart" />,
  Medal: () => <span data-testid="icon-medal" />,
  ScrollText: () => <span data-testid="icon-scroll" />,
  TableProperties: () => <span data-testid="icon-table" />,
  Target: () => <span data-testid="icon-target" />,
  TrendingUp: () => <span data-testid="icon-trending-up" />,
  Share2: () => <span data-testid="icon-share" />,
  Loader2: () => <span data-testid="icon-loader" />,
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    HydrationBoundary: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useQuery: vi.fn(),
    useQueryClient: vi.fn(() => ({
      getQueryData: vi.fn(),
      prefetchQuery: vi.fn(),
      invalidateQueries: vi.fn(),
    })),
    dehydrate: vi.fn(() => ({ mutations: [], queries: [] })),
  };
});

vi.mock("@/app/lib/data", () => ({
  getPlayers: mockGetPlayers,
  getPlayerById: mockGetPlayerById,
  getPlayerCompetitions: mockGetPlayerCompetitions,
  getPlayerShootingProfile: mockGetPlayerShootingProfile,
  getLeagueAverages: mockGetLeagueAverages,
  getPlayerCareerTotals: mockGetPlayerCareerTotals,
  getPlayerGameLog: mockGetPlayerGameLog,
  getPlayerAwards: mockGetPlayerAwards,
  getPlayerShotZones: mockGetPlayerShotZones,
  getPlayerShotScatter: mockGetPlayerShotScatter,
  formatMinutes: mockFormatMinutes,
  aggregateMonthlyStats: mockAggregateMonthlyStats,
}));

vi.mock("@onoo/core", () => ({
  detectMilestones: mockDetectMilestones,
  getStatLabel: vi.fn((stat: string, _locale?: string) => stat.toUpperCase()),
}));

vi.mock("@/components/view-beacon", () => ({
  ViewBeacon: () => null,
}));

vi.mock("@/components/report-error-dialog", () => ({
  ReportErrorDialog: () => null,
}));

vi.mock("../[id]/components/hero-card", () => ({
  HeroCard: ({ playerId, locale }: { playerId: string; locale: string }) => (
    <div data-testid="hero-card">
      {`hero-card playerId=${playerId} locale=${locale}`}
    </div>
  ),
}));

vi.mock("../[id]/components/stat-card", () => ({
  default: ({
    playerName,
    teamName,
    seasonLabel,
  }: {
    playerName: string;
    teamName: string;
    seasonLabel: string;
  }) => (
    <div data-testid="stat-card">
      {`stat-card name=${playerName} team=${teamName} season=${seasonLabel}`}
    </div>
  ),
  StatCard: ({
    playerName,
    teamName,
    seasonLabel,
  }: {
    playerName: string;
    teamName: string;
    seasonLabel: string;
  }) => (
    <div data-testid="stat-card">
      {`stat-card name=${playerName} team=${teamName} season=${seasonLabel}`}
    </div>
  ),
}));

vi.mock("../[id]/components/recent-games", () => ({
  RecentGames: () => <div data-testid="recent-games" />,
}));

vi.mock("../[id]/components/best-worst-games", () => ({
  BestWorstGames: () => <div data-testid="best-worst-games" />,
}));

vi.mock("../[id]/components/motion-wrapper", () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-reveal">{children}</div>
  ),
}));

vi.mock("../[id]/components/season-selector", () => ({
  SeasonSelector: () => <div data-testid="season-selector" />,
}));

vi.mock("../[id]/components/advanced-stats-table", () => ({
  AdvancedStatsTable: () => <div data-testid="advanced-stats-table" />,
}));

vi.mock("../[id]/components/milestones", () => ({
  Milestones: () => <div data-testid="milestones" />,
}));

vi.mock("../[id]/components/awards-shelf", () => ({
  AwardsShelf: () => <div data-testid="awards-shelf" />,
}));

vi.mock("../[id]/components/athlete-timeline", () => ({
  AthleteTimeline: () => <div data-testid="athlete-timeline" />,
}));

vi.mock("../[id]/components/shot-chart", () => ({
  ShotChart: () => <div data-testid="shot-chart" />,
}));

vi.mock("../[id]/components/chart-sections", () => ({
  SeasonArc: () => <div data-testid="season-arc" />,
  SkillRadar: () => <div data-testid="skill-radar" />,
  ShootingProfile: () => <div data-testid="shooting-profile" />,
  FormTrends: () => <div data-testid="form-trends" />,
  HomeAwaySplits: () => <div data-testid="home-away-splits" />,
  MonthlyProgression: () => <div data-testid="monthly-progression" />,
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({
    children,
    defaultValue,
  }: {
    children: React.ReactNode;
    defaultValue: string;
  }) => (
    <div data-testid="tabs" data-default={defaultValue}>
      {children}
    </div>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <button data-testid={`tab-trigger-${value}`} type="button">
      {children}
    </button>
  ),
  TabsContent: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-testid={`tab-content-${value}`}>{children}</div>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-title">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

vi.mock("@/app/components/language-toggle", () => ({
  LanguageToggle: () => <div data-testid="language-toggle" />,
}));

vi.mock("../components/player-grid", () => ({
  PlayerGrid: ({
    players,
    initialSearch,
  }: {
    players: LeaderRow[];
    initialSearch: string;
  }) => (
    <div
      data-testid="player-grid"
      data-players={players.length}
      data-search={initialSearch}
    >
      {players.map((p) => (
        <div key={p.player_id}>{p.player_name}</div>
      ))}
    </div>
  ),
  PlayerGridSkeleton: () => <div data-testid="player-grid-skeleton" />,
}));

// ---------------------------------------------------------------------------
// Tests — dynamic import for async Server Components
// ---------------------------------------------------------------------------

describe("Players list page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlayers.mockResolvedValue(mockPlayers);
  });

  it("renders the hero header with title and description", async () => {
    const Page = (await import("../page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Тоглогчид")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Тоглогчоо нэр, баг, байрлалаар олж улирлын гүйцэтгэл болон бүрэн тоглолтын түүхийг нь үзээрэй.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Тамирчдын түүх")).toBeInTheDocument();
  });

  it("renders SuspendedPlayerGrid and calls getPlayers", async () => {
    const Page = (await import("../page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(mockGetPlayers).toHaveBeenCalledWith(false, undefined);
  });
});

// ---------------------------------------------------------------------------
// Player detail page tests
// ---------------------------------------------------------------------------

describe("Player detail page", () => {
  const mockPlayerData = {
    player: mockPlayerProfile,
    profiles: [mockPlayerProfile],
    seasonStats: [],
    gameLog: [],
  };

  const mockGameLines = [
    {
      game_id: "g1",
      revision_id: "r1",
      revision_number: 1,
      revision_approved_at: "2026-07-01T00:00:00Z",
      player_id: "player-1",
      player_name: "Бат-Эрдэнэ",
      player_name_latin: "Bat-Erdene",
      player_position: "PG",
      team_season_id: "ts-1",
      team_id: "t1",
      team_name: "Хасууд",
      jersey_number: 7,
      pts: 25,
      fgm: 10,
      fga: 18,
      tpm: 3,
      tpa: 6,
      ftm: 2,
      fta: 2,
      oreb: 1,
      dreb: 5,
      ast: 4,
      stl: 2,
      blk: 0,
      tov: 3,
      pf: 2,
      seconds_played: 1440,
      source_type: "web",
      evidence_url: null,
      source_reviewed_at: "2026-07-01T00:00:00Z",
      team_short: "ХАС",
      game_date: "2026-07-01T00:00:00Z",
      opponent_name: "Арслангууд",
      opponent_short_code: "АРС",
      opponent_logo_url: null,
      team_score: 85,
      opponent_score: 72,
      result: "W" as const,
      is_home: true,
    },
    {
      game_id: "g2",
      revision_id: "r2",
      revision_number: 1,
      revision_approved_at: "2026-07-05T00:00:00Z",
      player_id: "player-1",
      player_name: "Бат-Эрдэнэ",
      player_name_latin: "Bat-Erdene",
      player_position: "PG",
      team_season_id: "ts-1",
      team_id: "t1",
      team_name: "Хасууд",
      jersey_number: 7,
      pts: 15,
      fgm: 6,
      fga: 14,
      tpm: 1,
      tpa: 4,
      ftm: 2,
      fta: 3,
      oreb: 0,
      dreb: 3,
      ast: 6,
      stl: 1,
      blk: 0,
      tov: 2,
      pf: 1,
      seconds_played: 1200,
      source_type: "web",
      evidence_url: null,
      source_reviewed_at: "2026-07-05T00:00:00Z",
      team_short: "ХАС",
      game_date: "2026-07-05T00:00:00Z",
      opponent_name: "Хангай",
      opponent_short_code: "ХАН",
      opponent_logo_url: null,
      team_score: 65,
      opponent_score: 68,
      result: "L" as const,
      is_home: false,
    },
    {
      game_id: "g3",
      revision_id: "r3",
      revision_number: 1,
      revision_approved_at: "2026-07-10T00:00:00Z",
      player_id: "player-1",
      player_name: "Бат-Эрдэнэ",
      player_name_latin: "Bat-Erdene",
      player_position: "PG",
      team_season_id: "ts-1",
      team_id: "t1",
      team_name: "Хасууд",
      jersey_number: 7,
      pts: 30,
      fgm: 12,
      fga: 20,
      tpm: 4,
      tpa: 8,
      ftm: 2,
      fta: 3,
      oreb: 2,
      dreb: 4,
      ast: 8,
      stl: 3,
      blk: 1,
      tov: 1,
      pf: 1,
      seconds_played: 1500,
      source_type: "web",
      evidence_url: null,
      source_reviewed_at: "2026-07-10T00:00:00Z",
      team_short: "ХАС",
      game_date: "2026-07-10T00:00:00Z",
      opponent_name: "Шонхор",
      opponent_short_code: "ШОН",
      opponent_logo_url: null,
      team_score: 95,
      opponent_score: 88,
      result: "W" as const,
      is_home: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlayerById.mockResolvedValue(mockPlayerData as never);
    mockGetPlayerCompetitions.mockResolvedValue(mockCompetitions);
    mockGetPlayerGameLog.mockResolvedValue(mockGameLines);
    mockGetPlayerShootingProfile.mockResolvedValue({
      fgm: 62,
      fga: 121,
      tpm: 21,
      tpa: 53,
      ftm: 38,
      fta: 42,
    });
    mockGetLeagueAverages.mockResolvedValue({
      averages: { pts: 12.5, reb: 5.0, ast: 3.2, stl: 1.1, blk: 0.5 },
      maxes: { pts: 30.0, reb: 15.0, ast: 12.0, stl: 5.0, blk: 4.0 },
    });
    mockGetPlayerCareerTotals.mockResolvedValue({
      gp: 45,
      pts: 820,
      reb: 210,
      ast: 150,
    });
    mockGetPlayerAwards.mockResolvedValue([]);
    mockGetPlayerShotZones.mockResolvedValue([]);
    mockGetPlayerShotScatter.mockResolvedValue([]);
    mockDetectMilestones.mockReturnValue([]);
    mockAggregateMonthlyStats.mockReturnValue([]);
  });

  it("renders player info: breadcrumb, section heading, season label", async () => {
    const Page = (await import("../[id]/page")).default;
    render(
      await Page({
        params: Promise.resolve({ id: "player-1" }),
        searchParams: Promise.resolve({}),
      }),
    );

    const backLink = screen.getByRole("link", { name: /Тоглочид/ });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/players");

    expect(screen.getByText("Тоглогчийн профайл")).toBeInTheDocument();

    expect(
      screen.getByText("2026 · Монголын сагсан бөмбөгийн лиг"),
    ).toBeInTheDocument();
  });

  it("renders HeroCard with correct playerId and locale", async () => {
    const Page = (await import("../[id]/page")).default;
    render(
      await Page({
        params: Promise.resolve({ id: "player-1" }),
        searchParams: Promise.resolve({}),
      }),
    );

    const heroCard = screen.getByTestId("hero-card");
    expect(heroCard).toBeInTheDocument();
    expect(heroCard).toHaveTextContent("playerId=player-1");
    expect(heroCard).toHaveTextContent("locale=mn");

    expect(mockGetPlayerById).toHaveBeenCalledWith("player-1");
  });

  it("renders StatCard with player name and team when stats available", async () => {
    const Page = (await import("../[id]/page")).default;
    render(
      await Page({
        params: Promise.resolve({ id: "player-1" }),
        searchParams: Promise.resolve({}),
      }),
    );

    const statCard = screen.getByTestId("stat-card");
    expect(statCard).toBeInTheDocument();
    expect(statCard).toHaveTextContent("name=Бат-Эрдэнэ");
    expect(statCard).toHaveTextContent("team=Хасууд");
  });

  it("renders tabs with Summary and All Games triggers", async () => {
    const Page = (await import("../[id]/page")).default;
    render(
      await Page({
        params: Promise.resolve({ id: "player-1" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByTestId("tab-trigger-summary")).toHaveTextContent("Тойм");
    expect(screen.getByTestId("tab-trigger-gamelog")).toHaveTextContent(
      "Бүх тоглот",
    );
  });

  it("renders RecentGames and BestWorstGames when game log has 3+ games", async () => {
    const Page = (await import("../[id]/page")).default;
    render(
      await Page({
        params: Promise.resolve({ id: "player-1" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByTestId("scroll-reveal")).toBeInTheDocument();
    expect(screen.getByTestId("recent-games")).toBeInTheDocument();
    expect(screen.getByTestId("best-worst-games")).toBeInTheDocument();
  });

  it("renders summary tab content: advanced stats, milestones, shooting profile, shot chart, season arc", async () => {
    const Page = (await import("../[id]/page")).default;
    render(
      await Page({
        params: Promise.resolve({ id: "player-1" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByTestId("tab-content-summary")).toBeInTheDocument();
    expect(screen.getByTestId("advanced-stats-table")).toBeInTheDocument();
    expect(screen.getByTestId("milestones")).toBeInTheDocument();
    expect(screen.getByTestId("shooting-profile")).toBeInTheDocument();
    expect(screen.getByTestId("shot-chart")).toBeInTheDocument();
    expect(screen.getByTestId("season-arc")).toBeInTheDocument();
    expect(screen.getByTestId("home-away-splits")).toBeInTheDocument();
  });

  it("does not render ShootingProfile, ShotChart, or SkillRadar for career season", async () => {
    const Page = (await import("../[id]/page")).default;
    render(
      await Page({
        params: Promise.resolve({ id: "player-1" }),
        searchParams: Promise.resolve({ season: "career" }),
      }),
    );

    expect(screen.queryByTestId("shooting-profile")).not.toBeInTheDocument();
    expect(screen.queryByTestId("shot-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("skill-radar")).not.toBeInTheDocument();
  });

  it("calls notFound when getPlayerById returns null", async () => {
    mockGetPlayerById.mockResolvedValue(null);
    mockNotFound.mockImplementation(() => {
      throw new Error("NOT_FOUND");
    });

    const Page = (await import("../[id]/page")).default;

    await expect(async () => {
      await Page({
        params: Promise.resolve({ id: "nonexistent" }),
        searchParams: Promise.resolve({}),
      });
    }).rejects.toThrow("NOT_FOUND");

    expect(mockGetPlayerById).toHaveBeenCalledWith("nonexistent");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renders with English locale when lang=en", async () => {
    const Page = (await import("../[id]/page")).default;
    render(
      await Page({
        params: Promise.resolve({ id: "player-1" }),
        searchParams: Promise.resolve({ lang: "en" }),
      }),
    );
    expect(screen.getByText("Player Profile")).toBeInTheDocument();
    expect(screen.getByTestId("tab-trigger-summary")).toHaveTextContent(
      "Summary",
    );
    expect(screen.getByTestId("tab-trigger-gamelog")).toHaveTextContent(
      "All Games",
    );
  });

  it("renders AwardsShelf when player has awards", async () => {
    mockGetPlayerAwards.mockResolvedValue([
      {
        id: "award-1",
        award_type: "MVP",
        period_start: null,
        period_end: null,
        granted_at: "2026-06-01T00:00:00Z",
        note: null,
        player_name: "Бат-Эрдэнэ",
        player_id: "player-1",
        competition_name: "Монголын сагсан бөмбөгийн лиг",
        competition_id: "comp-1",
      },
    ]);

    const Page = (await import("../[id]/page")).default;
    render(
      await Page({
        params: Promise.resolve({ id: "player-1" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByTestId("awards-shelf")).toBeInTheDocument();
  });
});
