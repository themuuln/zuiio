/**
 * Integration tests for seed data integrity.
 *
 * Verifies that the reference data loaded by supabase/seed.sql is present
 * and that all cross-table foreign-key relationships are valid.
 *
 * Run: pnpm test:integration
 */

import { afterAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "./setup-integration";

describe("seed data integrity", () => {
  afterAll(async () => {
    await closePool();
  });

  it("sports contains basketball_5x5", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(
      "SELECT * FROM public.sports WHERE key = $1",
      ["basketball_5x5"],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].name_en).toBe("Basketball 5x5");
    expect(rows[0].name_mn).toBe("Сагсан бөмбөг 5x5");
    expect(rows[0].config).toBeDefined();
    expect(rows[0].config.periods).toBe(4);
  });

  it("stat_event_types exist for basketball_5x5", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(
      "SELECT key, category FROM public.stat_event_types WHERE sport_key = $1 ORDER BY key",
      ["basketball_5x5"],
    );
    expect(rows.length).toBeGreaterThanOrEqual(14);
    const keys = rows.map((r: { key: string }) => r.key);
    expect(keys).toContain("shot_2pt_made");
    expect(keys).toContain("shot_3pt_made");
    expect(keys).toContain("ft_made");
    expect(keys).toContain("rebound_off");
    expect(keys).toContain("steal");
    expect(keys).toContain("block");
    expect(keys).toContain("turnover");
    expect(keys).toContain("foul_personal");
  });

  it("organizations exist", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(
      "SELECT * FROM public.organizations ORDER BY name",
    );
    expect(rows.length).toBeGreaterThanOrEqual(2);
    const names = rows.map((r: { name: string }) => r.name);
    expect(names).toContain("Монголын Сагсан Бөмбөгийн Холбоо");
    expect(names).toContain("Спэйс Лиг ХХК");
  });

  it("leagues exist with correct org and sport references", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(`
      SELECT l.*, o.name AS org_name
      FROM public.leagues l
      JOIN public.organizations o ON o.id = l.organization_id
      JOIN public.sports s ON s.id = l.sport_id
      ORDER BY l.name
    `);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    const slugs = rows.map((r: { slug: string }) => r.slug);
    expect(slugs).toContain("the-league");
    expect(slugs).toContain("space-league");
    // Every league references a real sport
    for (const row of rows) {
      expect(row.sport_id).toBeTruthy();
      expect(row.org_name).toBeTruthy();
    }
  });

  it("seasons belong to leagues with valid date ranges", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(`
      SELECT s.*, l.name AS league_name
      FROM public.seasons s
      JOIN public.leagues l ON l.id = s.league_id
      ORDER BY s.name
    `);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    for (const row of rows) {
      expect(row.league_name).toBeTruthy();
      if (row.starts_on && row.ends_on) {
        expect(new Date(row.ends_on) >= new Date(row.starts_on)).toBe(true);
      }
    }
  });

  it("competitions have valid types and belong to seasons", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(`
      SELECT c.*, s.name AS season_name
      FROM public.competitions c
      JOIN public.seasons s ON s.id = c.season_id
      ORDER BY c.name
    `);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    const types = rows.map((r: { type: string }) => r.type);
    expect(types).toContain("regular");
    for (const row of rows) {
      expect(["regular", "playoff", "cup", "friendly"]).toContain(row.type);
    }
  });

  it("basketball rulesets exist for each league", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(`
      SELECT br.*, l.name AS league_name
      FROM public.basketball_rulesets br
      JOIN public.leagues l ON l.id = br.league_id
      WHERE br.rules->>'periods' IS NOT NULL
      ORDER BY br.name
    `);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    for (const row of rows) {
      expect(row.rules).toBeDefined();
      expect(row.rules.periods).toBeGreaterThan(0);
      expect(row.retired_at).toBeNull(); // Active rulesets
    }
  });

  it("teams belong to leagues with unique short codes", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(`
      SELECT t.*, l.name AS league_name
      FROM public.teams t
      JOIN public.leagues l ON l.id = t.league_id
      ORDER BY t.name
    `);
    expect(rows.length).toBeGreaterThanOrEqual(15); // 10 + 8 teams

    // Short codes must be unique per league
    const leagueCodes = new Map<string, Set<string>>();
    for (const row of rows) {
      const codes = leagueCodes.get(row.league_id) ?? new Set();
      expect(codes.has(row.short_code)).toBe(false);
      codes.add(row.short_code);
      leagueCodes.set(row.league_id, codes);
    }

    // Known teams exist
    const names = rows.map((r: { name: string }) => r.name);
    expect(names).toContain("Хасын Хүлэгүүд");
    expect(names).toContain("SG Apes");
    expect(names).toContain("BCH Knights");
  });

  it("team_seasons link teams to competitions correctly", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(`
      SELECT ts.*, t.name AS team_name, c.name AS competition_name
      FROM public.team_seasons ts
      JOIN public.teams t ON t.id = ts.team_id
      JOIN public.competitions c ON c.id = ts.competition_id
      ORDER BY t.name
    `);
    // The League has 10 teams × 1 competition, Space League has 8 teams × 1 competition
    expect(rows.length).toBeGreaterThanOrEqual(18);
    for (const row of rows) {
      expect(row.team_name).toBeTruthy();
      expect(row.competition_name).toBeTruthy();
    }
  });

  it("players exist and have valid positions", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(
      "SELECT id, canonical_name, position, nationality FROM public.players ORDER BY canonical_name",
    );
    expect(rows.length).toBeGreaterThanOrEqual(60); // ~10 teams × 10 players
    const validPositions = ["PG", "SG", "SF", "PF", "C"];
    for (const row of rows) {
      if (row.position !== null) {
        expect(validPositions).toContain(row.position);
      }
      expect(row.nationality).toBeTruthy();
    }
  });

  it("roster_entries assign players to team_seasons", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(`
      SELECT re.*, p.canonical_name AS player_name, t.name AS team_name
      FROM public.roster_entries re
      JOIN public.players p ON p.id = re.player_id
      JOIN public.team_seasons ts ON ts.id = re.team_season_id
      JOIN public.teams t ON t.id = ts.team_id
      ORDER BY p.canonical_name
    `);
    expect(rows.length).toBeGreaterThanOrEqual(50);
    for (const row of rows) {
      expect(row.jersey_number).toBeGreaterThanOrEqual(0);
      expect(row.jersey_number).toBeLessThanOrEqual(99);
      expect(row.left_at).toBeNull(); // No one has left yet
    }
  });

  it("venues exist with real Mongolian locations", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(
      "SELECT name, city, capacity FROM public.venues ORDER BY name",
    );
    expect(rows.length).toBeGreaterThanOrEqual(8);
    const cityCounts = new Map<string, number>();
    for (const row of rows) {
      cityCounts.set(row.city, (cityCounts.get(row.city) ?? 0) + 1);
    }
    // Ulaanbaatar has multiple venues
    expect((cityCounts.get("Улаанбаатар") ?? 0)).toBeGreaterThanOrEqual(5);
    // All capacities are positive or null
    for (const row of rows) {
      if (row.capacity !== null) {
        expect(row.capacity).toBeGreaterThan(0);
      }
    }
  });

  it("all seed UUIDs are unique across different entity types", async () => {
    // Check that the prefix-based UUID scheme has no collisions
    const pool = await getPool();
    const { rows: sports } = await pool.query("SELECT id FROM public.sports");
    const { rows: orgs } = await pool.query(
      "SELECT id FROM public.organizations",
    );
    const { rows: leagues } = await pool.query("SELECT id FROM public.leagues");
    const { rows: teams } = await pool.query("SELECT id FROM public.teams");
    const { rows: players } = await pool.query("SELECT id FROM public.players");
    const { rows: venues } = await pool.query("SELECT id FROM public.venues");

    const allIds = [
      ...sports.map((r: { id: string }) => r.id),
      ...orgs.map((r: { id: string }) => r.id),
      ...leagues.map((r: { id: string }) => r.id),
      ...teams.map((r: { id: string }) => r.id),
      ...players.map((r: { id: string }) => r.id),
      ...venues.map((r: { id: string }) => r.id),
    ];
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("seed admin user exists in auth.users", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(
      "SELECT id, email FROM auth.users WHERE email = 'seed-admin@onoo-test.mn'",
    );
    expect(rows.length).toBe(1);
    expect(rows[0].email).toBe("seed-admin@onoo-test.mn");
  });

  it("stat_event_types requires_player metadata is correct", async () => {
    const pool = await getPool();
    const { rows } = await pool.query(
      "SELECT key, requires_player FROM public.stat_event_types WHERE sport_key = 'basketball_5x5' ORDER BY key",
    );
    const requiresPlayer = new Map(
      rows.map((r: { key: string; requires_player: boolean }) => [
        r.key,
        r.requires_player,
      ]),
    );
    // Shot types require a player
    expect(requiresPlayer.get("shot_2pt_made")).toBe(true);
    expect(requiresPlayer.get("ft_made")).toBe(true);
    // Admin types may not
    expect(requiresPlayer.get("timeout")).toBe(false);
    expect(requiresPlayer.get("period_start")).toBe(false);
    expect(requiresPlayer.get("game_start")).toBe(false);
  });
});
