/**
 * Client-side API helpers for admin CRUD operations.
 * All functions call Next.js Route Handlers which use Supabase server client.
 */
import { createClient } from "@/lib/supabase/client";

const BASE = "/admin/api";

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
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
  social_links: Record<string, string>;
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
  social_links: Record<string, string>;
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
  social_links: Record<string, string>;
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
  rebuildProjection: async (gameId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("cmd_rebuild_projection", {
      p_game_id: gameId,
    });
    if (error) throw new Error(error.message);
    return data as { id: string };
  },
};

// ── Shop: Products ──

export interface ShopProductRow {
  id: string;
  name: string;
  slug: string;
  price_mnt: number;
  images: string[];
  variants: Array<{ size: string; stock: number }>;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  name_en?: string;
  description?: string;
  category?: string;
}

export const shopProductsApi = createEntityApi<ShopProductRow>(
  `${BASE}/products`,
);

// ── Shop: Orders ──

export interface ShopOrderRow {
  id: string;
  customer_name: string;
  phone: string;
  total_mnt: number;
  status: string;
  created_at: string;
  qpay_invoice_id?: string;
  items?: Array<{ product_name: string; variant?: string }>;
}

export const shopOrdersApi = {
  list: () =>
    fetch("/admin/api/orders").then((r) => r.json()) as Promise<ShopOrderRow[]>,
  ship: (orderId: string) =>
    fetch("/admin/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ship", orderId }),
    }).then((r) => r.json()),
  cancel: (orderId: string) =>
    fetch("/admin/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", orderId }),
    }).then((r) => r.json()),
};

// ── Awards ──

export interface AwardRow {
  id: string;
  competition_id: string;
  award_type: "player_of_week" | "mvp" | "top_scorer";
  period_start: string | null;
  period_end: string | null;
  player_id: string;
  note: string | null;
  granted_at: string;
  players?: {
    canonical_name: string;
    photo_url: string | null;
    short_code: string | null;
  } | null;
  profiles?: { display_name: string } | null;
}

export const awardsApi = {
  list: () => request<AwardRow[]>(`${BASE}/awards`),
  grant: (data: {
    competition_id: string;
    award_type: string;
    player_id: string;
    period_start?: string;
    period_end?: string;
    note?: string;
  }) =>
    request<AwardRow>(`${BASE}/awards`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Academy: Profiles ──

export interface AcademyProfileRow {
  id: string;
  organization_id: string;
  name: string;
  logo_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  timezone: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Academy: Programs ──

export interface AcademyProgramRow {
  id: string;
  academy_id: string;
  name: string;
  description: string | null;
  age_group: string | null;
  price_mnt: number | null;
  duration_weeks: number | null;
  is_active: boolean;
  created_at: string;
}

// ── Academy: Trainers ──

export interface AcademyTrainerRow {
  id: string;
  academy_id: string;
  name: string;
  photo_url: string | null;
  specialties: string[];
  bio: string | null;
  is_active: boolean;
  created_at: string;
}

// ── Academy: Locations ──

export interface AcademyLocationRow {
  id: string;
  academy_id: string;
  name: string;
  address: string | null;
  city: string | null;
  hours: string | null;
  is_active: boolean;
  created_at: string;
}

// ── Academy: API ──

export const academyApi = {
  profile: {
    get: () => request<AcademyProfileRow[]>(`${BASE}/academy/profile`),
    getById: (id: string) =>
      request<AcademyProfileRow>(`${BASE}/academy/profile/${id}`),
    update: (id: string, data: Partial<AcademyProfileRow>) =>
      request<AcademyProfileRow>(`${BASE}/academy/profile/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    seed: (name?: string) =>
      request<AcademyProfileRow>(`${BASE}/academy/profile`, {
        method: "POST",
        body: JSON.stringify({ action: "seed", name }),
      }),
  },
  programs: createEntityApi<AcademyProgramRow>(`${BASE}/academy/programs`),
  trainers: createEntityApi<AcademyTrainerRow>(`${BASE}/academy/trainers`),
  locations: createEntityApi<AcademyLocationRow>(`${BASE}/academy/locations`),
};

// ── Organizations ──

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  type: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  website?: string | null;
  settings?: Record<string, unknown> | null;
  created_at: string;
  social_links: Record<string, string>;
}

export const orgApi = {
  list: () => request<OrganizationRow[]>(`${BASE}/org`),
  update: (id: string, data: Partial<OrganizationRow>) =>
    request<OrganizationRow>(`${BASE}/org`, {
      method: "POST",
      body: JSON.stringify({ id, ...data }),
    }),
};

export interface BreakGlassRow {
  id: string;
  organization_id: string;
  granted_to: string;
  reason: string;
  expires_at: string;
  granted_by?: string | null;
  is_expired: boolean;
  created_at: string;
}

export const breakGlassApi = {
  list: (orgId: string) =>
    request<BreakGlassRow[]>(
      `${BASE}/org/break-glass?org_id=${encodeURIComponent(orgId)}`,
    ),
  grant: (data: Record<string, unknown>) =>
    request<BreakGlassRow>(`${BASE}/org/break-glass`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  expire: (id: string) =>
    request<void>(`${BASE}/org/break-glass?id=${encodeURIComponent(id)}`, {
      method: "PUT",
    }),
};
export interface ConsentPolicyRow {
  id: string;
  organization_id: string;
  title: string;
  description?: string | null;
  retention_days: number;
  data_categories: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const orgConsentApi = {
  list: (orgId: string) =>
    request<ConsentPolicyRow[]>(
      `${BASE}/org/consent?org_id=${encodeURIComponent(orgId)}`,
    ),
  create: (data: Record<string, unknown>) =>
    request<ConsentPolicyRow>(`${BASE}/org/consent`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Record<string, unknown>) =>
    request<ConsentPolicyRow>(
      `${BASE}/org/consent?id=${encodeURIComponent(id)}`,
      { method: "PUT", body: JSON.stringify(data) },
    ),
  delete: (id: string) =>
    request<void>(`${BASE}/org/consent`, {
      method: "DELETE",
      body: JSON.stringify({ id }),
    }),
};

export interface MemberRow {
  membership_id: string;
  user_id: string;
  scope_type: string;
  scope_id: string;
  role: string;
  display_name?: string | null;
  user_email?: string | null;
  created_at: string;
}

export const orgMembersApi = {
  list: (scopeType: string, scopeId: string) =>
    request<MemberRow[]>(
      `${BASE}/org/members?scope_type=${encodeURIComponent(scopeType)}&scope_id=${encodeURIComponent(scopeId)}`,
    ),
  assign: (userId: string, scopeType: string, scopeId: string, role: string) =>
    request<MemberRow>(`${BASE}/org/members`, {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        scope_type: scopeType,
        scope_id: scopeId,
        role,
      }),
    }),
  remove: (membershipId: string) =>
    request<void>(`${BASE}/org/members`, {
      method: "DELETE",
      body: JSON.stringify({ membership_id: membershipId }),
    }),
};

export interface OrgStorageBucketRow {
  id: string;
  organization_id: string;
  bucket_name: string;
  bucket_id: string;
  is_tenant_isolation: boolean;
  created_at: string;
}

export const orgStorageApi = {
  list: (orgId: string) =>
    request<OrgStorageBucketRow[]>(
      `${BASE}/org/storage?org_id=${encodeURIComponent(orgId)}`,
    ),
  create: (data: Record<string, unknown>) =>
    request<OrgStorageBucketRow>(`${BASE}/org/storage`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`${BASE}/org/storage`, {
      method: "DELETE",
      body: JSON.stringify({ id }),
    }),
};

export interface RosterSnapshotRow {
  id: string;
  team_season_id: string;
  player_id: string;
  jersey_number?: number | null;
  position?: string | null;
  is_active: boolean;
  status: string;
  captured_at: string;
  players?: { canonical_name: string; photo_url: string } | null;
  created_at: string;
}

export const rosterApi = {
  list: (teamSeasonId: string) =>
    request<RosterSnapshotRow[]>(
      `${BASE}/teams/roster?team_season_id=${encodeURIComponent(teamSeasonId)}`,
    ),
  create: (teamSeasonId: string) =>
    request<RosterSnapshotRow[]>(`${BASE}/teams/roster`, {
      method: "POST",
      body: JSON.stringify({ team_season_id: teamSeasonId }),
    }),
  remove: (id: string) =>
    request<void>(`${BASE}/teams/roster?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};

// ── Academy Reference (consolidated) ──

export interface AcademyRefData {
  programs: unknown[];
  trainers: unknown[];
  locations: unknown[];
  students: unknown[];
  profile: unknown[];
}

export const academyRefApi = {
  get: () => request<AcademyRefData>(`${BASE}/academy/reference`),
};

// ── Teams Context (consolidated) ──

export interface TeamsContextData {
  teamSeasons: unknown[];
  players: unknown[];
}

export const teamsContextApi = {
  get: () => request<TeamsContextData>(`${BASE}/teams/context`),
};

// ── Org Reference (consolidated) ──

export interface OrgRefData {
  orgs: unknown[];
}

export const orgRefApi = {
  get: () => request<OrgRefData>(`${BASE}/org/reference`),
};

// ── Catalog Reference (consolidated) ──

export interface CatalogRefData {
  competitions: unknown[];
  seasons: unknown[];
  sports: unknown[];
  leagues: unknown[];
  venues: unknown[];
  players: unknown[];
}

export const catalogRefApi = {
  get: () => request<CatalogRefData>(`${BASE}/catalog/reference`),
};

// ── Transfers ──

export interface TransferRow {
  id: string;
  player_id: string;
  from_team_season_id: string | null;
  to_team_season_id: string;
  transfer_type: string;
  approved_by: string | null;
  approved_at: string | null;
  effective_from: string;
  effective_until: string | null;
  note: string | null;
  created_by: string;
  created_at: string;
  players?: { canonical_name: string } | null;
  teams_from?: { team_id: string; teams: { name: string } | null } | null;
  teams_to?: { team_id: string; teams: { name: string } | null } | null;
}

export const transfersApi = {
  list: (params?: Record<string, string>) =>
    request<TransferRow[]>(
      `${BASE}/org/transfers${params ? `?${new URLSearchParams(params).toString()}` : ""}`,
    ),
  create: (data: Record<string, unknown>) =>
    request<TransferRow>(`${BASE}/org/transfers`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Identity Disputes ──

export interface IdentityDisputeRow {
  id: string;
  player_id: string;
  competition_id: string | null;
  dispute_reason: string;
  description: string;
  evidence_notes: string | null;
  status: string;
  resolution_notes: string | null;
  submitted_at: string;
  players?: { canonical_name: string; photo_url: string | null } | null;
  competitions?: { name: string } | null;
}

export const identityDisputesApi = {
  list: (status?: string) =>
    request<IdentityDisputeRow[]>(
      `${BASE}/org/identity-disputes${status ? `?status=${status}` : ""}`,
    ),
  create: (data: Record<string, unknown>) =>
    request<IdentityDisputeRow>(`${BASE}/org/identity-disputes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  resolve: (id: string, status: string, resolutionNotes?: string) =>
    request<IdentityDisputeRow>(`${BASE}/org/identity-disputes`, {
      method: "POST",
      body: JSON.stringify({ id, status, resolution_notes: resolutionNotes }),
    }),
};
