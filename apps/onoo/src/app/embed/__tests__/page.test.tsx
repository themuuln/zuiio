/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GameWithTeams, PlayerProfileRow } from "@/app/lib/shared";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

vi.mock("@/components/team-logo", () => ({
  TeamLogo: ({ shortCode }: { shortCode: string }) => (
    <span data-testid="team-logo">{shortCode}</span>
  ),
}));

vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({ name }: { name: string }) => (
    <span data-testid="player-avatar">{name}</span>
  ),
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

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div className={className} data-testid="skeleton" />
  ),
}));

vi.mock("lucide-react", () => ({
  Radio: () => <span data-testid="icon-radio" />,
}));

vi.mock("date-fns-tz", () => ({
  formatInTimeZone: () => "19:00",
}));

// ---------------------------------------------------------------------------
// Mock data — vi.hoisted so available to factory and test assertions
// ---------------------------------------------------------------------------

const { mockGetGameById, mockGetPlayerById } = vi.hoisted(() => ({
  mockGetGameById: vi.fn<(id: string) => Promise<GameWithTeams | null>>(),
  mockGetPlayerById:
    vi.fn<
      (id: string) => Promise<{
        player: PlayerProfileRow | null;
        profiles: PlayerProfileRow[];
      } | null>
    >(),
}));

const mockGame: GameWithTeams = {
  id: "game-1",
  status: "scheduled",
  scheduled_at: "2026-07-22T11:00:00Z",
  home_team_name: "Хасууд",
  home_team_short_code: "ХАС",
  home_team_logo_url: null,
  home_team_primary_color: "#e63946",
  home_team_slug: "khasuud",
  home_score: null,
  away_team_name: "Арслангууд",
  away_team_short_code: "АРС",
  away_team_logo_url: null,
  away_team_primary_color: "#1d3557",
  away_team_slug: "arslanuud",
  away_score: null,
  venue_name: "Төв цэнгэлдэх",
  competition_name: "Test League",
  season_id: "s1",
  season_name: "2026",
  league_id: "l1",
  league_name: "Test League",
  league_slug: "test",
  revision_id: "r1",
  revision_number: 1,
  revision_approved_at: "2026-07-22T12:00:00Z",
  source_submission_id: "ss1",
  source_type: "web",
  evidence_url: null,
  source_reviewer_id: "usr1",
  source_reviewed_at: "2026-07-22T12:00:00Z",
  home_team_season_id: "ts1",
  away_team_season_id: "ts2",
  home_name: "Хасууд",
  home_short: "ХАС",
  home_color: null,
  away_name: "Арслангууд",
  away_short: "АРС",
  away_color: null,
  venue_city: null,
  is_provisional: false,
  home_team_id: "t1",
};

const mockPlayerProfile: PlayerProfileRow = {
  player_id: "player-1",
  player_name: "Бат-Эрдэнэ",
  player_name_latin: "Bat-Erdene",
  dob: null,
  height_cm: null,
  weight_kg: null,
  player_position: "PG",
  nationality: "Mongolia",
  photo_url: null,
  team_season_id: "ts1",
  team_id: "t1",
  team_name: "Хасууд",
  team_slug: "khasuud",
  team_logo_url: null,
  competition_id: "c1",
  competition_name: "Test League",
  season_id: "s1",
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

mockGetGameById.mockResolvedValue(mockGame);
mockGetPlayerById.mockResolvedValue({
  player: mockPlayerProfile,
  profiles: [mockPlayerProfile],
  seasonStats: [],
  gameLog: [],
});

vi.mock("@/app/lib/data", () => ({
  getGameById: mockGetGameById,
  getPlayerById: mockGetPlayerById,
}));

// ---------------------------------------------------------------------------
// Tests  (dynamic import to access async server components in test runner)
// ---------------------------------------------------------------------------

describe("Embed pages", () => {
  it("renders game embed page", async () => {
    const Page = (await import("../game/[id]/page")).default;
    const { container } = render(
      await Page({ params: Promise.resolve({ id: "game-1" }) }),
    );

    // GameCard renders team names
    expect(screen.getByText("Хасууд")).toBeInTheDocument();
    expect(screen.getByText("Арслангууд")).toBeInTheDocument();

    // Footer link
    const footerLink = screen.getByRole("link", { name: /onoo\.mn/i });
    expect(footerLink).toHaveAttribute("href", "https://onoo.mn");
    expect(footerLink).toHaveAttribute("target", "_blank");

    expect(mockGetGameById).toHaveBeenCalledWith("game-1");
  });

  it("renders player embed page", async () => {
    const Page = (await import("../player/[id]/page")).default;
    render(await Page({ params: Promise.resolve({ id: "player-1" }) }));

    // Player avatar rendered
    expect(screen.getByTestId("player-avatar")).toHaveTextContent("Бат-Эрдэнэ");

    // PPG value
    expect(screen.getByText("18.3")).toBeInTheDocument();

    // RPG computed from oreb + dreb = 1.2 + 3.5 = 4.7
    expect(screen.getByText("4.7")).toBeInTheDocument();

    // APG value
    expect(screen.getByText("5.7")).toBeInTheDocument();

    // Footer link
    const footerLink = screen.getByRole("link", { name: /onoo\.mn/i });
    expect(footerLink).toHaveAttribute("href", "https://onoo.mn");
    expect(footerLink).toHaveAttribute("target", "_blank");

    expect(mockGetPlayerById).toHaveBeenCalledWith("player-1");
  });
});
