import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newPool } from "./setup-integration";

let pool: Pool;
let client: PoolClient;
let academyId: string;
let studentId: string;

beforeAll(async () => {
  pool = newPool();
  client = await pool.connect();

  // Get the seeded academy ID
  const { rows } = await client.query(
    "SELECT id FROM public.academy_profiles LIMIT 1",
  );
  academyId = rows[0].id;
});

afterAll(async () => {
  await client.query(
    "DELETE FROM public.academy_student_guardians WHERE student_id IN (SELECT id FROM public.academy_students WHERE academy_id = $1)",
    [academyId],
  );
  await client.query(
    "DELETE FROM public.academy_students WHERE academy_id = $1",
    [academyId],
  );
  await client.query(
    "DELETE FROM public.academy_guardians WHERE academy_id = $1",
    [academyId],
  );
  client.release();
  await pool.end();
});

describe("academy_students table", () => {
  it("table exists with expected columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'academy_students'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("canonical_name");
    expect(cols).toContain("date_of_birth");
    expect(cols).toContain("medical_notes");
    expect(cols).toContain("allergies");
    expect(cols).toContain("emergency_contact_phone");
    expect(cols).toContain("status");
  });
});

describe("academy_guardians table", () => {
  it("table exists with expected columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'academy_guardians'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("name");
    expect(cols).toContain("phone");
    expect(cols).toContain("relationship");
    expect(cols).toContain("is_primary");
  });
});

describe("cmd_create_student", () => {
  it("creates a student successfully", async () => {
    const { rows } = await client.query(
      `SELECT * FROM public.cmd_create_student(
        $1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10
      )`,
      [
        academyId,
        "Батаа Жаргал",
        "Bataa Jargal",
        "2010-06-15",
        "1-р Сургууль",
        "9-р анги",
        "Астматай",
        ["тоос", "цэцэг"],
        "Ээж",
        "+976-99112233",
      ],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].canonical_name).toBe("Батаа Жаргал");
    expect(rows[0].allergies).toEqual(["тоос", "цэцэг"]);
    expect(rows[0].emergency_contact_phone).toBe("+976-99112233");
    expect(rows[0].status).toBe("active");
    studentId = rows[0].id;
  });

  it("creates student with minimal fields", async () => {
    const { rows } = await client.query(
      "SELECT * FROM public.cmd_create_student($1, $2)",
      [academyId, "Миньян Сурагч"],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].canonical_name).toBe("Миньян Сурагч");
    expect(rows[0].status).toBe("active");
  });
});

describe("cmd_update_student", () => {
  it("updates student fields", async () => {
    const { rows } = await client.query(
      "SELECT * FROM public.cmd_update_student($1, p_school_name => $2, p_medical_notes => $3)",
      [studentId, "2-р Сургууль", "Астма, харшил"],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].school_name).toBe("2-р Сургууль");
    expect(rows[0].medical_notes).toBe("Астма, харшил");
  });

  it("updates status", async () => {
    const { rows } = await client.query(
      "SELECT * FROM public.cmd_update_student($1, p_status => 'withdrawn')",
      [studentId],
    );
    expect(rows[0].status).toBe("withdrawn");
  });

  it("raises error for non-existent student", async () => {
    await expect(
      client.query(
        "SELECT * FROM public.cmd_update_student($1, p_canonical_name => 'test')",
        ["00000000-0000-0000-0000-000000000000"],
      ),
    ).rejects.toThrow(/student not found/);
  });
});

describe("academy_guardians CRUD", () => {
  it("inserts a guardian", async () => {
    const { rows } = await client.query(
      `INSERT INTO public.academy_guardians (academy_id, name, phone, relationship, is_primary)
       VALUES ($1, $2, $3, 'parent', true)
       RETURNING id, name, relationship`,
      [academyId, "Ээж", "+976-99001111"],
    );
    expect(rows[0].name).toBe("Ээж");
    expect(rows[0].relationship).toBe("parent");
  });
});

describe("student-guardian junction", () => {
  it("links student to guardian", async () => {
    const { rows: guardians } = await client.query(
      "SELECT id FROM public.academy_guardians WHERE academy_id = $1 LIMIT 1",
      [academyId],
    );

    await client.query(
      "INSERT INTO public.academy_student_guardians (student_id, guardian_id) VALUES ($1, $2)",
      [studentId, guardians[0].id],
    );

    const { rows } = await client.query(
      "SELECT count(*) as cnt FROM public.academy_student_guardians WHERE student_id = $1",
      [studentId],
    );
    expect(parseInt(rows[0].cnt, 10)).toBeGreaterThan(0);
  });
});
