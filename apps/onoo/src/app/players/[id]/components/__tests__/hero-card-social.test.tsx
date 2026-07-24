/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — order matters (hoisted before imports)
// ---------------------------------------------------------------------------

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@onoo/core", () => ({
  getStatLabel: (key: string, _locale: string) => {
    const labels: Record<string, string> = {
      gp: "Гараа",
      pts: "Оноо",
      reb: "Самбар",
      ast: "Дамжуулалт",
    };
    return labels[key] ?? key;
  },
}));

vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({ name }: { name: string }) => (
    <div data-testid="player-avatar">{name}</div>
  ),
}));

vi.mock("@/components/team-logo", () => ({
  TeamLogo: ({ shortCode }: { shortCode: string }) => (
    <span data-testid="team-logo">{shortCode}</span>
  ),
}));

vi.mock("@/components/ui", () => ({
  Badge: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <span className={className}>{children}</span>,
}));

import type { PlayerProfileRow } from "@/app/lib/data";

const mockGetPlayerById = vi.fn<(...args: unknown[]) => unknown>();
const mockGetPlayerSeasonAverages = vi.fn<(...args: unknown[]) => unknown>();
const mockGetLeaders = vi.fn<(...args: unknown[]) => unknown>();
const mockGetPlayerCanonicalIdentity = vi.fn<(...args: unknown[]) => unknown>();
const mockGetAthleteAffiliations = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data", () => ({
  getPlayerById: (...args: unknown[]) => mockGetPlayerById(...args),
  getPlayerSeasonAverages: (...args: unknown[]) =>
    mockGetPlayerSeasonAverages(...args),
  getLeaders: (...args: unknown[]) => mockGetLeaders(...args),
  getPlayerCanonicalIdentity: (...args: unknown[]) =>
    mockGetPlayerCanonicalIdentity(...args),
  getAthleteAffiliations: (...args: unknown[]) =>
    mockGetAthleteAffiliations(...args),
}));

import { HeroCard } from "../hero-card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createProfile(
  overrides: Partial<PlayerProfileRow> = {},
): PlayerProfileRow {
  return {
    player_id: "player-1",
    player_name: "Бат-Эрдэнэ",
    player_name_latin: "Bat-Erdene",
    dob: null,
    height_cm: null,
    weight_kg: null,
    player_position: "PG",
    nationality: "MN",
    photo_url: null,
    social_links: {},
    team_season_id: "ts-1",
    team_id: "t-1",
    team_name: "Хангарьд",
    team_slug: "khangarid",
    team_logo_url: null,
    competition_id: "c-1",
    competition_name: "Монголын Аварга Лиг",
    season_id: "s-1",
    season_name: "2024-25",
    league_id: "l-1",
    league_name: "Монголын Сагсан Бөмбөгийн Холбоо",
    league_slug: "msbk",
    jersey_number: 7,
    games_played: 10,
    minutes_per_game: 30,
    points_per_game: 18.5,
    fgm_per_game: 6.5,
    fga_per_game: 12.0,
    tpm_per_game: 2.0,
    tpa_per_game: 5.0,
    ftm_per_game: 3.0,
    ftp_per_game: 3.5,
    oreb_per_game: 2.0,
    dreb_per_game: 4.0,
    ast_per_game: 5.0,
    stl_per_game: 1.5,
    blk_per_game: 0.5,
    turnover_per_game: 2.0,
    foul_per_game: 2.5,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("HeroCard — social links", () => {
  beforeEach(() => {
    mockGetPlayerById.mockResolvedValue({
      player: createProfile(),
      profiles: [createProfile()],
      seasonStats: [],
      gameLog: [],
    });
    mockGetPlayerSeasonAverages.mockResolvedValue(null);
    mockGetLeaders.mockResolvedValue([]);
    mockGetPlayerCanonicalIdentity.mockResolvedValue(null);
    mockGetAthleteAffiliations.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders social links badges when player has social_links", async () => {
    mockGetPlayerById.mockResolvedValue({
      player: createProfile({
        social_links: {
          instagram: "https://instagram.com/batzorig",
          facebook: "https://facebook.com/batzorig",
        },
      }),
      profiles: [
        createProfile({
          social_links: {
            instagram: "https://instagram.com/batzorig",
            facebook: "https://facebook.com/batzorig",
          },
        }),
      ],
      seasonStats: [],
      gameLog: [],
    });

    const { container } = render(
      await HeroCard({ playerId: "player-1", competitionId: null }),
    );

    const links = container.querySelectorAll(
      'a[target="_blank"][rel="noopener noreferrer"]',
    );
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent("Instagram");
    expect(links[1]).toHaveTextContent("Facebook");
    expect(links[0]).toHaveAttribute("href", "https://instagram.com/batzorig");
    expect(links[1]).toHaveAttribute("href", "https://facebook.com/batzorig");
  });

  it("does not render social links when player has no social_links", async () => {
    mockGetPlayerById.mockResolvedValue({
      player: createProfile({ social_links: {} }),
      profiles: [createProfile({ social_links: {} })],
      seasonStats: [],
      gameLog: [],
    });

    const { container } = render(
      await HeroCard({ playerId: "player-1", competitionId: null }),
    );

    const links = container.querySelectorAll(
      'a[target="_blank"][rel="noopener noreferrer"]',
    );
    expect(links).toHaveLength(0);
  });

  it("filters out empty URL entries", async () => {
    mockGetPlayerById.mockResolvedValue({
      player: createProfile({
        social_links: {
          instagram: "https://instagram.com/batzorig",
          youtube: "",
          twitter: "https://twitter.com/batzorig",
        },
      }),
      profiles: [
        createProfile({
          social_links: {
            instagram: "https://instagram.com/batzorig",
            youtube: "",
            twitter: "https://twitter.com/batzorig",
          },
        }),
      ],
      seasonStats: [],
      gameLog: [],
    });

    const { container } = render(
      await HeroCard({ playerId: "player-1", competitionId: null }),
    );

    const links = container.querySelectorAll(
      'a[target="_blank"][rel="noopener noreferrer"]',
    );
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent("Instagram");
    expect(links[1]).toHaveTextContent("Twitter / X");
  });

  it("uses raw platform key as label for unknown platforms", async () => {
    mockGetPlayerById.mockResolvedValue({
      player: createProfile({
        social_links: { custom_site: "https://example.com" },
      }),
      profiles: [
        createProfile({
          social_links: { custom_site: "https://example.com" },
        }),
      ],
      seasonStats: [],
      gameLog: [],
    });

    const { container } = render(
      await HeroCard({ playerId: "player-1", competitionId: null }),
    );

    const links = container.querySelectorAll(
      'a[target="_blank"][rel="noopener noreferrer"]',
    );
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent("custom_site");
    expect(links[0]).toHaveAttribute("href", "https://example.com");
  });

  it("uses 'Website' label for website platform in English locale", async () => {
    mockGetPlayerById.mockResolvedValue({
      player: createProfile({
        social_links: { website: "https://example.com" },
      }),
      profiles: [
        createProfile({
          social_links: { website: "https://example.com" },
        }),
      ],
      seasonStats: [],
      gameLog: [],
    });

    const { container } = render(
      await HeroCard({
        playerId: "player-1",
        competitionId: null,
        locale: "en",
      }),
    );

    const links = container.querySelectorAll(
      'a[target="_blank"][rel="noopener noreferrer"]',
    );
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent("Website");
  });
});
