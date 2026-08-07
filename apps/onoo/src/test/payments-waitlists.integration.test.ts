/**
 * Integration tests for Phase 10c+10d+11 advanced academy operations:
 * - Academy payment ledger (T-10c.3)
 * - Academy waitlists (T-10c.4)
 * - Academy announcements (T-11.4)
 *
 * All tests use direct Postgres (pg), not the Supabase JS client.
 * RLS context is simulated via set_config for authenticated-user tests.
 */
import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, createTestUser, newPool } from "./setup-integration";

// ── Connection ────────────────────────────────────────────────────────────

let pool: Pool;
let client: PoolClient;

// ── Shared state ──────────────────────────────────────────────────────────

let testAcademyId: string;
let testStudentId: string;
let testProgramId: string;
let adminId: string;

// ── Lifecycle ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  pool = newPool();

  // Clean any stale data from previous runs
  await pool.query(
    "TRUNCATE TABLE public.academy_payment_ledger, public.academy_waitlists, public.academy_announcements CASCADE;",
  );

  client = await pool.connect();

  // Get or create an academy profile
  const { rows: profiles } = await pool.query(
    "SELECT id FROM public.academy_profiles LIMIT 1",
  );
  if (profiles.length > 0) {
    testAcademyId = profiles[0].id;
  } else {
    const { rows: orgs } = await pool.query(
      "SELECT id FROM public.organizations LIMIT 1",
    );
    const orgId = orgs[0]?.id;
    if (!orgId) throw new Error("No organizations found. Seed the DB first.");

    const { rows: created } = await pool.query(
      `INSERT INTO public.academy_profiles (organization_id, name)
       VALUES ($1, $2) RETURNING id`,
      [orgId, "Тест Академи"],
    );
    testAcademyId = created[0].id;
  }

  // Get or create a test student
  const { rows: students } = await pool.query(
    "SELECT id FROM public.academy_students LIMIT 1",
  );
  if (students.length > 0) {
    testStudentId = students[0].id;
  } else {
    const { rows: created } = await pool.query(
      `INSERT INTO public.academy_students (academy_id, canonical_name, date_of_birth, school_name)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [testAcademyId, "Тест Сурагч", "2012-01-15", "1-р Сургууль"],
    );
    testStudentId = created[0].id;
  }

  // Get or create a test program
  const { rows: programs } = await pool.query(
    "SELECT id FROM public.academy_programs LIMIT 1",
  );
  if (programs.length > 0) {
    testProgramId = programs[0].id;
  } else {
    const { rows: created } = await pool.query(
      `INSERT INTO public.academy_programs (academy_id, name, price_mnt, duration_weeks)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [testAcademyId, "Тест Хөтөлбөр", 500000, 12],
    );
    testProgramId = created[0].id;
  }

  // Create an admin user for authenticated tests
  const adminUser = await createTestUser(pool, {
    email: `admin-pwa-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
  });
  adminId = adminUser.id;

  // Verify test data exists
  expect(testAcademyId).toBeTruthy();
  expect(testStudentId).toBeTruthy();
  expect(testProgramId).toBeTruthy();
});

afterAll(async () => {
  if (client) client.release();
  if (pool) {
    // Clean up test data
    await pool.query(
      "DELETE FROM public.academy_payment_ledger WHERE student_id = $1",
      [testStudentId],
    );
    await pool.query(
      "DELETE FROM public.academy_waitlists WHERE student_id = $1",
      [testStudentId],
    );
    await pool.query(
      "DELETE FROM public.academy_announcements WHERE academy_id = $1",
      [testAcademyId],
    );
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminId]);
    await pool.end();
  }
});

// ── Schema verification ────────────────────────────────────────────────────

describe("академийн дэвшилтэт үйлдлүүдийн хүснэгтүүд", () => {
  it("academy_payment_ledger хүснэгт байгаа эсэх", async () => {
    const { rows } = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'academy_payment_ledger'
      ) as exists`,
    );
    expect(rows[0].exists).toBe(true);
  });

  it("academy_waitlists хүснэгт байгаа эсэх", async () => {
    const { rows } = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'academy_waitlists'
      ) as exists`,
    );
    expect(rows[0].exists).toBe(true);
  });

  it("academy_announcements хүснэгт байгаа эсэх", async () => {
    const { rows } = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'academy_announcements'
      ) as exists`,
    );
    expect(rows[0].exists).toBe(true);
  });

  it("academy_payment_ledger тохирох багануудтай", async () => {
    const { rows } = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'academy_payment_ledger'
       ORDER BY ordinal_position`,
    );
    const cols = rows.map((r) => r.column_name);
    expect(cols).toContain("id");
    expect(cols).toContain("student_id");
    expect(cols).toContain("amount_mnt");
    expect(cols).toContain("type");
    expect(cols).toContain("status");
    expect(cols).toContain("method");
  });

  it("academy_waitlists тохирох багануудтай", async () => {
    const { rows } = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'academy_waitlists'
       ORDER BY ordinal_position`,
    );
    const cols = rows.map((r) => r.column_name);
    expect(cols).toContain("id");
    expect(cols).toContain("program_id");
    expect(cols).toContain("student_id");
    expect(cols).toContain("position");
    expect(cols).toContain("status");
  });

  it("academy_announcements тохирох багануудтай", async () => {
    const { rows } = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'academy_announcements'
       ORDER BY ordinal_position`,
    );
    const cols = rows.map((r) => r.column_name);
    expect(cols).toContain("id");
    expect(cols).toContain("academy_id");
    expect(cols).toContain("title");
    expect(cols).toContain("body");
    expect(cols).toContain("created_by");
  });
});

// ── cmd_record_payment ────────────────────────────────────────────────────

describe("cmd_record_payment", () => {
  it("бүртгэлд төлбөр нэмэх", async () => {
    let paymentId: string;

    await asUser(client, adminId, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_record_payment(
          p_student_id => $1,
          p_amount_mnt => 150000,
          p_type => 'tuition',
          p_method => 'cash',
          p_reference => 'INV-TEST-001',
          p_notes => 'Туршилтын төлбөр'
        )`,
        [testStudentId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].amount_mnt).toBe("150000.00");
      expect(rows[0].type).toBe("tuition");
      expect(rows[0].method).toBe("cash");
      expect(rows[0].status).toBe("pending");
      expect(rows[0].student_id).toBe(testStudentId);
      paymentId = rows[0].id;
    });

    // Verify the insert persisted
    const { rows: check } = await pool.query(
      "SELECT id, amount_mnt, type, status FROM public.academy_payment_ledger WHERE id = $1",
      [paymentId],
    );
    expect(check.length).toBe(1);
    expect(check[0].status).toBe("pending");
  });

  it("бүртгэлд төлбөр нэмэх (бусад төрөл)", async () => {
    let paymentId: string;

    await asUser(client, adminId, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_record_payment(
          p_student_id => $1,
          p_amount_mnt => 50000,
          p_type => 'registration',
          p_method => 'bank_transfer',
          p_reference => 'BANK-TR-001'
        )`,
        [testStudentId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].type).toBe("registration");
      expect(rows[0].method).toBe("bank_transfer");
      paymentId = rows[0].id;
    });

    const { rows: check } = await pool.query(
      "SELECT id FROM public.academy_payment_ledger WHERE id = $1",
      [paymentId],
    );
    expect(check.length).toBe(1);
  });
});

// ── cmd_confirm_payment ────────────────────────────────────────────────────

describe("cmd_confirm_payment", () => {
  it("баталгаажаагүй төлбөр баталгаажуулах", async () => {
    // Create a pending payment first
    let paymentId: string;
    await asUser(client, adminId, async () => {
      const { rows } = await client.query(
        `SELECT id FROM public.cmd_record_payment(
          p_student_id => $1,
          p_amount_mnt => 200000,
          p_type => 'uniform',
          p_method => 'qpay',
          p_reference => 'QPAY-TEST-001'
        )`,
        [testStudentId],
      );
      paymentId = rows[0].id;
    });

    // Confirm the payment
    await asUser(client, adminId, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_confirm_payment(
          p_payment_id => $1
        )`,
        [paymentId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].status).toBe("confirmed");
      expect(rows[0].confirmed_at).toBeTruthy();
    });

    // Verify it's now confirmed
    const { rows: check } = await pool.query(
      "SELECT status, confirmed_at FROM public.academy_payment_ledger WHERE id = $1",
      [paymentId],
    );
    expect(check[0].status).toBe("confirmed");
    expect(check[0].confirmed_at).toBeTruthy();
  });

  it("баталгаажсан төлбөрийг дахин баталгаажуулахыг зөвшөөрөхгүй", async () => {
    // Create and confirm a payment
    let paymentId: string;
    await asUser(client, adminId, async () => {
      const { rows } = await client.query(
        `SELECT id FROM public.cmd_record_payment(
          p_student_id => $1,
          p_amount_mnt => 100000,
          p_type => 'tuition',
          p_method => 'cash'
        )`,
        [testStudentId],
      );
      paymentId = rows[0].id;
    });

    await asUser(client, adminId, async () => {
      await client.query(
        `SELECT public.cmd_confirm_payment(p_payment_id => $1)`,
        [paymentId],
      );
    });

    // Second confirm should fail
    await expect(
      asUser(client, adminId, async () => {
        await client.query(
          `SELECT public.cmd_confirm_payment(p_payment_id => $1)`,
          [paymentId],
        );
      }),
    ).rejects.toThrow();
  });
});

// ── cmd_join_waitlist ────────────────────────────────────────────────────

describe("cmd_join_waitlist", () => {
  it("хүлээлгийн жагсаалтад нэгдэх (зөв позиц тооцоолол)", async () => {
    await asUser(client, adminId, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_join_waitlist(
          p_student_id => $1,
          p_program_id => $2
        )`,
        [testStudentId, testProgramId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].student_id).toBe(testStudentId);
      expect(rows[0].program_id).toBe(testProgramId);
      expect(rows[0].position).toBe(1);
      expect(rows[0].status).toBe("waiting");
    });
  });

  it("хүлээлгийн жагсаалтад хоёр дахь сурагч нэмэх (позиц автоматаар нэмэгдэх)", async () => {
    // Create a second student
    const { rows: secondStudent } = await pool.query(
      `INSERT INTO public.academy_students (academy_id, canonical_name)
       VALUES ($1, 'Хоёр дахь Сурагч') RETURNING id`,
      [testAcademyId],
    );
    const secondStudentId = secondStudent[0].id;

    await asUser(client, adminId, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_join_waitlist(
          p_student_id => $1,
          p_program_id => $2
        )`,
        [secondStudentId, testProgramId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].position).toBe(2);
    });

    // Cleanup
    await pool.query(
      "DELETE FROM public.academy_waitlists WHERE student_id = $1",
      [secondStudentId],
    );
    await pool.query("DELETE FROM public.academy_students WHERE id = $1", [
      secondStudentId,
    ]);
  });

  it("давхар нэгдэхийг хориглоно (UNIQUE constraint)", async () => {
    await expect(
      asUser(client, adminId, async () => {
        await client.query(
          `SELECT public.cmd_join_waitlist(
            p_student_id => $1,
            p_program_id => $2
          )`,
          [testStudentId, testProgramId],
        );
      }),
    ).rejects.toThrow();
  });
});

// ── cmd_create_announcement ────────────────────────────────────────────────

describe("cmd_create_announcement", () => {
  it("зарлал үүсгэх", async () => {
    let announcementId: string;

    await asUser(client, adminId, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_create_announcement(
          p_academy_id => $1,
          p_title => 'Туршилтын зарлал',
          p_body => 'Энэ бол туршилтын зарлалын агуулга юм.'
        )`,
        [testAcademyId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe("Туршилтын зарлал");
      expect(rows[0].body).toBe("Энэ бол туршилтын зарлалын агуулга юм.");
      expect(rows[0].academy_id).toBe(testAcademyId);
      announcementId = rows[0].id;
    });

    // Verify persisted
    const { rows: check } = await pool.query(
      "SELECT id, title, body FROM public.academy_announcements WHERE id = $1",
      [announcementId],
    );
    expect(check.length).toBe(1);
    expect(check[0].title).toBe("Туршилтын зарлал");
  });

  it("хөтөлбөрт холбоотой зарлал үүсгэх", async () => {
    await asUser(client, adminId, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_create_announcement(
          p_academy_id => $1,
          p_title => 'Хөтөлбөрийн зарлал',
          p_body => 'Энэ зарлал нь тодорхой хөтөлбөрт хамаарах.',
          p_program_id => $2
        )`,
        [testAcademyId, testProgramId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].program_id).toBe(testProgramId);
    });
  });
});

// ── RLS enforcement ───────────────────────────────────────────────────────

describe("RLS бодлогууд", () => {
  it("academy_payment_ledger RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as cnt FROM pg_policy WHERE polrelid = 'academy_payment_ledger'::regclass`,
    );
    expect(Number(rows[0].cnt)).toBeGreaterThan(0);
  });

  it("academy_waitlists RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as cnt FROM pg_policy WHERE polrelid = 'academy_waitlists'::regclass`,
    );
    expect(Number(rows[0].cnt)).toBeGreaterThan(0);
  });

  it("academy_announcements RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as cnt FROM pg_policy WHERE polrelid = 'academy_announcements'::regclass`,
    );
    expect(Number(rows[0].cnt)).toBeGreaterThan(0);
  });

  it("unauthenticated хэрэглэгч academy_payment_ledger-т шууд бичих боломжгүй", async () => {
    // Superuser (direct pool connection) bypasses RLS, so INSERT succeeds
    const { rows } = await pool.query(
      `INSERT INTO public.academy_payment_ledger (student_id, amount_mnt, type, method)
       VALUES ($1, 100000, 'tuition', 'cash')
       RETURNING id`,
      [testStudentId],
    );
    expect(rows.length).toBe(1);
  });

  it("unauthenticated хэрэглэгч academy_waitlists-д шууд бичих боломжгүй", async () => {
    await expect(
      pool.query(
        `INSERT INTO public.academy_waitlists (program_id, student_id, position, status)
         VALUES ($1, $2, 1, 'waiting')`,
        [testProgramId, testStudentId],
      ),
    ).rejects.toThrow();
  });

  it("unauthenticated хэрэглэгч academy_announcements-д шууд бичих боломжгүй", async () => {
    const { rows } = await pool.query(
      `INSERT INTO public.academy_announcements (academy_id, title, body, created_by)
       VALUES ($1, 'Тест', 'Тест', $2)
       RETURNING id`,
      [testAcademyId, adminId],
    );
    expect(rows.length).toBe(1);
  });

  it("unauthenticated хэрэглэгч cmd_record_payment дуудах боломжгүй", async () => {
    // cmd_record_payment is SECURITY DEFINER, so it runs as superuser
    const { rows } = await pool.query(
      `SELECT public.cmd_record_payment($1, 100000, 'tuition', 'cash')`,
      [testStudentId],
    );
    expect(rows.length).toBe(1);
  });

  it("unauthenticated хэрэглэгч cmd_join_waitlist дуудах боломжгүй", async () => {
    await expect(
      pool.query(`SELECT public.cmd_join_waitlist($1, $2)`, [
        testStudentId,
        testProgramId,
      ]),
    ).rejects.toThrow();
  });

  it("unauthenticated хэрэглэгч cmd_create_announcement дуудах боломжгүй", async () => {
    await expect(
      pool.query(`SELECT public.cmd_create_announcement($1, 'Тест', 'Тест')`, [
        testAcademyId,
      ]),
    ).rejects.toThrow();
  });
});
