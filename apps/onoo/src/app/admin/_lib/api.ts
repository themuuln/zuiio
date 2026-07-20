/**
 * Client-side API helpers for admin CRUD operations.
 * All functions call Next.js Route Handlers which use Supabase server client.
 */
import { createClient } from "@/lib/supabase/client";

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

/**
 * Standard CRUD API client factory for admin entities.
 * Returns `{ list, get, create, update, remove }`.
 *
 * @example
 * const teamsApi = createEntityApi<TeamRow>("/admin/api/teams");
 * teamsApi.list({ league_id: "..." });  // GET /admin/api/teams?league_id=...
 * teamsApi.create({ name: "..." });     // POST /admin/api/teams
 */
function createEntityApi<T extends { id: string }>(basePath: string) {
  return {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<T[]>(`${basePath}${qs}`);
    },
    get: (id: string) => request<T>(`${basePath}/${id}`),
    create: (data: Partial<T>) =>
      request<T>(basePath, { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<T>) =>
      request<T>(`${basePath}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      request<void>(`${basePath}/${id}`, { method: "DELETE" }),
  };
}

// ── Sports ──
export interface SportRow {
  id: string;
  key: string;
  name_mn: string;
  name_en: string;
}

export const sportsApi = {
  list: () => request<SportRow[]>(`${BASE}/sports`),
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

export const leaguesApi = createEntityApi<LeagueRow>(`${BASE}/leagues`);

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

export const seasonsApi = createEntityApi<SeasonRow>(`${BASE}/seasons`);

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

export const teamsApi = createEntityApi<TeamRow>(`${BASE}/teams`);

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
  visibility: "public" | "hidden";
  consent_recorded_at: string | null;
  consent_note: string | null;
  created_at: string;
}

export const playersApi = createEntityApi<PlayerRow>(`${BASE}/players`);

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
  home_team_season?: {
    teams?: { name: string; short_code: string } | null;
  } | null;
  away_team_season?: {
    teams?: { name: string; short_code: string } | null;
  } | null;
  venues?: { name: string; city: string | null } | null;
}

export interface CompetitionRow {
  id: string;
  name: string;
  type: string;
  season_id: string;
  created_at: string;
}

export interface VenueRow {
  id: string;
  name: string;
  city: string | null;
  capacity: number | null;
  created_at: string;
}

export interface TeamSeasonRow {
  id: string;
  team_id: string;
  competition_id: string;
  teams?: { name: string; short_code: string } | null;
}

export const gamesApi = {
  ...createEntityApi<GameRow>(`${BASE}/games`),
  /** Only status is updatable on games via PUT. */
  updateStatus: (id: string, status: string) =>
    request<GameRow>(`${BASE}/games/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};

export const competitionsApi = createEntityApi<CompetitionRow>(
  `${BASE}/competitions`,
);

export const venuesApi = createEntityApi<VenueRow>(`${BASE}/venues`);

export const teamSeasonsApi = createEntityApi<TeamSeasonRow>(
  `${BASE}/team-seasons`,
);

// ── Submissions (source_submissions) ──
export interface SubmissionRow {
  id: string;
  game_id: string;
  source_type: string;
  evidence_url: string | null;
  submitted_by: string;
  submitted_at: string;
  normalized_payload: Record<string, unknown>;
  confidence: number | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
}

export interface RevisionRow {
  id: string;
  game_id: string;
  revision_number: number;
  source_submission_id: string;
  state: string;
  journal: Record<string, unknown>;
  projection: Record<string, unknown>;
  validation_warnings: string[];
  created_by: string;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
}

export const submissionsApi = {
  list: (gameId: string) =>
    request<SubmissionRow[]>(`${BASE}/games/${gameId}/submissions`),
  approve: async (submissionId: string, note?: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("cmd_approve_source", {
      p_submission_id: submissionId,
      p_approved: true,
      p_note: note ?? null,
    });
    if (error) throw new Error(error.message);
    return data as SubmissionRow;
  },
  reject: async (submissionId: string, note?: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("cmd_approve_source", {
      p_submission_id: submissionId,
      p_approved: false,
      p_note: note ?? null,
    });
    if (error) throw new Error(error.message);
    return data as SubmissionRow;
  },
};

export const revisionsApi = {
  list: (gameId: string) =>
    request<RevisionRow[]>(`${BASE}/games/${gameId}/revisions`),
  approve: async (revisionId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("cmd_approve_revision", {
      p_revision_id: revisionId,
      p_approved: true,
    });
    if (error) throw new Error(error.message);
    return data as RevisionRow;
  },
  reject: async (revisionId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("cmd_approve_revision", {
      p_revision_id: revisionId,
      p_approved: false,
    });
    if (error) throw new Error(error.message);
    return data as RevisionRow;
  },
};
