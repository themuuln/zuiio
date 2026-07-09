/**
 * Client-side API helpers for admin CRUD operations.
 * All functions call Next.js Route Handlers which use Supabase server client.
 */

const BASE = "/admin/api";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Sports ──
export const sportsApi = {
  list: () => request<Array<{ id: string; key: string; name_mn: string; name_en: string }>>(`${BASE}/sports`),
};

// ── Leagues ──
export interface LeagueRow {
  id: string;
  name: string;
  slug: string;
  sport_id: string;
  organization_id: string;
  logo_url: string | null;
  created_at: string;
  sports?: { name_en: string; name_mn: string } | null;
}

export const leaguesApi = {
  list: () => request<LeagueRow[]>(`${BASE}/leagues`),
  get: (id: string) => request<LeagueRow>(`${BASE}/leagues/${id}`),
  create: (data: { name: string; slug: string; sport_id: string; organization_id: string }) =>
    request<LeagueRow>(`${BASE}/leagues`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<LeagueRow>) =>
    request<LeagueRow>(`${BASE}/leagues/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`${BASE}/leagues/${id}`, { method: "DELETE" }),
};

// ── Seasons ──
export interface SeasonRow {
  id: string;
  league_id: string;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  created_at: string;
  leagues?: { name: string } | null;
}

export const seasonsApi = {
  list: (leagueId?: string) => {
    const qs = leagueId ? `?league_id=${leagueId}` : "";
    return request<SeasonRow[]>(`${BASE}/seasons${qs}`);
  },
  get: (id: string) => request<SeasonRow>(`${BASE}/seasons/${id}`),
  create: (data: { league_id: string; name: string; starts_on?: string; ends_on?: string }) =>
    request<SeasonRow>(`${BASE}/seasons`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<SeasonRow>) =>
    request<SeasonRow>(`${BASE}/seasons/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`${BASE}/seasons/${id}`, { method: "DELETE" }),
};

// ── Teams ──
export interface TeamRow {
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

export const teamsApi = {
  list: (leagueId?: string) => {
    const qs = leagueId ? `?league_id=${leagueId}` : "";
    return request<TeamRow[]>(`${BASE}/teams${qs}`);
  },
  get: (id: string) => request<TeamRow>(`${BASE}/teams/${id}`),
  create: (data: { league_id: string; name: string; short_code: string; slug: string; primary_color?: string }) =>
    request<TeamRow>(`${BASE}/teams`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<TeamRow>) =>
    request<TeamRow>(`${BASE}/teams/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`${BASE}/teams/${id}`, { method: "DELETE" }),
};

// ── Players ──
export interface PlayerRow {
  id: string;
  canonical_name: string;
  name_latin: string | null;
  dob: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  position: string | null;
  nationality: string;
  photo_url: string | null;
  created_at: string;
}

export const playersApi = {
  list: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return request<PlayerRow[]>(`${BASE}/players${qs}`);
  },
  get: (id: string) => request<PlayerRow>(`${BASE}/players/${id}`),
  create: (data: { canonical_name: string; name_latin?: string; position?: string; nationality?: string }) =>
    request<PlayerRow>(`${BASE}/players`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<PlayerRow>) =>
    request<PlayerRow>(`${BASE}/players/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`${BASE}/players/${id}`, { method: "DELETE" }),
};

// ── Games ──
export interface GameRow {
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
  home_team_season?: { teams?: { name: string; short_code: string } | null } | null;
  away_team_season?: { teams?: { name: string; short_code: string } | null } | null;
  venues?: { name: string; city: string | null } | null;
}

export interface CompetitionRow {
  id: string;
  name: string;
  type: string;
  season_id: string;
}

export interface VenueRow {
  id: string;
  name: string;
  city: string | null;
}

export interface TeamSeasonRow {
  id: string;
  team_id: string;
  competition_id: string;
  teams?: { name: string; short_code: string } | null;
}

export const gamesApi = {
  list: () => request<GameRow[]>(`${BASE}/games`),
  get: (id: string) => request<GameRow>(`${BASE}/games/${id}`),
  create: (data: {
    competition_id: string;
    home_team_season_id: string;
    away_team_season_id: string;
    venue_id?: string;
    scheduled_at: string;
  }) => request<GameRow>(`${BASE}/games`, { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    request<GameRow>(`${BASE}/games/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
};

export const competitionsApi = {
  list: () => request<CompetitionRow[]>(`${BASE}/competitions`),
};

export const venuesApi = {
  list: () => request<VenueRow[]>(`${BASE}/venues`),
};

export const teamSeasonsApi = {
  list: (competitionId?: string) => {
    const qs = competitionId ? `?competition_id=${competitionId}` : "";
    return request<TeamSeasonRow[]>(`${BASE}/team-seasons${qs}`);
  },
};
