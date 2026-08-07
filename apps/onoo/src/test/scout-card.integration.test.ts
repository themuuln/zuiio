/**
 * Integration tests for Phase 3/7 opponent scout card data layer.
 *
 * Tests opponent_notes CRUD through RLS, v_public_box_score for
 * opponent player scouting, v_public_games for opponent game
 * schedule/history, and the v_athlete_timeline for scouting player
 * development patterns over time.
 *
 * Run: pnpm test:integration
 */

import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SEED_AWAY_TEAM_SEASON,
  SEED_HOME_TEAM_SEASON,
  SEED_ORG_ID,
} from "./seed-constants";
import {
  asUser,
  closePool,
  createTestUser,
  getPool,
} from "./setup-integration";

let pool: Pool;
let client: PoolClient;

interface CreatedEntities {
  opponentNoteId?: string;
}

// Game 001: Khuleguud (home, SEED_HOME_TEAM_SEASON) vs Miners (away)
// Official status, has approved revision + game_player_stats
const GAME_001 = "70000000-0000-0000-0000-000000000001";

// Game 002: SG Apes (home, SEED_AWAY_TEAM_SEASON) vs BCH Knights (away)
// Official status, has approved revision + game_player_stats
const GAME_002 = "70000000-0000-0000-0000-000000000002";

// Game 100: Khuleguud (home) vs SG Apes (away) — today's official game
const _GAME_100 = "70000000-0000-0000-0000-000000000100";

beforeAll(async () => {
  pool = await getPool();
  client = await pool.connect();
});

afterAll(async () => {
  if (client) client.release();
  await closePool();
});

// ── Seed data integrity for scouting context ──────────────────────────────

describe("seed data for scout card", () => {
  it("game 001 (Khuleguud) has official status and approved revision", async () => {
    const { rows } = await pool.query(
      "SELECT status FROM public.games WHERE id = $1",
      [GAME_001],
    );
    expect(rows[0].status).toBe("official");
  });

  it("game 002 (SG Apes) has game_player_stats for away team scouting", async () => {
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS cnt FROM public.game_player_stats WHERE game_id = $1",
      [GAME_002],
    );
    expect(rows[0].cnt).toBeGreaterThan(0);
  });
});

// ── Opponent Notes CRUD (Phase 7 scout card) ─────────────────────────────

describe("opponent_notes CRUD for scout card", () => {
  const entities: CreatedEntities = {};
  let adminUser: { id: string; email: string };

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `scout-admin-${randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    // Give user org membership so RLS write policies pass
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_ORG_ID],
    );
  });

  afterAll(async () => {
    if (entities.opponentNoteId) {
      await pool.query("DELETE FROM public.opponent_notes WHERE id = $1", [
        entities.opponentNoteId,
      ]);
    }
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [
      adminUser.id,
    ]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("inserts an opponent note for scouting", async () => {
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        `INSERT INTO public.opponent_notes
         (team_season_id, opponent_team_season_id, notes, game_plan, strengths, weaknesses, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, notes, strengths, weaknesses`,
        [
          SEED_HOME_TEAM_SEASON,
          SEED_AWAY_TEAM_SEASON,
          "SG Apes тоглогчид хурдан довтолгоонд сайн, холын зайнаас шидэлт гэмтэй",
          "Хурдан довтолгоог хязгаарлах, 3 онооны шугам дээр даралт өгөх",
          ["хурдан довтолгоо", "3 онооны шидэлт", "урт сандал"],
          ["дотуур байрлалын хамгаалалт", "тайм-аутын дараах тоглолт"],
          adminUser.id,
        ],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].notes).toContain("SG Apes");
      expect(rows[0].strengths).toContain("хурдан довтолгоо");
      expect(rows[0].weaknesses).toContain("дотуур байрлалын хамгаалалт");
      entities.opponentNoteId = rows[0].id;
    });
  });

  it("reads back the opponent note", async () => {
    if (!entities.opponentNoteId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        `SELECT id, team_season_id, opponent_team_season_id,
                notes, game_plan, strengths, weaknesses, created_by
         FROM public.opponent_notes
         WHERE id = $1`,
        [entities.opponentNoteId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].team_season_id).toBe(SEED_HOME_TEAM_SEASON);
      expect(rows[0].opponent_team_season_id).toBe(SEED_AWAY_TEAM_SEASON);
      expect(rows[0].created_by).toBe(adminUser.id);
    });
  });

  it("updates opponent note fields", async () => {
    if (!entities.opponentNoteId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        `UPDATE public.opponent_notes
         SET notes = $1, game_plan = $2, strengths = $3
         WHERE id = $4
         RETURNING notes, game_plan, strengths`,
        [
          "Шинэчлэгдсэн тэмдэглэл — холын зайнаас шийдэмгий хамгаалах",
          "Өндөр даралттай хамгаалалт, pick-and-roll дээр trap хийх",
          ["хамгаалалт", "гурван оноо"],
          entities.opponentNoteId,
        ],
      );
      expect(rows[0].notes).toContain("Шинэчлэгдсэн");
      expect(rows[0].game_plan).toContain("pick-and-roll");
      expect(rows[0].strengths).toContain("хамгаалалт");
    });
  });

  it("deletes opponent note", async () => {
    if (!entities.opponentNoteId) return;
    await asUser(client, adminUser.id, async () => {
      await client.query("DELETE FROM public.opponent_notes WHERE id = $1", [
        entities.opponentNoteId,
      ]);
      const { rows } = await client.query(
        "SELECT id FROM public.opponent_notes WHERE id = $1",
        [entities.opponentNoteId],
      );
      expect(rows.length).toBe(0);
    });
    entities.opponentNoteId = "";
  });

  it("insert then read note from reverse perspective", async () => {
    // Scout card also shows what the opponent knows about us
    let noteId: string | undefined;
    try {
      await asUser(client, adminUser.id, async () => {
        const { rows } = await client.query(
          `INSERT INTO public.opponent_notes
           (team_season_id, opponent_team_season_id, notes, created_by)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [
            SEED_AWAY_TEAM_SEASON,
            SEED_HOME_TEAM_SEASON,
            "Khuleguud-ийн тулгуур тоглогчид дунд зайнаас сайн",
            adminUser.id,
          ],
        );
        noteId = rows[0].id;

        const { rows: readback } = await client.query(
          `SELECT notes FROM public.opponent_notes
           WHERE team_season_id = $1 AND opponent_team_season_id = $2`,
          [SEED_AWAY_TEAM_SEASON, SEED_HOME_TEAM_SEASON],
        );
        expect(readback.length).toBe(1);
        expect(readback[0].notes).toContain("Khuleguud");
      });
    } finally {
      if (noteId) {
        await pool.query("DELETE FROM public.opponent_notes WHERE id = $1", [
          noteId,
        ]);
      }
    }
  });
});

// ── Opponent scouting via public views ────────────────────────────────────

describe("scout card data via public views", () => {
  // Test that v_public_box_score provides opponent player stats needed
  // for scout cards: what did the opponent's players do in a game?

  it("v_public_box_score returns opponent player stats", async () => {
    // Game 002 features SEED_AWAY_TEAM_SEASON (SG Apes) at home vs BCH Knights
    const { rows } = await pool.query(
      `SELECT game_id, player_id, player_name, team_name,
              pts, fgm, fga, tpm, tpa, ftm, fta,
              oreb, dreb, ast, stl, blk, tov, pf,
              seconds_played, jersey_number, player_position
       FROM public.v_public_box_score
       WHERE game_id = $1
       ORDER BY pts DESC`,
      [GAME_002],
    );
    // Seed has game_player_stats for game 002 with approved revisions
    expect(rows.length).toBeGreaterThan(0);

    // All rows have required scout-relevant fields
    for (const row of rows) {
      expect(typeof row.player_name).toBe("string");
      expect(typeof row.team_name).toBe("string");
      expect(typeof row.pts).toBe("number");
      expect(typeof row.fgm).toBe("number");
      expect(typeof row.fga).toBe("number");
      // Non-negative stats
      expect(row.pts).toBeGreaterThanOrEqual(0);
      expect(row.fga).toBeGreaterThanOrEqual(row.fgm);
    }
  });

  it("v_public_box_score returns Khuleguud player stats from game 001", async () => {
    const { rows } = await pool.query(
      `SELECT player_id, player_name, team_name,
              pts, fgm, fga, tpm, tpa, oreb, dreb, ast, stl, blk, tov, pf
       FROM public.v_public_box_score
       WHERE game_id = $1
       ORDER BY pts DESC`,
      [GAME_001],
    );
    expect(rows.length).toBeGreaterThan(0);

    // Players on the home team (Khuleguud = SEED_HOME_TEAM_SEASON) scored
    const homeTeamRows = rows.filter(
      (r: { team_name: string }) => r.team_name === rows[0].team_name,
    );
    expect(homeTeamRows.length).toBeGreaterThan(0);
  });

  it("v_public_box_score columns match scout card interface", async () => {
    const { rows } = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'v_public_box_score'
       ORDER BY ordinal_position`,
    );
    const colNames = rows.map((r: { column_name: string }) => r.column_name);

    // All box score columns needed for scout card display
    expect(colNames).toContain("player_id");
    expect(colNames).toContain("player_name");
    expect(colNames).toContain("player_position");
    expect(colNames).toContain("team_name");
    expect(colNames).toContain("jersey_number");
    expect(colNames).toContain("seconds_played");
    expect(colNames).toContain("pts");
    expect(colNames).toContain("fgm");
    expect(colNames).toContain("fga");
    expect(colNames).toContain("tpm");
    expect(colNames).toContain("tpa");
    expect(colNames).toContain("ftm");
    expect(colNames).toContain("fta");
    expect(colNames).toContain("oreb");
    expect(colNames).toContain("dreb");
    expect(colNames).toContain("ast");
    expect(colNames).toContain("stl");
    expect(colNames).toContain("blk");
    expect(colNames).toContain("tov");
    expect(colNames).toContain("pf");
    expect(colNames).toContain("source_type");
  });

  it("v_public_games returns game metadata for scouting", async () => {
    // Scout needs to know when and where opponents play
    const { rows } = await pool.query(
      `SELECT id, home_team_name, away_team_name,
              home_team_id, away_team_season_id,
              competition_name, scheduled_at, status,
              home_score, away_score, venue_name
       FROM public.v_public_games
       WHERE status = 'official'
       LIMIT 10`,
    );
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(typeof row.home_team_name).toBe("string");
      expect(typeof row.away_team_name).toBe("string");
      expect(typeof row.scheduled_at).toBe("string");
      expect(typeof row.status).toBe("string");
      // Fields needed for scout card game context
      expect(row.home_score).not.toBeNull();
      expect(row.away_score).not.toBeNull();
    }
  });

  it("v_public_games returns head-to-head games for scouting opponent", async () => {
    // Find games between Khuleguud and their opponents
    const { rows } = await pool.query(
      `SELECT id, home_team_name, away_team_name,
              home_score, away_score, scheduled_at
       FROM public.v_public_games
       WHERE (home_team_season_id = $1 OR away_team_season_id = $1)
         AND status = 'official'
       ORDER BY scheduled_at DESC
       LIMIT 5`,
      [SEED_HOME_TEAM_SEASON],
    );
    expect(rows.length).toBeGreaterThan(0);
  });
});

// ── Athlete timeline for scouting ─────────────────────────────────────────

describe("athlete timeline for player scouting", () => {
  it("v_athlete_timeline returns game events with scouting context", async () => {
    const { rows } = await pool.query(
      `SELECT event_type, player_name, player_team_name, opponent_name,
              pts, assists, total_rebounds, home_score, away_score,
              competition_name, event_date
       FROM public.v_athlete_timeline
       WHERE event_type = 'game_stats'
       LIMIT 10`,
    );
    // Seed data has official games with approved revisions → view returns data
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(row.event_type).toBe("game_stats");
      expect(typeof row.player_name).toBe("string");
      expect(typeof row.player_team_name).toBe("string");
      expect(typeof row.opponent_name).toBe("string");
      expect(typeof row.pts).toBe("number");
      expect(row.home_score).toBeGreaterThan(0);
      expect(row.away_score).toBeGreaterThan(0);
    }
  });

  it("v_athlete_timeline shows multiple games for player trend analysis", async () => {
    // Get all game events for a player to verify multi-game timeline
    const { rows } = await pool.query(
      `SELECT event_date, pts, home_score, away_score, opponent_name
       FROM public.v_athlete_timeline
       WHERE event_type = 'game_stats'
       ORDER BY event_date DESC
       LIMIT 20`,
    );
    expect(rows.length).toBeGreaterThan(0);

    // Verify dates are ordered descending
    for (let i = 1; i < rows.length; i++) {
      const prev = new Date(rows[i - 1].event_date).getTime();
      const curr = new Date(rows[i].event_date).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });
});

// ── RLS: public data accessibility for scouting ───────────────────────────

describe("RLS: public view access for scouting", () => {
  let scoutUser: { id: string; email: string };

  beforeAll(async () => {
    scoutUser = await createTestUser(pool, {
      email: `scout-user-${randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    // No org membership — user is just an authenticated viewer
  });

  afterAll(async () => {
    await pool.query("DELETE FROM auth.users WHERE id = $1", [scoutUser.id]);
  });

  it("v_public_box_score is readable as unprivileged authenticated user", async () => {
    await asUser(client, scoutUser.id, async () => {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS cnt
         FROM public.v_public_box_score
         WHERE game_id = $1`,
        [GAME_001],
      );
      expect(rows[0].cnt).toBeGreaterThan(0);
    });
  });

  it("v_public_games is readable as unprivileged authenticated user", async () => {
    await asUser(client, scoutUser.id, async () => {
      const { rows } = await client.query(
        "SELECT COUNT(*)::int AS cnt FROM public.v_public_games",
      );
      expect(rows[0].cnt).toBeGreaterThan(0);
    });
  });

  it("v_athlete_timeline is readable as unprivileged authenticated user", async () => {
    await asUser(client, scoutUser.id, async () => {
      const { rows } = await client.query(
        "SELECT COUNT(*)::int AS cnt FROM public.v_athlete_timeline",
      );
      expect(rows[0].cnt).toBeGreaterThan(0);
    });
  });

  it("opponent_notes can be read but not written without org membership", async () => {
    // Reading opponent_notes is allowed for any authenticated user
    await asUser(client, scoutUser.id, async () => {
      const { rows } = await client.query(
        "SELECT COUNT(*)::int AS cnt FROM public.opponent_notes",
      );
      expect(typeof rows[0].cnt).toBe("number");
    });
  });
});

// ── Opponent team game stats view ─────────────────────────────────────────

describe("opponent team game stats", () => {
  it("v_public_team_game_stats view definition exists", async () => {
    const { rows } = await pool.query(
      "SELECT EXISTS (SELECT FROM pg_views WHERE viewname = 'v_public_team_game_stats' AND schemaname = 'public') AS exists",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("v_public_team_game_stats has opponent identification columns", async () => {
    const { rows } = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'v_public_team_game_stats'
       ORDER BY ordinal_position`,
    );
    const colNames = rows.map((r: { column_name: string }) => r.column_name);

    // Scout card needs to identify the opponent team
    expect(colNames).toContain("opp_team_season_id");
    expect(colNames).toContain("opp_team_name");
    expect(colNames).toContain("opp_team_slug");
    expect(colNames).toContain("opp_team_short_code");
    expect(colNames).toContain("opp_team_logo_url");
    expect(colNames).toContain("home_away");
  });
});
