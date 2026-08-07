// @vitest-environment node
import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

type H = Record<string, unknown>;

let _hcounter = 0;
async function hierarchy(): Promise<H> {
  const id = crypto.randomUUID().slice(0, 8);
  const tag = `ci${++_hcounter}_${id}`;
  const orgTag = `cio_${tag}`;
  const org = (
    await pool.query(
      "INSERT INTO public.organizations (name, type, slug) VALUES ($1, 'league_operator', $2) RETURNING *",
      [`CIO_${tag}`, orgTag],
    )
  ).rows[0];
  const sport = (
    await pool.query(
      `INSERT INTO public.sports (key, name_mn, name_en, config)
       VALUES ($1, 'T', 'T', '{}'::jsonb)
       ON CONFLICT (key) DO UPDATE SET name_en = excluded.name_en RETURNING *`,
      [`csport_${tag}`],
    )
  ).rows[0];
  const league = (
    await pool.query(
      "INSERT INTO public.leagues (organization_id, sport_id, name, slug) VALUES ($1, $2, $3, $3) RETURNING *",
      [org.id, sport.id, `CL_${tag}`],
    )
  ).rows[0];
  const season = (
    await pool.query(
      "INSERT INTO public.seasons (league_id, name, starts_on, ends_on) VALUES ($1, 'CI S' || $2, '2026-01-01', '2026-12-31') RETURNING *",
      [league.id, tag],
    )
  ).rows[0];
  const competition = (
    await pool.query(
      "INSERT INTO public.competitions (season_id, name) VALUES ($1, 'CI C' || $2) RETURNING *",
      [season.id, tag],
    )
  ).rows[0];
  const team = (
    await pool.query(
      "INSERT INTO public.teams (league_id, name, short_code, slug) VALUES ($1, 'CI T' || $2, $2, $2) RETURNING *",
      [league.id, tag],
    )
  ).rows[0];
  const teamSeason = (
    await pool.query(
      "INSERT INTO public.team_seasons (team_id, competition_id) VALUES ($1, $2) RETURNING *",
      [team.id, competition.id],
    )
  ).rows[0];
  const academy = (
    await pool.query(
      "INSERT INTO public.academy_profiles (organization_id, name) VALUES ($1, 'CI A' || $2) RETURNING *",
      [org.id, tag],
    )
  ).rows[0];
  return {
    org,
    sport,
    league,
    season,
    competition,
    team,
    teamSeason,
    academy,
    tag,
  };
}

describe("Horizon C — canonical identity RPCs", () => {
  let adminUser: { id: string; email: string };
  let h: H;

  beforeAll(async () => {
    [adminUser] = await createTestUsers(pool, 1);
    h = await hierarchy();
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin')",
      [adminUser.id, h.org.id],
    );
  });

  it("creates canonical link for a player", async () => {
    const player = (
      await pool.query(
        "INSERT INTO public.players (canonical_name, nationality) VALUES ($1, 'MN') RETURNING *",
        [`CI_P1_${h.tag}`],
      )
    ).rows[0];

    const cid = await asUser(client, adminUser.id, async () => {
      const r = await client.query(
        "SELECT public.cmd_create_canonical_link('player', $1::uuid) AS cid",
        [player.id],
      );
      return r.rows[0].cid;
    });

    expect(cid).toBeTruthy();
    const updated = (
      await pool.query(
        "SELECT canonical_identity_id FROM public.players WHERE id = $1",
        [player.id],
      )
    ).rows[0];
    expect(updated.canonical_identity_id).toBe(cid);
  });

  it("creates canonical link for a student", async () => {
    const student = (
      await pool.query(
        "INSERT INTO public.academy_students (academy_id, canonical_name) VALUES ($1, 'CI_S1_' || $2) RETURNING *",
        [h.academy.id, h.tag],
      )
    ).rows[0];

    const cid = await asUser(client, adminUser.id, async () => {
      const r = await client.query(
        "SELECT public.cmd_create_canonical_link('student', $1::uuid) AS cid",
        [student.id],
      );
      return r.rows[0].cid;
    });

    expect(cid).toBeTruthy();
    const updated = (
      await pool.query(
        "SELECT canonical_identity_id FROM public.academy_students WHERE id = $1",
        [student.id],
      )
    ).rows[0];
    expect(updated.canonical_identity_id).toBe(cid);
  });

  it("is idempotent", async () => {
    const player = (
      await pool.query(
        "INSERT INTO public.players (canonical_name, nationality) VALUES ($1, 'MN') RETURNING *",
        [`CI_P2_${h.tag}`],
      )
    ).rows[0];

    const id1 = await asUser(client, adminUser.id, async () => {
      const r = await client.query(
        "SELECT public.cmd_create_canonical_link('player', $1::uuid) AS cid",
        [player.id],
      );
      return r.rows[0].cid;
    });
    const id2 = await asUser(client, adminUser.id, async () => {
      const r = await client.query(
        "SELECT public.cmd_create_canonical_link('player', $1::uuid) AS cid",
        [player.id],
      );
      return r.rows[0].cid;
    });
    expect(id1).toBe(id2);
  });

  it("links student to user via cmd_link_student_to_user", async () => {
    const [playerUser] = await createTestUsers(pool, 1);
    const player = (
      await pool.query(
        "INSERT INTO public.players (canonical_name, nationality, user_id) VALUES ($1, 'MN', $2) RETURNING *",
        [`CI_P3_${h.tag}`, playerUser.id],
      )
    ).rows[0];

    const student = (
      await pool.query(
        "INSERT INTO public.academy_students (academy_id, canonical_name) VALUES ($1, 'CI_S2_' || $2) RETURNING *",
        [h.academy.id, h.tag],
      )
    ).rows[0];

    await asUser(client, adminUser.id, async () => {
      await client.query(
        "SELECT public.cmd_link_student_to_user($1::uuid, $2::uuid)",
        [student.id, playerUser.id],
      );
    });

    const s = (
      await pool.query(
        "SELECT user_id, canonical_identity_id FROM public.academy_students WHERE id = $1",
        [student.id],
      )
    ).rows[0];
    expect(s.user_id).toBe(playerUser.id);
    expect(s.canonical_identity_id).toBeTruthy();

    const p = (
      await pool.query(
        "SELECT canonical_identity_id FROM public.players WHERE id = $1",
        [player.id],
      )
    ).rows[0];
    expect(p.canonical_identity_id).toBe(s.canonical_identity_id);
  });

  it("returns athlete affiliations for linked entities", async () => {
    const [playerUser] = await createTestUsers(pool, 1);
    const _player = (
      await pool.query(
        "INSERT INTO public.players (canonical_name, nationality, user_id) VALUES ($1, 'MN', $2) RETURNING *",
        [`CI_P4_${h.tag}`, playerUser.id],
      )
    ).rows[0];
    const student = (
      await pool.query(
        "INSERT INTO public.academy_students (academy_id, canonical_name) VALUES ($1, 'CI_S3_' || $2) RETURNING *",
        [h.academy.id, h.tag],
      )
    ).rows[0];

    await asUser(client, adminUser.id, async () => {
      await client.query(
        "SELECT public.cmd_link_student_to_user($1::uuid, $2::uuid)",
        [student.id, playerUser.id],
      );
    });

    const ci = (
      await pool.query(
        "SELECT canonical_identity_id FROM public.academy_students WHERE id = $1",
        [student.id],
      )
    ).rows[0].canonical_identity_id;

    const result = await pool.query(
      "SELECT public.cmd_get_athlete_affiliations($1::uuid) AS affs",
      [ci],
    );
    const affs = result.rows[0].affs;
    expect(Array.isArray(affs)).toBe(true);
    expect(affs.length).toBe(2);
    const types = affs
      .map((a: { entity_type: string }) => a.entity_type)
      .sort();
    expect(types).toEqual(["player", "student"]);
  });

  it("merges canonical identities", async () => {
    const p1 = (
      await pool.query(
        "INSERT INTO public.players (canonical_name, nationality) VALUES ($1, 'MN') RETURNING *",
        [`CI_P5_${h.tag}`],
      )
    ).rows[0];
    const p2 = (
      await pool.query(
        "INSERT INTO public.players (canonical_name, nationality) VALUES ($1, 'MN') RETURNING *",
        [`CI_P6_${h.tag}`],
      )
    ).rows[0];

    const id1 = await asUser(client, adminUser.id, async () => {
      const r = await client.query(
        "SELECT public.cmd_create_canonical_link('player', $1::uuid) AS cid",
        [p1.id],
      );
      return r.rows[0].cid;
    });
    const id2 = await asUser(client, adminUser.id, async () => {
      const r = await client.query(
        "SELECT public.cmd_create_canonical_link('player', $1::uuid) AS cid",
        [p2.id],
      );
      return r.rows[0].cid;
    });
    expect(id1).not.toBe(id2);

    await asUser(client, adminUser.id, async () => {
      await client.query(
        "SELECT public.cmd_merge_canonical_identities($1::uuid, $2::uuid)",
        [id2, id1],
      );
    });

    const cids = (
      await pool.query(
        "SELECT canonical_identity_id FROM public.players WHERE id IN ($1, $2) ORDER BY canonical_name",
        [p1.id, p2.id],
      )
    ).rows.map(
      (r: { canonical_identity_id: string }) => r.canonical_identity_id,
    );
    expect(cids[0]).toBe(id1);
    expect(cids[1]).toBe(id1);

    const cnt = (
      await pool.query(
        "SELECT COUNT(*)::int AS c FROM public.canonical_identities WHERE id = $1",
        [id2],
      )
    ).rows[0].c;
    expect(cnt).toBe(0);
  });
});
