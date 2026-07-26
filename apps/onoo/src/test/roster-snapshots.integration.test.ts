import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SEED_ADMIN_ID,
  SEED_AWAY_TEAM_SEASON,
  SEED_COMPETITION_ID,
  SEED_HOME_PLAYER,
  SEED_HOME_TEAM_SEASON,
  SEED_ORG_ID,
} from "./seed-constants";
import { createTestUser, newPool } from "./setup-integration";

const TEST_TS_ID = SEED_HOME_TEAM_SEASON;
const TEST_TS_ID_SG = SEED_AWAY_TEAM_SEASON;

let pool: Pool;
let client: PoolClient;

async function authAs(userId: string, fn: () => Promise<void>) {
  await client.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [
    userId,
  ]);
  await client.query("SET ROLE authenticated");
  try {
    await fn();
  } finally {
    await client.query("SET ROLE postgres");
  }
}

beforeAll(async () => {
  pool = newPool();
  client = await pool.connect();
  await client.query(
    `INSERT INTO public.memberships (user_id, scope_type, scope_id, role)
     VALUES ($1, 'org', $2, 'owner')
     ON CONFLICT (user_id, scope_type, scope_id, role) DO NOTHING`,
    [SEED_ADMIN_ID, SEED_ORG_ID],
  );
});

afterAll(async () => {
  await client.query(
    "DELETE FROM public.roster_snapshots WHERE team_season_id = $1",
    [TEST_TS_ID],
  );
  await client.query(
    "DELETE FROM public.roster_snapshots WHERE team_season_id = $1",
    [TEST_TS_ID_SG],
  );
  await client.query(
    "DELETE FROM public.transfers WHERE created_by IN (SELECT id FROM auth.users WHERE email LIKE '%@roster-test.mn')",
  );
  await client.query(
    "DELETE FROM public.memberships WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@roster-test.mn')",
  );
  await client.query(
    "DELETE FROM auth.users WHERE email LIKE '%@roster-test.mn' AND id != $1",
    [SEED_ADMIN_ID],
  );
  await client.end();
  await pool.end();
});

describe("roster_snapshots table", () => {
  it("table exists with expected columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roster_snapshots'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("team_season_id");
    expect(cols).toContain("player_id");
    expect(cols).toContain("status");
    expect(cols).toContain("captured_at");
  });
});

describe("cmd_snapshot_roster", () => {
  it("creates snapshot from roster entries", async () => {
    let result: { rows: Array<{ id: string; player_id: string }> } | undefined;
    await authAs(SEED_ADMIN_ID, async () => {
      result = await client.query(
        "SELECT id, player_id FROM public.cmd_snapshot_roster($1)",
        [TEST_TS_ID],
      );
    });
    expect(result?.rows.length).toBeGreaterThan(0);
    expect(result?.rows[0].player_id).toBeTruthy();
  });

  it("re-creates snapshot on second call", async () => {
    let count = 0;
    await authAs(SEED_ADMIN_ID, async () => {
      const r = await client.query(
        "SELECT count(*) AS cnt FROM public.cmd_snapshot_roster($1)",
        [TEST_TS_ID],
      );
      count = parseInt(r.rows[0].cnt, 10);
    });
    expect(count).toBeGreaterThan(0);
  });

  it("unauthorized user cannot snapshot", async () => {
    const user = await createTestUser(pool);
    await expect(
      authAs(user.id, async () => {
        await client.query("SELECT public.cmd_snapshot_roster($1)", [
          TEST_TS_ID,
        ]);
      }),
    ).rejects.toThrow(/not authorized/);
  });
});

describe("cmd_check_eligibility", () => {
  it("returns eligible for a player on a roster snapshot", async () => {
    await authAs(SEED_ADMIN_ID, async () => {
      await client.query("SELECT public.cmd_snapshot_roster($1)", [TEST_TS_ID]);
    });
    const { rows: tsRow } = await client.query(
      "SELECT competition_id FROM public.team_seasons WHERE id = $1",
      [TEST_TS_ID],
    );
    const { rows } = await client.query(
      "SELECT * FROM public.cmd_check_eligibility($1, $2)",
      [SEED_HOME_PLAYER, tsRow[0].competition_id],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].eligible).toBe(true);
  });

  it("returns not eligible for a player with no snapshot", async () => {
    const { rows } = await client.query(
      "SELECT * FROM public.cmd_check_eligibility($1, $2)",
      ["00000000-0000-0000-0000-000000000000", SEED_COMPETITION_ID],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].eligible).toBe(false);
  });
});

describe("cmd_record_transfer", () => {
  it("records a transfer between teams", async () => {
    let result:
      | {
          rows: Array<{ id: string; player_id: string; transfer_type: string }>;
        }
      | undefined;
    await authAs(SEED_ADMIN_ID, async () => {
      result = await client.query(
        `SELECT id, player_id, transfer_type FROM public.cmd_record_transfer($1, $2, $3, 'permanent', CURRENT_DATE, 'test transfer')`,
        [SEED_HOME_PLAYER, TEST_TS_ID, TEST_TS_ID_SG],
      );
    });
    expect(result?.rows.length).toBe(1);
    expect(result?.rows[0].player_id).toBe(SEED_HOME_PLAYER);
    expect(result?.rows[0].transfer_type).toBe("permanent");
  });

  it("unauthorized user cannot record transfers", async () => {
    const user = await createTestUser(pool);
    await expect(
      authAs(user.id, async () => {
        await client.query(
          `SELECT public.cmd_record_transfer($1, $2, $3, 'loan', CURRENT_DATE)`,
          [SEED_HOME_PLAYER, TEST_TS_ID_SG, TEST_TS_ID],
        );
      }),
    ).rejects.toThrow(/not authorized/);
  });
});

describe("transfer table", () => {
  it("transfers table exists", async () => {
    const { rows } = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transfers')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("transfer type enum has expected values", async () => {
    const { rows } = await client.query(
      "SELECT unnest(enum_range(NULL::public.transfer_type)) AS type",
    );
    const types = rows.map((r: { type: string }) => r.type);
    expect(types).toContain("permanent");
    expect(types).toContain("loan");
    expect(types).toContain("free_agent");
    expect(types).toContain("youth_promotion");
  });
});
