/**
 * Integration tests for cmd_sign_consent / cmd_withdraw_consent SECURITY
 * DEFINER functions and the guardian consent signing flow.
 *
 * Tests run against real Postgres (local Supabase). Each test uses
 * SET ROLE + set_config to simulate authenticated users for RLS enforcement.
 */

import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, createTestUser, newPool } from "./setup-integration";

// ── Connection ────────────────────────────────────────────────────────────

let pool: Pool;
let client: PoolClient;

// ── Shared state ──────────────────────────────────────────────────────────

let academyId: string;
let guardianUserId: string;
let guardianId: string;
let studentId: string;
let linkId: string;
let consentTemplateId: string;
let otherUserId: string;
let createdRecordId: string;

// ── Lifecycle ──────────────────────────────────────────────────────────────

beforeAll(async () => {
  pool = newPool();
  client = await pool.connect();

  // Clean stale data
  await client.query(
    "DELETE FROM public.academy_consent_records WHERE student_id IN (SELECT id FROM public.academy_students WHERE canonical_name LIKE 'Тест Зөвшөөрөл%')",
  );
  await client.query(
    "DELETE FROM public.academy_consent_templates WHERE title LIKE 'Тест Зөвшөөрөл%'",
  );

  // Get academy
  const { rows: academies } = await client.query(
    "SELECT id FROM public.academy_profiles LIMIT 1",
  );
  academyId = academies[0].id;
  if (!academyId)
    throw new Error("No academy found — seed academy_profiles first");

  // Create users
  const guardianUser = await createTestUser(pool, {
    email: "guardian-consent@test.mn",
  });
  guardianUserId = guardianUser.id;

  const otherUser = await createTestUser(pool, {
    email: "other-consent@test.mn",
  });
  otherUserId = otherUser.id;

  // Create guardian
  const { rows: guardians } = await client.query(
    `INSERT INTO public.academy_guardians (academy_id, name, phone, relationship, is_primary)
     VALUES ($1, 'Тест Зөвшөөрөл Асран Хамгаалагч', '99998888', 'parent', true)
     RETURNING id`,
    [academyId],
  );
  guardianId = guardians[0].id;

  // Link guardian to auth user
  await client.query(
    "UPDATE public.academy_guardians SET user_id = $1 WHERE id = $2",
    [guardianUserId, guardianId],
  );

  // Create student
  const { rows: students } = await client.query(
    `INSERT INTO public.academy_students (academy_id, canonical_name)
     VALUES ($1, 'Тест Зөвшөөрөл Сурагч')
     RETURNING id`,
    [academyId],
  );
  studentId = students[0].id;

  // Create guardian-student link with verified status
  const { rows: links } = await client.query(
    `INSERT INTO public.academy_student_guardians (student_id, guardian_id, authority_status)
     VALUES ($1, $2, 'verified')
     RETURNING id`,
    [studentId, guardianId],
  );
  linkId = links[0].id;

  // Create consent template
  const { rows: templates } = await client.query(
    `INSERT INTO public.academy_consent_templates (academy_id, title, body, scope)
     VALUES ($1, 'Тест Зөвшөөрөл', 'Зөвшөөрлийн тест агуулга.\nДэлгэрэнгүй бичвэр.', 'liability')
     RETURNING id`,
    [academyId],
  );
  consentTemplateId = templates[0].id;
});

afterAll(async () => {
  // Cleanup in reverse dependency order
  if (consentTemplateId) {
    await client.query(
      "DELETE FROM public.academy_consent_records WHERE template_id = $1",
      [consentTemplateId],
    );
    await client.query(
      "DELETE FROM public.academy_consent_templates WHERE id = $1",
      [consentTemplateId],
    );
  }
  if (linkId) {
    await client.query(
      "DELETE FROM public.guardian_authority_events WHERE student_guardian_id = $1",
      [linkId],
    );
    await client.query(
      "DELETE FROM public.academy_student_guardians WHERE id = $1",
      [linkId],
    );
  }
  if (studentId) {
    await client.query("DELETE FROM public.academy_students WHERE id = $1", [
      studentId,
    ]);
  }
  if (guardianId) {
    await client.query("DELETE FROM public.academy_guardians WHERE id = $1", [
      guardianId,
    ]);
  }
  // Clean auth users for downstream test isolation
  await client.query(
    "DELETE FROM auth.users WHERE email = 'guardian-consent@test.mn'",
  );
  await client.query(
    "DELETE FROM auth.users WHERE email = 'other-consent@test.mn'",
  );
  client.release();
  await pool.end();
});

// ── Schema verification ─────────────────────────────────────────────────────

describe("cmd_sign_consent function exists", () => {
  it("байгаа эсэх", async () => {
    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc WHERE proname = 'cmd_sign_consent'
      ) AS exists
    `);
    expect(rows[0]?.exists).toBe(true);
  });
});

describe("cmd_withdraw_consent function exists", () => {
  it("байгаа эсэх", async () => {
    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc WHERE proname = 'cmd_withdraw_consent'
      ) AS exists
    `);
    expect(rows[0]?.exists).toBe(true);
  });
});

// ── cmd_sign_consent ─────────────────────────────────────────────────────────

describe("cmd_sign_consent", () => {
  it("verified guardian successfully signs a pending consent template", async () => {
    await asUser(client, guardianUserId, async () => {
      const { rows } = await client.query(
        "SELECT public.cmd_sign_consent($1, $2, $3) AS result",
        [consentTemplateId, studentId, "Тест Асран Хамгаалагч"],
      );
      const result = rows[0].result;
      expect(result).toBeDefined();
      expect(result.status).toBe("signed");
      expect(result.record_id).toBeTruthy();
      expect(result.template_id).toBe(consentTemplateId);
      expect(result.student_id).toBe(studentId);
      createdRecordId = result.record_id;

      // Verify the record exists in the table
      const { rows: records } = await client.query(
        "SELECT * FROM public.academy_consent_records WHERE id = $1",
        [result.record_id],
      );
      expect(records[0]).toBeDefined();
      expect(records[0].template_id).toBe(consentTemplateId);
      expect(records[0].student_id).toBe(studentId);
      expect(records[0].guardian_id).toBe(guardianId);
      expect(records[0].signed_text).toBe("Тест Асран Хамгаалагч");
      expect(records[0].is_withdrawn).toBe(false);
    });
  });

  it("prevents duplicate signing of the same template for the same student", async () => {
    await asUser(client, guardianUserId, async () => {
      await expect(
        client.query("SELECT public.cmd_sign_consent($1, $2, $3) AS result", [
          consentTemplateId,
          studentId,
          "Давхар гарын үсэг",
        ]),
      ).rejects.toThrow(/ALREADY_SIGNED/i);
    });
  });

  it("prevents unauthorized user from signing", async () => {
    await asUser(client, otherUserId, async () => {
      await expect(
        client.query("SELECT public.cmd_sign_consent($1, $2, $3) AS result", [
          consentTemplateId,
          studentId,
          "Хакер",
        ]),
      ).rejects.toThrow(/NOT_AUTHORIZED/i);
    });
  });
});

// ── cmd_withdraw_consent ──────────────────────────────────────────────────────

describe("cmd_withdraw_consent", () => {
  it("verified guardian can withdraw their signed consent", async () => {
    await asUser(client, guardianUserId, async () => {
      const { rows } = await client.query(
        "SELECT public.cmd_withdraw_consent($1) AS result",
        [createdRecordId],
      );
      const result = rows[0].result;
      expect(result).toBeDefined();
      expect(result.status).toBe("withdrawn");
      expect(result.record_id).toBe(createdRecordId);

      // Verify the record is now withdrawn
      const { rows: records } = await client.query(
        "SELECT * FROM public.academy_consent_records WHERE id = $1",
        [createdRecordId],
      );
      expect(records[0].is_withdrawn).toBe(true);
      expect(records[0].withdrawn_at).toBeTruthy();
    });
  });

  it("prevents re-withdrawing an already withdrawn consent", async () => {
    await asUser(client, guardianUserId, async () => {
      await expect(
        client.query("SELECT public.cmd_withdraw_consent($1) AS result", [
          createdRecordId,
        ]),
      ).rejects.toThrow(/ALREADY_WITHDRAWN/i);
    });
  });

  it("prevents unauthorized user from withdrawing", async () => {
    await asUser(client, otherUserId, async () => {
      await expect(
        client.query("SELECT public.cmd_withdraw_consent($1) AS result", [
          createdRecordId,
        ]),
      ).rejects.toThrow(/NOT_AUTHORIZED/i);
    });
  });

  it("returns error for non-existent record", async () => {
    await asUser(client, guardianUserId, async () => {
      await expect(
        client.query("SELECT public.cmd_withdraw_consent($1) AS result", [
          "00000000-0000-0000-0000-000000000000",
        ]),
      ).rejects.toThrow(/RECORD_NOT_FOUND/i);
    });
  });
});

// ── Re-sign after withdrawal ─────────────────────────────────────────────────

describe("re-sign after withdrawal", () => {
  it("allows guardian to sign again after withdrawal", async () => {
    await asUser(client, guardianUserId, async () => {
      const { rows } = await client.query(
        "SELECT public.cmd_sign_consent($1, $2, $3) AS result",
        [consentTemplateId, studentId, "Дахин гарын үсэг"],
      );
      const result = rows[0].result;
      expect(result.status).toBe("signed");
      expect(result.record_id).not.toBe(createdRecordId); // New record

      // Update cleanup target
      createdRecordId = result.record_id;
    });
  });
});
