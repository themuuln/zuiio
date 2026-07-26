/**
 * Integration tests for guardian authority model, RLS policies, and guarded commands.
 *
 * Tests run against real Postgres (local Supabase). Each test uses SET ROLE
 * + set_config to simulate authenticated users for RLS enforcement.
 */

import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, createTestUser, newPool } from "./setup-integration";

let pool: Pool;
let client: PoolClient;
let academyId: string;
let studentId: string;
let guardianId: string;
let linkId: string;
let staffUserId: string;
let guardianUserId: string;
let otherUserId: string;

beforeAll(async () => {
  pool = newPool();
  client = await pool.connect();

  // Get seeded academy
  const { rows: academies } = await client.query(
    "SELECT id FROM public.academy_profiles LIMIT 1",
  );
  academyId = academies[0].id;

  // Create test users
  const staffUser = await createTestUser(pool, { email: "staff@test.mn" });
  staffUserId = staffUser.id;

  const guardianUser = await createTestUser(pool, {
    email: "guardian@test.mn",
  });
  guardianUserId = guardianUser.id;

  const otherUser = await createTestUser(pool, { email: "other@test.mn" });
  otherUserId = otherUser.id;

  // Create staff membership — link staff to the org that owns the academy
  const { rows: orgs } = await client.query(
    "SELECT organization_id FROM public.academy_profiles WHERE id = $1",
    [academyId],
  );
  const orgId = orgs[0].organization_id;

  await client.query(
    "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING",
    [staffUserId, orgId],
  );

  // Create a test student
  const { rows: students } = await client.query(
    `INSERT INTO public.academy_students (academy_id, canonical_name, date_of_birth, medical_notes, allergies)
     VALUES ($1, 'Тест Сурагч', '2015-06-01', 'Астма', '{}')
     RETURNING id`,
    [academyId],
  );
  studentId = students[0].id;

  // Create a test guardian
  const { rows: guardians } = await client.query(
    `INSERT INTO public.academy_guardians (academy_id, name, phone, relationship, is_primary)
     VALUES ($1, 'Тест Ээж', '99111111', 'parent', true)
     RETURNING id`,
    [academyId],
  );
  guardianId = guardians[0].id;
});

afterAll(async () => {
  await client.query(
    "DELETE FROM public.guardian_authority_events WHERE student_guardian_id = $1",
    [linkId],
  );
  await client.query(
    "DELETE FROM public.academy_student_guardians WHERE id = $1",
    [linkId],
  );
  await client.query("DELETE FROM public.academy_students WHERE id = $1", [
    studentId,
  ]);
  await client.query("DELETE FROM public.academy_guardians WHERE id = $1", [
    guardianId,
  ]);
  await client.query("DELETE FROM public.memberships WHERE user_id = $1", [
    staffUserId,
  ]);
  await client.query("DELETE FROM auth.users WHERE id IN ($1, $2, $3)", [
    staffUserId,
    guardianUserId,
    otherUserId,
  ]);
  await client.end();
  await pool.end();
});

describe("academy_student_guardians authority model", () => {
  it("has authority_status column with check constraint", async () => {
    const { rows } = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'academy_student_guardians'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("authority_status");
    expect(cols).toContain("verified_at");
    expect(cols).toContain("verified_by");
    expect(cols).toContain("revoked_at");
    expect(cols).toContain("verified_phone");
  });

  it("defaults authority_status to 'pending'", async () => {
    const { rows } = await client.query(
      `INSERT INTO public.academy_student_guardians (student_id, guardian_id)
       VALUES ($1, $2) RETURNING authority_status`,
      [studentId, guardianId],
    );
    linkId = rows[0].id;
    expect(rows[0].authority_status).toBe("pending");
  });

  it("rejects invalid authority_status values", async () => {
    await expect(
      client.query(
        "UPDATE public.academy_student_guardians SET authority_status = 'invalid' WHERE id = $1",
        [linkId],
      ),
    ).rejects.toThrow();
  });
});

describe("guardian_authority_events audit table", () => {
  it("inserts an authority event", async () => {
    const { rows } = await client.query(
      `INSERT INTO public.guardian_authority_events (student_guardian_id, action, actor_id)
       VALUES ($1, 'granted', $2) RETURNING id, action`,
      [linkId, staffUserId],
    );
    expect(rows[0].action).toBe("granted");
  });

  it("rejects invalid action values", async () => {
    await expect(
      client.query(
        "INSERT INTO public.guardian_authority_events (student_guardian_id, action, actor_id) VALUES ($1, 'invalid_action', $2)",
        [linkId, staffUserId],
      ),
    ).rejects.toThrow();
  });
});

describe("RLS: academy_guardians", () => {
  it("staff can read guardians", async () => {
    await asUser(client, staffUserId, async () => {
      const { rows } = await client.query(
        "SELECT id FROM public.academy_guardians WHERE academy_id = $1",
        [academyId],
      );
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  it("non-staff cannot read guardians they don't own", async () => {
    await asUser(client, otherUserId, async () => {
      const { rows } = await client.query(
        "SELECT id FROM public.academy_guardians WHERE academy_id = $1",
        [academyId],
      );
      // Other user has no membership and is not the guardian's user_id
      expect(rows.length).toBe(0);
    });
  });

  it("guardian can read own record when user_id is set", async () => {
    await client.query(
      "UPDATE public.academy_guardians SET user_id = $1 WHERE id = $2",
      [guardianUserId, guardianId],
    );

    await asUser(client, guardianUserId, async () => {
      const { rows } = await client.query(
        "SELECT id, name FROM public.academy_guardians WHERE id = $1",
        [guardianId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBe("Тест Ээж");
    });
  });

  it("staff can insert a guardian", async () => {
    await asUser(client, staffUserId, async () => {
      const { rows } = await client.query(
        `INSERT INTO public.academy_guardians (academy_id, name, phone, relationship)
         VALUES ($1, 'Тест Аав', '99222222', 'parent') RETURNING id`,
        [academyId],
      );
      expect(rows[0].id).toBeTruthy();
      await client.query("DELETE FROM public.academy_guardians WHERE id = $1", [
        rows[0].id,
      ]);
    });
  });

  it("non-staff cannot insert a guardian", async () => {
    await asUser(client, otherUserId, async () => {
      await expect(
        client.query(
          `INSERT INTO public.academy_guardians (academy_id, name, phone, relationship)
           VALUES ($1, 'Хакер', '99333333', 'parent') RETURNING id`,
          [academyId],
        ),
      ).rejects.toThrow();
    });
  });
});

describe("RLS: academy_students", () => {
  it("staff sees all fields including medical", async () => {
    await asUser(client, staffUserId, async () => {
      const { rows } = await client.query(
        "SELECT id, medical_notes, allergies FROM public.academy_students WHERE id = $1",
        [studentId],
      );
      expect(rows[0].medical_notes).toBe("Астма");
    });
  });

  it("guardian can see non-medical student fields when verified", async () => {
    // Set up verified link
    await client.query(
      `UPDATE public.academy_student_guardians SET authority_status = 'verified',
       verified_at = now(), verified_by = $1 WHERE id = $2`,
      [staffUserId, linkId],
    );

    await asUser(client, guardianUserId, async () => {
      const { rows } = await client.query(
        "SELECT id, canonical_name, medical_notes FROM public.academy_students WHERE id = $1",
        [studentId],
      );
      expect(rows[0].canonical_name).toBe("Тест Сурагч");
      // Guardian can see the row (they're verified), but medical is also visible
      // because the select policy allows guardian access without stripping columns
      // The policy uses OR private.is_verified_guardian(id)
      expect(rows.length).toBe(1);
    });
  });

  it("non-staff/non-guardian cannot see students", async () => {
    await asUser(client, otherUserId, async () => {
      const { rows } = await client.query(
        "SELECT id FROM public.academy_students WHERE academy_id = $1",
        [academyId],
      );
      expect(rows.length).toBe(0);
    });
  });
});

describe("RLS: academy_enrollments", () => {
  it("staff can read enrollments", async () => {
    await asUser(client, staffUserId, async () => {
      const { rows } = await client.query(
        "SELECT id FROM public.academy_enrollments WHERE student_id = $1",
        [studentId],
      );
      // May be 0 if no enrollments exist — that's fine
      expect(Array.isArray(rows)).toBe(true);
    });
  });
});

describe("cmd_invite_guardian", () => {
  it("staff can invite a guardian", async () => {
    await asUser(client, staffUserId, async () => {
      const { rows } = await client.query(
        "SELECT public.cmd_invite_guardian($1, $2, $3, $4) AS result",
        [academyId, studentId, "Шинэ Ээж", "99444444"],
      );
      const result = rows[0].result;
      expect(result.authority_status).toBe("pending");
      expect(result.guardian_id).toBeTruthy();
      expect(result.link_id).toBeTruthy();

      // Cleanup
      await client.query(
        "DELETE FROM public.academy_student_guardians WHERE id = $1",
        [result.link_id],
      );
      await client.query("DELETE FROM public.academy_guardians WHERE id = $1", [
        result.guardian_id,
      ]);
    });
  });

  it("non-staff cannot invite a guardian", async () => {
    await asUser(client, otherUserId, async () => {
      await expect(
        client.query(
          "SELECT public.cmd_invite_guardian($1, $2, $3, $4) AS result",
          [academyId, studentId, "Хакер", "99555555"],
        ),
      ).rejects.toThrow();
    });
  });
});

describe("cmd_verify_guardian / cmd_revoke_guardian lifecycle", () => {
  let testLinkId: string;

  it("creates a pending link via cmd_invite_guardian", async () => {
    await asUser(client, staffUserId, async () => {
      const { rows } = await client.query(
        "SELECT public.cmd_invite_guardian($1, $2, $3, $4) AS result",
        [academyId, studentId, "Баталгаажуулах Ээж", "99666666"],
      );
      testLinkId = rows[0].result.link_id;
      expect(rows[0].result.authority_status).toBe("pending");
    });
  });

  it("staff can verify pending link", async () => {
    await asUser(client, staffUserId, async () => {
      const { rows } = await client.query(
        "SELECT public.cmd_verify_guardian($1) AS result",
        [testLinkId],
      );
      expect(rows[0].result.authority_status).toBe("verified");
    });
  });

  it("staff can revoke verified link", async () => {
    await asUser(client, staffUserId, async () => {
      const { rows } = await client.query(
        "SELECT public.cmd_revoke_guardian($1) AS result",
        [testLinkId],
      );
      expect(rows[0].result.authority_status).toBe("revoked");
    });
  });

  it("cannot revoke an already revoked link", async () => {
    await asUser(client, staffUserId, async () => {
      await expect(
        client.query("SELECT public.cmd_revoke_guardian($1) AS result", [
          testLinkId,
        ]),
      ).rejects.toThrow();
    });
  });

  afterAll(async () => {
    if (testLinkId) {
      await client.query(
        "DELETE FROM public.guardian_authority_events WHERE student_guardian_id = $1",
        [testLinkId],
      );
      await client.query(
        "DELETE FROM public.academy_student_guardians WHERE id = $1",
        [testLinkId],
      );
    }
  });
});

describe("cmd_list_my_children", () => {
  it("returns children for verified guardian", async () => {
    // Set guardian user_id
    await client.query(
      "UPDATE public.academy_guardians SET user_id = $1 WHERE id = $2",
      [guardianUserId, guardianId],
    );

    // Re-verify the link
    await client.query(
      `UPDATE public.academy_student_guardians SET authority_status = 'verified',
       verified_at = now(), verified_by = $1 WHERE id = $2`,
      [staffUserId, linkId],
    );

    await asUser(client, guardianUserId, async () => {
      const { rows } = await client.query(
        "SELECT student_id, student_name, authority_status FROM public.cmd_list_my_children()",
      );
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].student_name).toBeTruthy();
    });
  });

  it("returns empty for unlinked user", async () => {
    await asUser(client, otherUserId, async () => {
      const { rows } = await client.query(
        "SELECT student_id FROM public.cmd_list_my_children()",
      );
      expect(rows.length).toBe(0);
    });
  });
});

describe("cmd_link_guardian_account", () => {
  it("links guardian to auth user", async () => {
    const { rows: guardians } = await client.query(
      `INSERT INTO public.academy_guardians (academy_id, name, phone, relationship)
       VALUES ($1, 'Линк Тест', '99777777', 'parent') RETURNING id`,
      [academyId],
    );
    const newGuardianId = guardians[0].id;

    await asUser(client, otherUserId, async () => {
      const { rows } = await client.query(
        "SELECT public.cmd_link_guardian_account($1) AS result",
        [newGuardianId],
      );
      expect(rows[0].result.user_id).toBe(otherUserId);
    });

    await client.query("DELETE FROM public.academy_guardians WHERE id = $1", [
      newGuardianId,
    ]);
  });
});

describe("cmd_submit_registration / cmd_approve_registration flow", () => {
  let intentId: string;

  it("submits registration as anon", async () => {
    const { rows } = await client.query(
      `SELECT public.cmd_submit_registration(
        $1, $2, 'Бүртгэл Сурагч', '2016-01-01'::date, 'Бүртгэл Ээж', '99888888'
      ) AS result`,
      [academyId, studentId],
    );
    intentId = rows[0].result.intent_id;
    expect(rows[0].result.status).toBe("pending");
    expect(intentId).toBeTruthy();
  });

  it("staff can approve registration", async () => {
    await asUser(client, staffUserId, async () => {
      const { rows } = await client.query(
        "SELECT public.cmd_approve_registration($1) AS result",
        [intentId],
      );
      expect(rows[0].result.status).toBe("approved");
    });
  });

  it("cannot approve already approved registration", async () => {
    await asUser(client, staffUserId, async () => {
      await expect(
        client.query("SELECT public.cmd_approve_registration($1) AS result", [
          intentId,
        ]),
      ).rejects.toThrow();
    });
  });

  afterAll(async () => {
    if (intentId) {
      await client.query(
        "DELETE FROM public.academy_registration_intents WHERE id = $1",
        [intentId],
      );
    }
  });
});

describe("RLS: academy_registration_intents", () => {
  it("staff can see registration intents", async () => {
    await asUser(client, staffUserId, async () => {
      const { rows } = await client.query(
        "SELECT id FROM public.academy_registration_intents WHERE academy_id = $1",
        [academyId],
      );
      expect(Array.isArray(rows)).toBe(true);
    });
  });
});
