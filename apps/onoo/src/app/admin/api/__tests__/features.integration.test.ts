// @vitest-environment node
/**
 * Integration tests for core Onoo features against a real Postgres database.
 * Run: supabase start && pnpm test:integration
 */

import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  asUser,
  closePool,
  createTestUsers,
  newPool,
} from "@/test/setup-integration";

let pool: Pool;
let client: PoolClient;

beforeAll(async () => {
  pool = newPool();
  client = await pool.connect();
});
afterAll(async () => {
  client.release();
  await closePool();
});
beforeEach(async () => {
  /* cleanTables intentionally not called — other integration tests rely on seed data */
});

type H = Record<string, any>;

let _hierarchyCounter = 0;
async function hierarchy(pool: Pool): Promise<H> {
  const id = crypto.randomUUID().slice(0, 8);
  const tag = `h${++_hierarchyCounter}_${id}`;
  const org = (
    await pool.query(
      "INSERT INTO public.organizations (name,type,slug) VALUES ($1,'league_operator',$2) RETURNING *",
      [`TO_${tag}`, `org-${tag}`],
    )
  ).rows[0];
  const sport = (
    await pool.query(
      "INSERT INTO public.sports (key,name_mn,name_en,config) VALUES ($1,'T','T','{}'::jsonb) ON CONFLICT (key) DO UPDATE SET name_en = excluded.name_en RETURNING *",
      [`sport_${tag}`],
    )
  ).rows[0];
  const league = (
    await pool.query(
      "INSERT INTO public.leagues (organization_id,sport_id,name,slug) VALUES ($1,$2,$3,$3) RETURNING *",
      [org.id, sport.id, `L_${tag}`],
    )
  ).rows[0];
  const season = (
    await pool.query(
      "INSERT INTO public.seasons (league_id,name,starts_on,ends_on) VALUES ($1,$2,'2026-01-01','2026-12-31') RETURNING *",
      [league.id, `S_${tag}`],
    )
  ).rows[0];
  const comp = (
    await pool.query(
      "INSERT INTO public.competitions (season_id,name,type) VALUES ($1,$2,'regular') RETURNING *",
      [season.id, `C_${tag}`],
    )
  ).rows[0];
  const venue = (
    await pool.query(
      "INSERT INTO public.venues (name,city) VALUES ($1,$2) RETURNING *",
      [`V_${tag}`, "U"],
    )
  ).rows[0];
  const ruleset = (
    await pool.query(
      "INSERT INTO public.basketball_rulesets (league_id,version,name,rules,effective_from) VALUES ($1,$2,$3,'{}'::jsonb,'2026-01-01') RETURNING *",
      [league.id, `v${tag}`, `F_${tag}`],
    )
  ).rows[0];
  const t1 = (
    await pool.query(
      "INSERT INTO public.teams (league_id,name,short_code,slug) VALUES ($1,$2,$3,$3) RETURNING *",
      [league.id, `A_${tag}`, `a${tag}`],
    )
  ).rows[0];
  const t2 = (
    await pool.query(
      "INSERT INTO public.teams (league_id,name,short_code,slug) VALUES ($1,$2,$3,$3) RETURNING *",
      [league.id, `B_${tag}`, `b${tag}`],
    )
  ).rows[0];
  const ts1 = (
    await pool.query(
      "INSERT INTO public.team_seasons (team_id,competition_id) VALUES ($1,$2) RETURNING *",
      [t1.id, comp.id],
    )
  ).rows[0];
  const ts2 = (
    await pool.query(
      "INSERT INTO public.team_seasons (team_id,competition_id) VALUES ($1,$2) RETURNING *",
      [t2.id, comp.id],
    )
  ).rows[0];
  return {
    org,
    league,
    competition: comp,
    venue,
    ruleset,
    teamSeason1: ts1,
    teamSeason2: ts2,
  };
}

async function createGame(client: PoolClient, h: H) {
  return (
    await client.query(
      "INSERT INTO public.games (competition_id,ruleset_id,home_team_season_id,away_team_season_id,venue_id,scheduled_at) VALUES ($1,$2,$3,$4,$5,now()) RETURNING *",
      [
        h.competition.id,
        h.ruleset.id,
        h.teamSeason1.id,
        h.teamSeason2.id,
        h.venue.id,
      ],
    )
  ).rows[0];
}

/** Grant the user membership so cmd_transition_game authorizes them. */
async function addOwnerMembership(pool: Pool, userId: string, orgId: string) {
  await pool.query(
    "INSERT INTO public.memberships (user_id,scope_type,scope_id,role) VALUES ($1,'org',$2,'owner') ON CONFLICT DO NOTHING",
    [userId, orgId],
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RLS: Profiles
// ═══════════════════════════════════════════════════════════════════════

describe("RLS — profiles", () => {
  it("user sees only own profile", async () => {
    const [alice, bob] = await createTestUsers(pool, 2);
    await client.query(
      "INSERT INTO public.profiles (id,display_name) VALUES ($1,'Alice')",
      [alice.id],
    );

    const a = await asUser(
      client,
      alice.id,
      async () =>
        (await client.query("SELECT display_name FROM public.profiles")).rows,
    );
    expect(a).toHaveLength(1);
    expect(a[0].display_name).toBe("Alice");

    const b = await asUser(
      client,
      bob.id,
      async () =>
        (await client.query("SELECT display_name FROM public.profiles")).rows,
    );
    expect(b).toHaveLength(0);
  });

  it("user updates own profile, cannot update others'", async () => {
    const [alice, bob] = await createTestUsers(pool, 2);
    await client.query(
      "INSERT INTO public.profiles (id,display_name) VALUES ($1,'Alice')",
      [alice.id],
    );

    await asUser(client, alice.id, async () => {
      await client.query(
        "UPDATE public.profiles SET display_name='Alice v2' WHERE id=$1",
        [alice.id],
      );
    });
    expect(
      (
        await client.query(
          "SELECT display_name FROM public.profiles WHERE id=$1",
          [alice.id],
        )
      ).rows[0].display_name,
    ).toBe("Alice v2");

    await asUser(client, bob.id, async () => {
      await client.query(
        "UPDATE public.profiles SET display_name='Hacked' WHERE id=$1",
        [alice.id],
      );
    });
    expect(
      (
        await client.query(
          "SELECT display_name FROM public.profiles WHERE id=$1",
          [alice.id],
        )
      ).rows[0].display_name,
    ).toBe("Alice v2");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// RLS: Memberships
// ═══════════════════════════════════════════════════════════════════════

describe("RLS — memberships", () => {
  it("user sees only own memberships", async () => {
    const [alice, bob] = await createTestUsers(pool, 2);
    const h = await hierarchy(pool);
    await pool.query(
      "INSERT INTO public.memberships (user_id,scope_type,scope_id,role) VALUES ($1,'org',$2,'owner')",
      [alice.id, h.org.id],
    );
    await pool.query(
      "INSERT INTO public.memberships (user_id,scope_type,scope_id,role) VALUES ($1,'org',$2,'manager')",
      [bob.id, h.org.id],
    );

    // Alice (org owner) sees all memberships in the org via admin_read_memberships policy
    const am = await asUser(
      client,
      alice.id,
      async () =>
        (await client.query("SELECT role FROM public.memberships")).rows,
    );
    expect(am).toHaveLength(2);
    expect(am.map((r: { role: string }) => r.role).sort()).toEqual([
      "manager",
      "owner",
    ]);

    const bm = await asUser(
      client,
      bob.id,
      async () =>
        (await client.query("SELECT role FROM public.memberships")).rows,
    );
    expect(bm).toHaveLength(1);
    expect(bm[0].role).toBe("manager");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Game lifecycle
// ═══════════════════════════════════════════════════════════════════════

describe("Game lifecycle", () => {
  it("transitions through valid statuses", async () => {
    const [admin] = await createTestUsers(pool, 1);
    const h = await hierarchy(pool);
    await addOwnerMembership(pool, admin.id, h.org.id);
    const game = await createGame(client, h);

    await client.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
      admin.id,
    ]);
    await client.query(
      "SELECT public.cmd_transition_game($1,'live_provisional')",
      [game.id],
    );
    expect(
      (
        await client.query("SELECT status FROM public.games WHERE id=$1", [
          game.id,
        ])
      ).rows[0].status,
    ).toBe("live_provisional");

    await client.query(
      "SELECT public.cmd_transition_game($1,'final_pending_review')",
      [game.id],
    );
    await client.query(
      "SELECT public.cmd_transition_game($1,'league_verified')",
      [game.id],
    );
    await client.query("SELECT public.cmd_transition_game($1,'official')", [
      game.id,
    ]);
    expect(
      (
        await client.query("SELECT status FROM public.games WHERE id=$1", [
          game.id,
        ])
      ).rows[0].status,
    ).toBe("official");
  });

  it("rejects invalid transition", async () => {
    const [admin] = await createTestUsers(pool, 1);
    const h = await hierarchy(pool);
    await addOwnerMembership(pool, admin.id, h.org.id);
    const game = await createGame(client, h);

    await client.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
      admin.id,
    ]);
    await expect(
      client.query("SELECT public.cmd_transition_game($1,'official')", [
        game.id,
      ]),
    ).rejects.toThrow();
  });

  it("full lifecycle: game persists scores and status", async () => {
    const [admin] = await createTestUsers(pool, 1);
    const h = await hierarchy(pool);
    await addOwnerMembership(pool, admin.id, h.org.id);
    const game = await createGame(client, h);

    await client.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
      admin.id,
    ]);
    const src = (
      await client.query(
        "INSERT INTO public.source_submissions (game_id,source_type,submitted_by,normalized_payload,status,reviewed_by,reviewed_at) VALUES ($1,'official_score_sheet',$2,'{}'::jsonb,'approved',$2,now()) RETURNING id",
        [game.id, admin.id],
      )
    ).rows[0];
    await client.query(
      "INSERT INTO public.game_revisions (game_id,revision_number,source_submission_id,state,journal,projection,created_by,created_at,approved_by,approved_at) VALUES ($1,1,$2,'approved','[]'::jsonb,jsonb_build_object('home_score',$3::int,'away_score',$4::int),$5,now(),$5,now())",
      [game.id, src.id, 100, 80, admin.id],
    );
    await client.query(
      "UPDATE public.games SET home_score=$1,away_score=$2,current_revision_number=1 WHERE id=$3",
      [100, 80, game.id],
    );
    await client.query(
      "SELECT public.cmd_transition_game($1,'live_provisional')",
      [game.id],
    );
    await client.query(
      "SELECT public.cmd_transition_game($1,'final_pending_review')",
      [game.id],
    );
    await client.query(
      "SELECT public.cmd_transition_game($1,'league_verified')",
      [game.id],
    );

    const g = (
      await client.query(
        "SELECT home_score,away_score,status FROM public.games WHERE id=$1",
        [game.id],
      )
    ).rows[0];
    expect(g.status).toBe("league_verified");
    expect(g.home_score).toBe(100);
    expect(g.away_score).toBe(80);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Derived table protection
// ═══════════════════════════════════════════════════════════════════════

describe("Derived table protection", () => {
  it("authenticated cannot direct-INSERT into season_player_stats", async () => {
    const [user] = await createTestUsers(pool, 1);
    const h = await hierarchy(pool);
    await pool.query(
      "INSERT INTO public.players (canonical_name,nationality) VALUES ('TP','MN')",
    );

    await expect(
      asUser(client, user.id, async () => {
        await client.query(
          "INSERT INTO public.season_player_stats (competition_id,player_id,team_season_id,gp,pts) VALUES ($1,(SELECT id FROM public.players LIMIT 1),$2,1,10)",
          [h.competition.id, h.teamSeason1.id],
        );
      }),
    ).rejects.toThrow();
  });
});
