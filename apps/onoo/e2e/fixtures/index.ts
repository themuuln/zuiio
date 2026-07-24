/**
 * E2E API response fixtures for Onoo admin sections.
 *
 * Every fixture factory accepts a `Partial<>` override for test-specific tweaking.
 * IDs are deterministically generated for consistency across tests.
 */

// ─── Seed IDs ──────────────────────────────────────────────────────────────

export const SEED = {
  orgId: "b0000000-0000-0000-0000-000000000001",
  adminId: "a0000000-0000-0000-0000-000000000001",
  sports: {
    basketball: {
      id: "s0000000-0000-0000-0000-000000000001",
      key: "basketball",
      name_mn: "Сагсан бөмбөг",
      name_en: "Basketball",
    },
    volleyball: {
      id: "s0000000-0000-0000-0000-000000000002",
      key: "volleyball",
      name_mn: "Гар бөмбөг",
      name_en: "Volleyball",
    },
  },
  leagues: {
    mbl: {
      id: "l0000000-0000-0000-0000-000000000001",
      name: "Монголын Үндэсний Лиг",
      slug: "mbl",
    },
    ubcup: {
      id: "l0000000-0000-0000-0000-000000000002",
      name: "Улаанбаатар Цом",
      slug: "ub-cup",
    },
  },
  seasons: {
    season2025: {
      id: "se000000-0000-0000-0000-000000000001",
      name: "2025",
    },
    season2026: {
      id: "se000000-0000-0000-0000-000000000002",
      name: "2026",
    },
  },
  teams: {
    khas: {
      id: "t00000000-0000-0000-0000-000000000001",
      name: "Хас",
      short_code: "ХАС",
      slug: "khas",
    },
    altan: {
      id: "t00000000-0000-0000-0000-000000000002",
      name: "Алтан",
      short_code: "АЛТ",
      slug: "altan",
    },
    bura: {
      id: "t00000000-0000-0000-0000-000000000003",
      name: "Бура",
      short_code: "БУР",
      slug: "bura",
    },
  },
  players: {
    bat: {
      id: "p00000000-0000-0000-0000-000000000001",
      canonical_name: "Б. Бат",
    },
    dorj: {
      id: "p00000000-0000-0000-0000-000000000002",
      canonical_name: "Д. Дорж",
    },
    enkh: {
      id: "p00000000-0000-0000-0000-000000000003",
      canonical_name: "Э. Энх-Од",
    },
  },
  competitions: {
    regular: {
      id: "c00000000-0000-0000-0000-000000000001",
      name: "Энгийн тоглолт",
      type: "regular",
    },
    playoff: {
      id: "c00000000-0000-0000-0000-000000000002",
      name: "Плейофф",
      type: "playoff",
    },
  },
  venues: {
    ubPalace: {
      id: "v00000000-0000-0000-0000-000000000001",
      name: "Улаанбаатар Ордон",
      city: "Улаанбаатар",
    },
  },
} as const;

// ─── Sports ────────────────────────────────────────────────────────────────

export interface SportFixture {
  id: string;
  key: string;
  name_mn: string;
  name_en: string;
}

export function sportFixture(
  overrides?: Partial<SportFixture>,
): SportFixture {
  return { ...SEED.sports.basketball, ...overrides };
}

// ─── Leagues ───────────────────────────────────────────────────────────────

export interface LeagueFixture {
  id: string;
  name: string;
  slug: string;
  sport_id: string;
  organization_id: string;
  logo_url: string | null;
  created_at: string;
  sports?: { name_en: string; name_mn: string } | null;
}

export function leagueFixture(
  overrides?: Partial<LeagueFixture>,
): LeagueFixture {
  return {
    id: SEED.leagues.mbl.id,
    name: SEED.leagues.mbl.name,
    slug: SEED.leagues.mbl.slug,
    sport_id: SEED.sports.basketball.id,
    organization_id: SEED.orgId,
    logo_url: null,
    created_at: "2025-01-01T00:00:00Z",
    sports: {
      name_en: SEED.sports.basketball.name_en,
      name_mn: SEED.sports.basketball.name_mn,
    },
    ...overrides,
  };
}

export function leagueListFixture(): LeagueFixture[] {
  return [
    leagueFixture(),
    leagueFixture({
      id: SEED.leagues.ubcup.id,
      name: SEED.leagues.ubcup.name,
      slug: SEED.leagues.ubcup.slug,
      sport_id: SEED.sports.volleyball.id,
      sports: {
        name_en: SEED.sports.volleyball.name_en,
        name_mn: SEED.sports.volleyball.name_mn,
      },
    }),
  ];
}

// ─── Seasons ───────────────────────────────────────────────────────────────

export interface SeasonFixture {
  id: string;
  league_id: string;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  created_at: string;
  leagues?: { name: string } | null;
}

export function seasonFixture(
  overrides?: Partial<SeasonFixture>,
): SeasonFixture {
  return {
    id: SEED.seasons.season2025.id,
    league_id: SEED.leagues.mbl.id,
    name: SEED.seasons.season2025.name,
    starts_on: "2025-01-01",
    ends_on: "2025-12-31",
    created_at: "2025-01-01T00:00:00Z",
    leagues: { name: SEED.leagues.mbl.name },
    ...overrides,
  };
}

export function seasonListFixture(): SeasonFixture[] {
  return [
    seasonFixture(),
    seasonFixture({
      id: SEED.seasons.season2026.id,
      name: SEED.seasons.season2026.name,
      starts_on: "2026-01-01",
      ends_on: "2026-12-31",
    }),
  ];
}

// ─── Teams ─────────────────────────────────────────────────────────────────

export interface TeamFixture {
  id: string;
  league_id: string;
  name: string;
  short_code: string;
  slug: string;
  primary_color: string | null;
  logo_url: string | null;
  created_at: string;
  leagues?: { name: string } | null;
}

export function teamFixture(overrides?: Partial<TeamFixture>): TeamFixture {
  return {
    id: SEED.teams.khas.id,
    league_id: SEED.leagues.mbl.id,
    name: SEED.teams.khas.name,
    short_code: SEED.teams.khas.short_code,
    slug: SEED.teams.khas.slug,
    primary_color: "#ff0000",
    logo_url: null,
    created_at: "2025-01-15T00:00:00Z",
    leagues: { name: SEED.leagues.mbl.name },
    ...overrides,
  };
}

export function teamListFixture(): TeamFixture[] {
  return [
    teamFixture(),
    teamFixture({ ...SEED.teams.altan, league_id: SEED.leagues.mbl.id, primary_color: "#0000ff" }),
    teamFixture({ ...SEED.teams.bura, league_id: SEED.leagues.ubcup.id, primary_color: "#00ff00" }),
  ];
}

// ─── Players ───────────────────────────────────────────────────────────────

export interface PlayerFixture {
  id: string;
  canonical_name: string;
  name_latin: string | null;
  dob: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  position: string | null;
  nationality: string;
  photo_url: string | null;
  visibility: "public" | "hidden";
  consent_recorded_at: string | null;
  consent_note: string | null;
  created_at: string;
}

export function playerFixture(
  overrides?: Partial<PlayerFixture>,
): PlayerFixture {
  return {
    id: SEED.players.bat.id,
    canonical_name: SEED.players.bat.canonical_name,
    name_latin: "B. Bat",
    dob: "2000-01-15",
    height_cm: 185,
    weight_kg: 80,
    position: "PG",
    nationality: "MN",
    photo_url: null,
    visibility: "public",
    consent_recorded_at: "2025-02-01",
    consent_note: "Parental consent",
    created_at: "2025-02-01T00:00:00Z",
    ...overrides,
  };
}

export function playerListFixture(): PlayerFixture[] {
  return [
    playerFixture(),
    playerFixture({
      id: SEED.players.dorj.id,
      canonical_name: SEED.players.dorj.canonical_name,
      name_latin: "D. Dorj",
      position: "SG",
    }),
    playerFixture({
      id: SEED.players.enkh.id,
      canonical_name: SEED.players.enkh.canonical_name,
      name_latin: "E. Enkh-Od",
      position: "C",
      visibility: "hidden",
    }),
  ];
}

// ─── Competitions ──────────────────────────────────────────────────────────

export interface CompetitionFixture {
  id: string;
  name: string;
  type: string;
  season_id: string;
}

export function competitionFixture(
  overrides?: Partial<CompetitionFixture>,
): CompetitionFixture {
  return {
    id: SEED.competitions.regular.id,
    name: SEED.competitions.regular.name,
    type: SEED.competitions.regular.type,
    season_id: SEED.seasons.season2025.id,
    ...overrides,
  };
}

// ─── Venues ────────────────────────────────────────────────────────────────

export interface VenueFixture {
  id: string;
  name: string;
  city: string | null;
}

export function venueFixture(
  overrides?: Partial<VenueFixture>,
): VenueFixture {
  return {
    id: SEED.venues.ubPalace.id,
    name: SEED.venues.ubPalace.name,
    city: SEED.venues.ubPalace.city,
    ...overrides,
  };
}

// ─── Team Seasons ──────────────────────────────────────────────────────────

export interface TeamSeasonFixture {
  id: string;
  team_id: string;
  competition_id: string;
  teams?: { name: string; short_code: string } | null;
}

export function teamSeasonFixture(
  overrides?: Partial<TeamSeasonFixture>,
): TeamSeasonFixture {
  return {
    id: `ts-${SEED.teams.khas.id}`,
    team_id: SEED.teams.khas.id,
    competition_id: SEED.competitions.regular.id,
    teams: { name: SEED.teams.khas.name, short_code: SEED.teams.khas.short_code },
    ...overrides,
  };
}

// ─── Games ─────────────────────────────────────────────────────────────────

export interface GameFixture {
  id: string;
  competition_id: string;
  home_team_season_id: string;
  away_team_season_id: string;
  venue_id: string | null;
  scheduled_at: string;
  status: string;
  current_period: number;
  home_score: number | null;
  away_score: number | null;
  created_at: string;
  competitions?: { name: string; season_id: string } | null;
  home_team_season?: {
    teams?: { name: string; short_code: string } | null;
  } | null;
  away_team_season?: {
    teams?: { name: string; short_code: string } | null;
  } | null;
  venues?: { name: string; city: string | null } | null;
}

export function gameFixture(overrides?: Partial<GameFixture>): GameFixture {
  return {
    id: "g00000000-0000-0000-0000-000000000001",
    competition_id: SEED.competitions.regular.id,
    home_team_season_id: `ts-${SEED.teams.khas.id}`,
    away_team_season_id: `ts-${SEED.teams.altan.id}`,
    venue_id: SEED.venues.ubPalace.id,
    scheduled_at: "2025-06-15T14:00:00Z",
    status: "scheduled",
    current_period: 0,
    home_score: null,
    away_score: null,
    created_at: "2025-05-01T00:00:00Z",
    competitions: {
      name: SEED.competitions.regular.name,
      season_id: SEED.seasons.season2025.id,
    },
    home_team_season: {
      teams: { name: SEED.teams.khas.name, short_code: SEED.teams.khas.short_code },
    },
    away_team_season: {
      teams: { name: SEED.teams.altan.name, short_code: SEED.teams.altan.short_code },
    },
    venues: { name: SEED.venues.ubPalace.name, city: SEED.venues.ubPalace.city },
    ...overrides,
  };
}

export function gameListFixture(): GameFixture[] {
  return [
    gameFixture({ status: "scheduled" }),
    gameFixture({
      id: "g00000000-0000-0000-0000-000000000002",
      status: "final_pending_review",
      home_score: 85,
      away_score: 72,
      home_team_season: {
        teams: { name: SEED.teams.khas.name, short_code: "ХАС" },
      },
      away_team_season: {
        teams: { name: SEED.teams.bura.name, short_code: "БУР" },
      },
    }),
    gameFixture({
      id: "g00000000-0000-0000-0000-000000000003",
      status: "official",
      home_score: 91,
      away_score: 88,
      home_team_season: {
        teams: { name: SEED.teams.altan.name, short_code: "АЛТ" },
      },
      away_team_season: {
        teams: { name: SEED.teams.khas.name, short_code: "ХАС" },
      },
    }),
  ];
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export interface DashboardFixture {
  games: GameFixture[];
}

export function dashboardFixture(
  overrides?: Partial<DashboardFixture>,
): DashboardFixture {
  return {
    games: gameListFixture(),
    ...overrides,
  };
}

// ─── Auth / Profile ────────────────────────────────────────────────────────

export interface ProfileFixture {
  id: string;
  email: string;
  role: string;
  organization_id: string;
}

export function profileFixture(
  overrides?: Partial<ProfileFixture>,
): ProfileFixture {
  return {
    id: SEED.adminId,
    email: "admin@onoo.mn",
    role: "admin",
    organization_id: SEED.orgId,
    ...overrides,
  };
}
