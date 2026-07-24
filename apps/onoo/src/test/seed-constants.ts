/**
 * Deterministic UUIDs from supabase/seed.sql — single source of truth
 * for integration tests that reference seed data.
 *
 * Whenever seed.sql changes these, update here too.
 */

// ── Auth ───────────────────────────────────────────────────────────────────
export const SEED_ADMIN_ID = "397692e0-915f-4361-9f75-f84d0883ba80";

// ── Sports ─────────────────────────────────────────────────────────────────
export const SEED_SPORT_ID = "a0000000-0000-0000-0000-000000000001";

// ── Organizations ───────────────────────────────────────────────────────────
export const SEED_ORG_ID = "b0000000-0000-0000-0000-000000000001";

// ── Leagues ─────────────────────────────────────────────────────────────────
export const SEED_LEAGUE_ID = "c0000000-0000-0000-0000-000000000001";
export const SEED_LEAGUE_SPACE_ID = "c0000000-0000-0000-0000-000000000002";

// ── Competitions ────────────────────────────────────────────────────────────
export const SEED_COMPETITION_ID = "e0000000-0000-0000-0000-000000000001";

// ── Venues ──────────────────────────────────────────────────────────────────
export const SEED_VENUE_ID = "f0000000-0000-0000-0000-000000000001";

// ── Rulesets ────────────────────────────────────────────────────────────────
export const SEED_RULESET_ID = "90000000-0000-0000-0000-000000000001";

// ── Team Seasons ────────────────────────────────────────────────────────────
/** Khuleguud (home team in most test games) */
export const SEED_HOME_TEAM_SEASON = "30000000-0000-0000-0000-000000000001";
/** SG Apes (away team in most test games) */
export const SEED_AWAY_TEAM_SEASON = "30000000-0000-0000-0000-000000000002";

// ── Players — Khuleguud ────────────────────────────────────────────────────
export const SEED_HOME_PLAYER = "50000000-0000-0000-0000-000000000001";
export const SEED_HOME_PLAYER_2 = "50000000-0000-0000-0000-000000000002";

// ── Players — SG Apes ──────────────────────────────────────────────────────
export const SEED_AWAY_PLAYER = "50000000-0000-0000-0000-000000000020";
export const SEED_AWAY_PLAYER_2 = "50000000-0000-0000-0000-000000000021";
