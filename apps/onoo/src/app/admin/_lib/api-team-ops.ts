/**
 * Team Operations API types and clients (Phase 9).
 */
import { request } from "./api";

const BASE = "/admin/api/teams";

// ── Staff ──────────────────────────────────────────────────────────────────
export interface TeamStaffRow {
  id: string;
  team_season_id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  team_seasons?: {
    id: string;
    team_id: string;
    teams?: { name: string };
  };
}

export interface CreateStaffPayload {
  team_season_id: string;
  user_id: string;
  role: string;
}

export const staffApi = {
  list: () => request<TeamStaffRow[]>(`${BASE}/staff`),
  create: (data: CreateStaffPayload) =>
    request<TeamStaffRow>(`${BASE}/staff`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`${BASE}/staff`, {
      method: "DELETE",
      body: JSON.stringify({ id }),
    }),
};

// ── Roster Availability ────────────────────────────────────────────────────
export interface RosterAvailabilityRow {
  id: string;
  team_season_id: string;
  player_id: string;
  game_date: string;
  status: "available" | "unavailable" | "maybe" | "injured";
  note: string | null;
  created_at: string;
  updated_at: string;
  players?: { canonical_name: string };
}

export interface CreateAvailabilityPayload {
  team_season_id: string;
  player_id: string;
  game_date: string;
  status: string;
  note?: string;
}

export const availabilityApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request<RosterAvailabilityRow[]>(`${BASE}/availability${qs}`);
  },
  upsert: (data: CreateAvailabilityPayload) =>
    request<RosterAvailabilityRow>(`${BASE}/availability`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`${BASE}/availability`, {
      method: "DELETE",
      body: JSON.stringify({ id }),
    }),
};

// ── Training Sessions ──────────────────────────────────────────────────────
export interface TrainingSessionRow {
  id: string;
  team_season_id: string;
  title: string;
  description: string | null;
  location: string | null;
  scheduled_at: string;
  duration_minutes: number;
  is_cancelled: boolean;
  created_by: string;
  created_at: string;
  team_seasons?: {
    id: string;
    teams?: { name: string };
  };
}

export interface CreateTrainingPayload {
  team_season_id: string;
  title: string;
  description?: string;
  location?: string;
  scheduled_at: string;
  duration_minutes: number;
}

export const trainingApi = {
  list: () => request<TrainingSessionRow[]>(`${BASE}/training`),
  create: (data: CreateTrainingPayload) =>
    request<TrainingSessionRow>(`${BASE}/training`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`${BASE}/training`, {
      method: "DELETE",
      body: JSON.stringify({ id }),
    }),
};

// ── Team Transactions ──────────────────────────────────────────────────────
export interface TeamTransactionRow {
  id: string;
  team_season_id: string;
  type: "due" | "expense" | "sponsorship";
  description: string;
  amount_mnt: number;
  due_date: string | null;
  paid_at: string | null;
  paid_by: string | null;
  created_by: string;
  created_at: string;
  team_seasons?: {
    id: string;
    teams?: { name: string };
  };
}

export interface CreateTransactionPayload {
  team_season_id: string;
  type: string;
  description: string;
  amount_mnt: number;
  due_date?: string;
}

export const transactionsApi = {
  list: () => request<TeamTransactionRow[]>(`${BASE}/transactions`),
  create: (data: CreateTransactionPayload) =>
    request<TeamTransactionRow>(`${BASE}/transactions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  markPaid: (id: string) =>
    request<TeamTransactionRow>(`${BASE}/transactions`, {
      method: "PUT",
      body: JSON.stringify({ id }),
    }),
};

// ── Opponent Notes ─────────────────────────────────────────────────────────
export interface OpponentNoteRow {
  id: string;
  team_season_id: string;
  opponent_team_season_id: string;
  notes: string | null;
  game_plan: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  team_seasons?: {
    id: string;
    teams?: { name: string };
  };
  opponent_team?: {
    teams?: { name: string };
  };
}

export interface CreateOpponentNotePayload {
  team_season_id: string;
  opponent_team_season_id: string;
  notes?: string;
  game_plan?: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface UpdateOpponentNotePayload {
  notes?: string;
  game_plan?: string;
  strengths?: string[];
  weaknesses?: string[];
}

export const opponentNotesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request<OpponentNoteRow[]>(`${BASE}/opponent-notes${qs}`);
  },
  create: (data: CreateOpponentNotePayload) =>
    request<OpponentNoteRow>(`${BASE}/opponent-notes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateOpponentNotePayload) =>
    request<OpponentNoteRow>(`${BASE}/opponent-notes`, {
      method: "PUT",
      body: JSON.stringify({ id, ...data }),
    }),
};
