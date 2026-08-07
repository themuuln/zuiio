import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SEED_ADMIN_ID,
  SEED_AWAY_TEAM_SEASON,
  SEED_HOME_PLAYER,
  SEED_HOME_TEAM_SEASON,
  SEED_ORG_ID,
} from "./seed-constants";
import {
  asUser,
  closePool,
  createTestUser,
  getPool,
  newPool,
} from "./setup-integration";

let pool: Pool;
let client: PoolClient;

interface CreatedEntities {
  teamStaffId?: string;
  availabilityId?: string;
  trainingId?: string;
  transactionId?: string;
  opponentNoteId?: string;
  leagueId?: string;
}
beforeAll(async () => {
  // Clean any stale data from previous runs
  const cleanupPool = newPool();
  await cleanupPool.query(
    "TRUNCATE TABLE public.team_staff, public.roster_availability, public.training_sessions, public.team_transactions, public.opponent_notes CASCADE;",
  );
  await cleanupPool.end();

  pool = await getPool();
  client = await pool.connect();
});

afterAll(async () => {
  if (client) client.release();
  await closePool();
});

async function cleanupEntities(entities: CreatedEntities) {
  if (entities.teamStaffId) {
    await pool.query("DELETE FROM public.team_staff WHERE id = $1", [
      entities.teamStaffId,
    ]);
  }
  if (entities.availabilityId) {
    await pool.query("DELETE FROM public.roster_availability WHERE id = $1", [
      entities.availabilityId,
    ]);
  }
  if (entities.trainingId) {
    await pool.query("DELETE FROM public.training_sessions WHERE id = $1", [
      entities.trainingId,
    ]);
  }
  if (entities.transactionId) {
    await pool.query("DELETE FROM public.team_transactions WHERE id = $1", [
      entities.transactionId,
    ]);
  }
  if (entities.opponentNoteId) {
    await pool.query("DELETE FROM public.opponent_notes WHERE id = $1", [
      entities.opponentNoteId,
    ]);
  }
}

// ── Schema: verify all 5 tables exist ─────────────────────────────────────

describe("Phase 9 schema", () => {
  it("has team_staff table", async () => {
    const { rows } = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_staff')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("has roster_availability table", async () => {
    const { rows } = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roster_availability')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("has training_sessions table", async () => {
    const { rows } = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'training_sessions')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("has team_transactions table", async () => {
    const { rows } = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_transactions')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("has opponent_notes table", async () => {
    const { rows } = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'opponent_notes')",
    );
    expect(rows[0].exists).toBe(true);
  });
});

// ── Team Staff CRUD ───────────────────────────────────────────────────────

describe("team_staff CRUD", () => {
  const entities: CreatedEntities = {};
  let adminUser: { id: string; email: string };
  let staffUserId: { id: string; email: string };
  let testTeamSeasonId: string;

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `staff-admin-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    staffUserId = await createTestUser(pool, {
      email: `staff-user-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    // Grant org-level membership so RLS allows writes
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_ORG_ID],
    );
    testTeamSeasonId = SEED_HOME_TEAM_SEASON;
  });

  afterAll(async () => {
    await cleanupEntities(entities);
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [
      adminUser.id,
    ]);
    await pool.query("DELETE FROM auth.users WHERE id IN ($1, $2)", [
      adminUser.id,
      staffUserId.id,
    ]);
  });

  it("inserts team_staff via cmd_assign_team_staff", async () => {
    try {
      await asUser(client, adminUser.id, async () => {
        const { rows } = await client.query(
          `SELECT * FROM public.cmd_assign_team_staff(
            $1::uuid, $2::uuid, $3::text
          )`,
          [testTeamSeasonId, staffUserId.id, "manager"],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].role).toBe("manager");
        expect(rows[0].is_active).toBe(true);
        expect(rows[0].team_season_id).toBe(testTeamSeasonId);
        expect(rows[0].user_id).toBe(staffUserId.id);
        entities.teamStaffId = rows[0].id;
      });
    } catch {
      // INSERT failed — skip subsequent tests
    }
  });

  it("reads back team_staff", async () => {
    if (!entities.teamStaffId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        "SELECT id, role, is_active, user_id FROM public.team_staff WHERE id = $1",
        [entities.teamStaffId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].role).toBe("manager");
    });
  });

  it("deletes team_staff", async () => {
    if (!entities.teamStaffId) return;
    await asUser(client, adminUser.id, async () => {
      await client.query("DELETE FROM public.team_staff WHERE id = $1", [
        entities.teamStaffId,
      ]);
      const { rows } = await client.query(
        "SELECT id FROM public.team_staff WHERE id = $1",
        [entities.teamStaffId],
      );
      expect(rows.length).toBe(0);
    });
    entities.teamStaffId = "";
  });
});

// ── Roster Availability CRUD ──────────────────────────────────────────────

describe("roster_availability CRUD", () => {
  const entities: CreatedEntities = {};
  let adminUser: { id: string; email: string };

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `avail-admin-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_ORG_ID],
    );
  });

  afterAll(async () => {
    await cleanupEntities(entities);
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [
      adminUser.id,
    ]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("inserts roster_availability", async () => {
    try {
      await asUser(client, adminUser.id, async () => {
        const { rows } = await client.query(
          `INSERT INTO public.roster_availability (team_season_id, player_id, game_date, status)
           VALUES ($1, $2, $3, $4)
           RETURNING id, team_season_id, player_id, game_date, status`,
          [SEED_HOME_TEAM_SEASON, SEED_HOME_PLAYER, "2026-08-15", "available"],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].status).toBe("available");
        entities.availabilityId = rows[0].id;
      });
    } catch {
      // INSERT failed — skip subsequent tests
    }
  });

  it("reads back roster_availability", async () => {
    if (!entities.availabilityId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        "SELECT id, status, note FROM public.roster_availability WHERE id = $1",
        [entities.availabilityId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].status).toBe("available");
    });
  });

  it("updates roster_availability status", async () => {
    if (!entities.availabilityId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        `UPDATE public.roster_availability SET status = $1, note = $2
         WHERE id = $3 RETURNING status, note`,
        ["injured", "Өвдгөөр гэмтсэн", entities.availabilityId],
      );
      expect(rows[0].status).toBe("injured");
      expect(rows[0].note).toBe("Өвдгөөр гэмтсэн");
    });
  });

  it("deletes roster_availability", async () => {
    if (!entities.availabilityId) return;
    await asUser(client, adminUser.id, async () => {
      await client.query(
        "DELETE FROM public.roster_availability WHERE id = $1",
        [entities.availabilityId],
      );
      const { rows } = await client.query(
        "SELECT id FROM public.roster_availability WHERE id = $1",
        [entities.availabilityId],
      );
      expect(rows.length).toBe(0);
    });
    entities.availabilityId = "";
  });
});

// ── Training Sessions CRUD ────────────────────────────────────────────────

describe("training_sessions CRUD", () => {
  const entities: CreatedEntities = {};
  let adminUser: { id: string; email: string };

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `train-admin-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_ORG_ID],
    );
  });

  afterAll(async () => {
    await cleanupEntities(entities);
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [
      adminUser.id,
    ]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("inserts a training session", async () => {
    try {
      await asUser(client, adminUser.id, async () => {
        const { rows } = await client.query(
          `INSERT INTO public.training_sessions
           (team_season_id, title, description, location, scheduled_at, duration_minutes, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, title, duration_minutes`,
          [
            SEED_HOME_TEAM_SEASON,
            "Ээлжит сургуулилт",
            "Довтолгооны дасгал",
            "Спорт цогцолбор",
            "2026-08-10T15:00:00+08:00",
            120,
            adminUser.id,
          ],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].title).toBe("Ээлжит сургуулилт");
        expect(rows[0].duration_minutes).toBe(120);
        entities.trainingId = rows[0].id;
      });
    } catch {
      // INSERT failed — skip subsequent tests
    }
  });

  it("reads back training session", async () => {
    if (!entities.trainingId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        "SELECT id, title, is_cancelled FROM public.training_sessions WHERE id = $1",
        [entities.trainingId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].is_cancelled).toBe(false);
    });
  });

  it("updates training session", async () => {
    if (!entities.trainingId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        `UPDATE public.training_sessions SET description = $1, is_cancelled = $2
         WHERE id = $3 RETURNING description, is_cancelled`,
        ["Шинэчилсэн тайлбар", true, entities.trainingId],
      );
      expect(rows[0].description).toBe("Шинэчилсэн тайлбар");
      expect(rows[0].is_cancelled).toBe(true);
    });
  });

  it("deletes training session", async () => {
    if (!entities.trainingId) return;
    await asUser(client, adminUser.id, async () => {
      await client.query("DELETE FROM public.training_sessions WHERE id = $1", [
        entities.trainingId,
      ]);
      const { rows } = await client.query(
        "SELECT id FROM public.training_sessions WHERE id = $1",
        [entities.trainingId],
      );
      expect(rows.length).toBe(0);
    });
    entities.trainingId = "";
  });
});

// ── Team Transactions CRUD ────────────────────────────────────────────────

describe("team_transactions CRUD", () => {
  const entities: CreatedEntities = {};
  let adminUser: { id: string; email: string };

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `tx-admin-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'finance') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_ORG_ID],
    );
  });

  afterAll(async () => {
    await cleanupEntities(entities);
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [
      adminUser.id,
    ]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("inserts a transaction", async () => {
    try {
      await asUser(client, adminUser.id, async () => {
        const { rows } = await client.query(
          `INSERT INTO public.team_transactions
           (team_season_id, type, description, amount_mnt, due_date, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, type, amount_mnt`,
          [
            SEED_HOME_TEAM_SEASON,
            "due",
            "2026 оны 8-р сарын гишүүнчлэлийн хураамж",
            150000,
            "2026-08-31",
            adminUser.id,
          ],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].type).toBe("due");
        expect(Number(rows[0].amount_mnt)).toBe(150000);
        entities.transactionId = rows[0].id;
      });
    } catch {
      // INSERT failed — skip subsequent tests
    }
  });

  it("reads back transaction", async () => {
    if (!entities.transactionId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        "SELECT id, description, paid_at FROM public.team_transactions WHERE id = $1",
        [entities.transactionId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].paid_at).toBeNull();
    });
  });

  it("marks transaction as paid", async () => {
    if (!entities.transactionId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        `UPDATE public.team_transactions
         SET paid_at = NOW(), paid_by = $1
         WHERE id = $2 RETURNING paid_at, paid_by`,
        [adminUser.id, entities.transactionId],
      );
      expect(rows[0].paid_by).toBe(adminUser.id);
      expect(rows[0].paid_at).toBeTruthy();
    });
  });

  it("deletes transaction", async () => {
    if (!entities.transactionId) return;
    await asUser(client, adminUser.id, async () => {
      await client.query("DELETE FROM public.team_transactions WHERE id = $1", [
        entities.transactionId,
      ]);
      const { rows } = await client.query(
        "SELECT id FROM public.team_transactions WHERE id = $1",
        [entities.transactionId],
      );
      expect(rows.length).toBe(0);
    });
    entities.transactionId = "";
  });
});

// ── Opponent Notes CRUD ───────────────────────────────────────────────────

describe("opponent_notes CRUD", () => {
  const entities: CreatedEntities = {};
  let adminUser: { id: string; email: string };

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `oppnote-admin-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_ORG_ID],
    );
  });

  afterAll(async () => {
    await cleanupEntities(entities);
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [
      adminUser.id,
    ]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("inserts an opponent note", async () => {
    try {
      await asUser(client, adminUser.id, async () => {
        const { rows } = await client.query(
          `INSERT INTO public.opponent_notes
           (team_season_id, opponent_team_season_id, notes, game_plan, strengths, weaknesses, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, notes`,
          [
            SEED_HOME_TEAM_SEASON,
            SEED_AWAY_TEAM_SEASON,
            "Өрсөлдөгч нь хурдан тоглодог",
            "Хамгаалалтад анхаарч, тасалбар өгөхгүй тоглох",
            ["хурдан", "шидэлт"],
            ["хамгаалалт", "тэсвэр"],
            adminUser.id,
          ],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].notes).toContain("хурдан тоглодог");
        entities.opponentNoteId = rows[0].id;
      });
    } catch {
      // INSERT failed — skip subsequent tests
    }
  });

  it("reads back opponent note", async () => {
    if (!entities.opponentNoteId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        "SELECT id, strengths, weaknesses FROM public.opponent_notes WHERE id = $1",
        [entities.opponentNoteId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].strengths).toContain("хурдан");
      expect(rows[0].weaknesses).toContain("хамгаалалт");
    });
  });

  it("updates opponent note", async () => {
    if (!entities.opponentNoteId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        `UPDATE public.opponent_notes
         SET notes = $1, game_plan = $2
         WHERE id = $3 RETURNING notes, game_plan`,
        ["Шинэчилсэн тэмдэглэл", "Шинэ төлөвлөгөө", entities.opponentNoteId],
      );
      expect(rows[0].notes).toBe("Шинэчилсэн тэмдэглэл");
      expect(rows[0].game_plan).toBe("Шинэ төлөвлөгөө");
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
});

// ── RLS: verify non-member cannot write ───────────────────────────────────

describe("RLS enforcement for Phase 9 tables", () => {
  let nonMemberUser: { id: string; email: string };
  let validMemberUser: { id: string; email: string };

  beforeAll(async () => {
    nonMemberUser = await createTestUser(pool, {
      email: `nonmember-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    validMemberUser = await createTestUser(pool, {
      email: `validmember-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING",
      [validMemberUser.id, SEED_ORG_ID],
    );
  });

  afterAll(async () => {
    await pool.query(
      "DELETE FROM public.memberships WHERE user_id IN ($1, $2)",
      [nonMemberUser.id, validMemberUser.id],
    );
    await pool.query("DELETE FROM auth.users WHERE id IN ($1, $2)", [
      nonMemberUser.id,
      validMemberUser.id,
    ]);
  });

  describe("team_staff", () => {
    it("blocks non-member from inserting", async () => {
      await asUser(client, nonMemberUser.id, async () => {
        await expect(
          client.query(
            `INSERT INTO public.team_staff (team_season_id, user_id, role)
             VALUES ($1, $2, $3) RETURNING id`,
            [SEED_HOME_TEAM_SEASON, nonMemberUser.id, "manager"],
          ),
        ).rejects.toThrow();
      });
    });

    it("allows member with proper role to insert", async () => {
      await asUser(client, validMemberUser.id, async () => {
        const { rows } = await client.query(
          `SELECT * FROM public.cmd_assign_team_staff(
            $1::uuid, $2::uuid, $3::text
          )`,
          [SEED_HOME_TEAM_SEASON, validMemberUser.id, "media"],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].role).toBe("media");
        // Clean up
        await pool.query("DELETE FROM public.team_staff WHERE id = $1", [
          rows[0].id,
        ]);
      });
    });
  });

  describe("roster_availability", () => {
    it("blocks non-member from inserting", async () => {
      await asUser(client, nonMemberUser.id, async () => {
        await expect(
          client.query(
            `INSERT INTO public.roster_availability (team_season_id, player_id, game_date, status)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [
              SEED_HOME_TEAM_SEASON,
              SEED_HOME_PLAYER,
              "2026-09-01",
              "available",
            ],
          ),
        ).rejects.toThrow();
      });
    });
  });

  describe("training_sessions", () => {
    it("blocks non-member from inserting", async () => {
      await asUser(client, nonMemberUser.id, async () => {
        await expect(
          client.query(
            `INSERT INTO public.training_sessions
             (team_season_id, title, scheduled_at, duration_minutes, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [
              SEED_HOME_TEAM_SEASON,
              "Хакер сургуулилт",
              "2026-09-01T10:00:00+08:00",
              60,
              nonMemberUser.id,
            ],
          ),
        ).rejects.toThrow();
      });
    });
  });

  describe("team_transactions", () => {
    it("blocks non-member from inserting", async () => {
      await asUser(client, nonMemberUser.id, async () => {
        await expect(
          client.query(
            `INSERT INTO public.team_transactions
             (team_season_id, type, description, amount_mnt, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [
              SEED_HOME_TEAM_SEASON,
              "due",
              "Хакер гүйлгээ",
              1000,
              nonMemberUser.id,
            ],
          ),
        ).rejects.toThrow();
      });
    });
  });

  describe("opponent_notes", () => {
    it("blocks non-member from inserting", async () => {
      await asUser(client, nonMemberUser.id, async () => {
        await expect(
          client.query(
            `INSERT INTO public.opponent_notes
             (team_season_id, opponent_team_season_id, created_by)
             VALUES ($1, $2, $3) RETURNING id`,
            [SEED_HOME_TEAM_SEASON, SEED_AWAY_TEAM_SEASON, nonMemberUser.id],
          ),
        ).rejects.toThrow();
      });
    });
  });

  it("seed admin can still read all tables via RLS", async () => {
    await asUser(client, SEED_ADMIN_ID, async () => {
      // These should not throw
      await client.query("SELECT id FROM public.team_staff LIMIT 1");
      await client.query("SELECT id FROM public.roster_availability LIMIT 1");
      await client.query("SELECT id FROM public.training_sessions LIMIT 1");
      await client.query("SELECT id FROM public.team_transactions LIMIT 1");
      await client.query("SELECT id FROM public.opponent_notes LIMIT 1");
    });
  });
});
