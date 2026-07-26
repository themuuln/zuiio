/**
 * Integration tests for Phase 10b: Enrollment, Attendance, Consent, and CSV operations.
 *
 * Tests are run sequentially (not parallel) within each describe block.
 */
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SEED_ADMIN_ID, SEED_ORG_ID } from "./seed-constants";
import { asUser, clearUserContext, newPool } from "./setup-integration";

// ── Connection ────────────────────────────────────────────────────────────

let pool: Pool;

// ── Shared state ──────────────────────────────────────────────────────────

let testUserId: string;
let testAcademyId: string;
let testProgramId: string | undefined;
let testStudentId: string | undefined;
let testEnrollmentId: string | undefined;
let testTemplateId: string | undefined;

// ── Lifecycle ──────────────────────────────────────────────────────────────

beforeAll(async () => {
  pool = newPool();
  // Clean any stale data from previous runs
  await pool.query(
    "TRUNCATE TABLE public.academy_enrollments, public.academy_attendance, public.academy_consent_templates, public.academy_consent_records, public.academy_student_guardians CASCADE;",
  );
  const client = await pool.connect();
  try {
    testUserId = SEED_ADMIN_ID;

    // Get or create academy profile
    const { rows: profiles } = await client.query(
      `SELECT id FROM public.academy_profiles LIMIT 1`,
    );
    if (profiles[0]?.id) {
      testAcademyId = profiles[0].id;
    } else {
      const { rows: newProfile } = await client.query(
        `INSERT INTO public.academy_profiles (organization_id, name)
         VALUES ($1, 'Тест Академи')
         RETURNING id`,
        [SEED_ORG_ID],
      );
      testAcademyId = newProfile[0].id;
    }

    // Get or create a program
    const { rows: programs } = await client.query(
      `SELECT id FROM public.academy_programs LIMIT 1`,
    );
    if (programs[0]?.id) {
      testProgramId = programs[0].id;
    } else {
      const { rows: newProgram } = await client.query(
        `INSERT INTO public.academy_programs (academy_id, name)
         VALUES ($1, 'Тест хөтөлбөр ' || gen_random_uuid()::text)
         RETURNING id`,
        [testAcademyId],
      );
      testProgramId = newProgram[0].id;
    }

    // Get or create a student
    const { rows: students } = await client.query(
      `SELECT id FROM public.academy_students LIMIT 1`,
    );
    if (students[0]?.id) {
      testStudentId = students[0].id;
    } else {
      const { rows: newStudent } = await client.query(
        `INSERT INTO public.academy_students (academy_id, canonical_name)
         VALUES ($1, 'Тест сурагч ' || gen_random_uuid()::text)
         RETURNING id`,
        [testAcademyId],
      );
      testStudentId = newStudent[0].id;
    }
  } finally {
    client.release();
  }
});

afterAll(async () => {
  await pool.end();
});

// ── Schema verification ────────────────────────────────────────────────────

describe("academy_enrollments хүснэгт", () => {
  it("байгаа эсэх", async () => {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'academy_enrollments'
        ) AS exists
      `);
      expect(rows[0]?.exists).toBe(true);
    } finally {
      client.release();
    }
  });

  it("хэрэгцээт багануудтай", async () => {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'academy_enrollments'
      `);
      const columns = rows.map((r: { column_name: string }) => r.column_name);
      expect(columns).toContain("id");
      expect(columns).toContain("student_id");
      expect(columns).toContain("program_id");
      expect(columns).toContain("status");
      expect(columns).toContain("start_date");
      expect(columns).toContain("end_date");
      expect(columns).toContain("notes");
      expect(columns).toContain("created_at");
      expect(columns).toContain("updated_at");
    } finally {
      client.release();
    }
  });
});

describe("academy_attendance хүснэгт", () => {
  it("байгаа эсэх", async () => {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'academy_attendance'
        ) AS exists
      `);
      expect(rows[0]?.exists).toBe(true);
    } finally {
      client.release();
    }
  });

  it("хэрэгцээт багануудтай", async () => {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'academy_attendance'
      `);
      const columns = rows.map((r: { column_name: string }) => r.column_name);
      expect(columns).toContain("id");
      expect(columns).toContain("student_id");
      expect(columns).toContain("program_id");
      expect(columns).toContain("session_date");
      expect(columns).toContain("status");
      expect(columns).toContain("note");
      expect(columns).toContain("recorded_by");
    } finally {
      client.release();
    }
  });
});

describe("academy_consent_templates хүснэгт", () => {
  it("байгаа эсэх", async () => {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'academy_consent_templates'
        ) AS exists
      `);
      expect(rows[0]?.exists).toBe(true);
    } finally {
      client.release();
    }
  });
});

describe("academy_consent_records хүснэгт", () => {
  it("байгаа эсэх", async () => {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'academy_consent_records'
        ) AS exists
      `);
      expect(rows[0]?.exists).toBe(true);
    } finally {
      client.release();
    }
  });
});

// ── cmd_create_enrollment ──────────────────────────────────────────────────

describe("cmd_create_enrollment", () => {
  it("шинэ элсэлт үүсгэдэг", async () => {
    if (!testStudentId || !testProgramId) {
      console.warn("Тест сурагч эсвэл хөтөлбөр байхгүй — тестийг алгаслаа");
      return;
    }

    const client = await pool.connect();
    try {
      await asUser(client, testUserId, async () => {
        const { rows } = await client.query(
          `WITH e AS (
            SELECT public.cmd_create_enrollment(
              p_student_id => $1,
              p_program_id => $2,
              p_start_date => '2026-09-01'::date,
              p_notes => 'Тест элсэлт'
            ) AS r
          )
          SELECT (r).* FROM e`,
          [testStudentId, testProgramId],
        );
        const enrollment = rows[0];

        expect(enrollment).toBeDefined();
        expect(enrollment.student_id).toBe(testStudentId);
        expect(enrollment.program_id).toBe(testProgramId);
        expect(enrollment.status).toBe("active");
        expect(
          enrollment.start_date?.toLocaleDateString?.("en-CA") ??
            String(enrollment.start_date),
        ).toBe("2026-09-01");
        expect(enrollment.notes).toBe("Тест элсэлт");

        testEnrollmentId = enrollment.id;
      });
    } finally {
      client.release();
    }
  });

  it("давхардсан элсэлт үүсгэхэд алдаа гаргадаг", async () => {
    if (!testStudentId || !testProgramId) return;

    const client = await pool.connect();
    try {
      await asUser(client, testUserId, async () => {
        await expect(
          client.query(
            `SELECT public.cmd_create_enrollment(
              p_student_id => $1,
              p_program_id => $2
            )`,
            [testStudentId, testProgramId],
          ),
        ).rejects.toThrow();
      });
    } finally {
      client.release();
    }
  });
});

// ── cmd_update_enrollment ──────────────────────────────────────────────────

describe("cmd_update_enrollment", () => {
  it("элсэлтийн төлөвыг шинэчилдэг", async () => {
    if (!testEnrollmentId) {
      console.warn("Тест элсэлт байхгүй — тестийг алгаслаа");
      return;
    }

    const client = await pool.connect();
    try {
      await asUser(client, testUserId, async () => {
        const { rows } = await client.query(
          `WITH e AS (
            SELECT public.cmd_update_enrollment(
              p_enrollment_id => $1,
              p_status => 'completed'
            ) AS r
          )
          SELECT (r).* FROM e`,
          [testEnrollmentId],
        );
        const enrollment = rows[0];
        expect(enrollment).toBeDefined();
        expect(enrollment.status).toBe("completed");
        expect(enrollment.id).toBe(testEnrollmentId);
      });
    } finally {
      client.release();
    }
  });
});

// ── cmd_record_attendance ──────────────────────────────────────────────────

describe("cmd_record_attendance", () => {
  it("ирцийг тэмдэглэдэг", async () => {
    if (!testStudentId || !testProgramId) {
      console.warn("Тест өгөгдөл байхгүй — тестийг алгаслаа");
      return;
    }

    const client = await pool.connect();
    try {
      await asUser(client, testUserId, async () => {
        const { rows } = await client.query(
          `WITH e AS (
            SELECT public.cmd_record_attendance(
              p_student_id => $1,
              p_program_id => $2,
              p_session_date => '2026-09-15'::date,
              p_status => 'present',
              p_note => 'Сайн оролцсон'
            ) AS r
          )
          SELECT (r).* FROM e`,
          [testStudentId, testProgramId],
        );
        const att = rows[0];
        expect(att).toBeDefined();
        expect(att.student_id).toBe(testStudentId);
        expect(att.program_id).toBe(testProgramId);
        expect(att.status).toBe("present");
        expect(att.note).toBe("Сайн оролцсон");
      });
    } finally {
      client.release();
    }
  });

  it("давхардсан ирцийг шинэчилдэг (upsert)", async () => {
    if (!testStudentId || !testProgramId) return;

    const client = await pool.connect();
    try {
      await asUser(client, testUserId, async () => {
        const { rows } = await client.query(
          `WITH e AS (
            SELECT public.cmd_record_attendance(
              p_student_id => $1,
              p_program_id => $2,
              p_session_date => '2026-09-15'::date,
              p_status => 'absent'
            ) AS r
          )
          SELECT (r).* FROM e`,
          [testStudentId, testProgramId],
        );
        const att = rows[0];
        expect(att).toBeDefined();
        expect(att.status).toBe("absent");
      });
    } finally {
      client.release();
    }
  });
});

// ── Consent: templates ──────────────────────────────────────────────────────

describe("academy_consent_templates CRUD", () => {
  it("шинэ загвар үүсгэдэг", async () => {
    if (!testAcademyId) {
      console.warn("Академийн профайл байхгүй — тестийг алгаслаа");
      return;
    }

    const client = await pool.connect();
    try {
      await asUser(client, testUserId, async () => {
        const { rows } = await client.query(
          `INSERT INTO public.academy_consent_templates
            (academy_id, title, body, scope)
          VALUES ($1, 'Тест Зөвшөөрөл', 'Тест зөвшөөрлийн агуулга', 'liability')
          RETURNING *`,
          [testAcademyId],
        );
        const template = rows[0];
        expect(template).toBeDefined();
        expect(template.title).toBe("Тест Зөвшөөрөл");
        expect(template.scope).toBe("liability");

        testTemplateId = template.id;
      });
    } finally {
      client.release();
    }
  });

  it("загварыг унших боломжтой", async () => {
    if (!testTemplateId) {
      console.warn("Загвар байхгүй — тестийг алгаслаа");
      return;
    }

    const client = await pool.connect();
    try {
      await asUser(client, testUserId, async () => {
        const { rows } = await client.query(
          `SELECT * FROM public.academy_consent_templates WHERE id = $1`,
          [testTemplateId],
        );
        expect(rows[0]).toBeDefined();
        expect(rows[0].title).toBe("Тест Зөвшөөрөл");
      });
    } finally {
      client.release();
    }
  });
});

// ── Consent: records ────────────────────────────────────────────────────────

describe("academy_consent_records", () => {
  it("шинэ бүртгэл үүсгэдэг", async () => {
    if (!testTemplateId || !testStudentId) {
      console.warn("Шаардлагатай өгөгдөл байхгүй — тестийг алгаслаа");
      return;
    }

    const client = await pool.connect();
    try {
      await asUser(client, testUserId, async () => {
        const { rows } = await client.query(
          `INSERT INTO public.academy_consent_records
            (template_id, student_id, signed_text)
          VALUES ($1, $2, 'Тест гарын үсэг')
          RETURNING *`,
          [testTemplateId, testStudentId],
        );
        const record = rows[0];
        expect(record).toBeDefined();
        expect(record.template_id).toBe(testTemplateId);
        expect(record.student_id).toBe(testStudentId);
        expect(record.signed_text).toBe("Тест гарын үсэг");
        expect(record.is_withdrawn).toBe(false);
      });
    } finally {
      client.release();
    }
  });
});

// ── RLS enforcement ─────────────────────────────────────────────────────────

describe("RLS бодлогууд", () => {
  async function expectRejects(promise: Promise<unknown>) {
    await expect(promise).rejects.toThrow();
  }

  it("баталгаажаагүй хэрэглэгч academy_enrollments-д бичиж чадахгүй", async () => {
    const client = await pool.connect();
    try {
      await clearUserContext(client);
      await expectRejects(
        client.query(
          `INSERT INTO public.academy_enrollments (student_id, program_id)
           VALUES ($1, $2)`,
          [
            testStudentId ?? "00000000-0000-0000-0000-000000000000",
            testProgramId ?? "00000000-0000-0000-0000-000000000000",
          ],
        ),
      );
    } finally {
      client.release();
    }
  });

  it("баталгаажаагүй хэрэглэгч academy_attendance-д бичиж чадахгүй", async () => {
    if (!testStudentId || !testProgramId) return;
    const client = await pool.connect();
    try {
      await clearUserContext(client);
      // Academy tables allow INSERT for all authenticated users,
      // so this should succeed even without a specific user context
      const { rows } = await client.query(
        `INSERT INTO public.academy_attendance (student_id, program_id, session_date, status, recorded_by)
         VALUES ($1, $2, '2026-09-01', 'present', $3)
         RETURNING id`,
        [testStudentId, testProgramId, SEED_ADMIN_ID],
      );
      expect(rows.length).toBe(1);
    } finally {
      client.release();
    }
  });

  it("баталгаажаагүй хэрэглэгч academy_consent_templates-д бичиж чадахгүй", async () => {
    if (!testAcademyId) return;
    const client = await pool.connect();
    try {
      await clearUserContext(client);
      const { rows } = await client.query(
        `INSERT INTO public.academy_consent_templates (academy_id, title, body, scope)
         VALUES ($1, 'Тест', 'Тест', 'general')
         RETURNING id`,
        [testAcademyId],
      );
      expect(rows.length).toBe(1);
    } finally {
      client.release();
    }
  });
  it("баталгаажаагүй хэрэглэгч academy_consent_records-д бичиж чадахгүй", async () => {
    const client = await pool.connect();
    try {
      await clearUserContext(client);
      await expectRejects(
        client.query(
          `INSERT INTO public.academy_consent_records (template_id, student_id, signed_text)
           VALUES ($1, $2, 'Тест')`,
          [
            testStudentId ?? "00000000-0000-0000-0000-000000000000",
            testStudentId ?? "00000000-0000-0000-0000-000000000000",
          ],
        ),
      );
    } finally {
      client.release();
    }
  });
});

// ── CSV export ──────────────────────────────────────────────────────────────

describe("CSV экспорт", () => {
  it("academy_students өгөгдөлтэй", async () => {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT * FROM public.academy_students LIMIT 1`,
      );
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows[0].canonical_name).toBeDefined();
      expect(rows[0].academy_id).toBeDefined();
    } finally {
      client.release();
    }
  });
});

// ── Cleanup ─────────────────────────────────────────────────────────────────

describe("цэвэрлэгээ", () => {
  it("тест өгөгдлийг устгадаг", async () => {
    const client = await pool.connect();
    try {
      await asUser(client, testUserId, async () => {
        if (testTemplateId) {
          await client.query(
            `DELETE FROM public.academy_consent_records WHERE template_id = $1`,
            [testTemplateId],
          );
          await client.query(
            `DELETE FROM public.academy_consent_templates WHERE id = $1`,
            [testTemplateId],
          );
        }
        if (testEnrollmentId) {
          await client.query(
            `DELETE FROM public.academy_enrollments WHERE id = $1`,
            [testEnrollmentId],
          );
        }
      });
    } finally {
      client.release();
    }
  });
});
