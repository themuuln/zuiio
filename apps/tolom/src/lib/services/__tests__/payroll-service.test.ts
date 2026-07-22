import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  NotFoundError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "NotFoundError";
    }
  },
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);

import {
  calculateMonthlyPayroll,
  getPayRate,
  getPayrollRecords,
  listPayRates,
  updatePayrollRecordStatus,
  upsertPayRate,
} from "../payroll-service";

const ORG_ID = "org-1";
const MECHANIC_ID = "mech-1";
const BRANCH_ID = "branch-1";

let db: ReturnType<typeof createMockSupabaseClient>;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

function makePayRate(overrides: Record<string, unknown> = {}) {
  return {
    id: "rate-1",
    organization_id: ORG_ID,
    mechanic_id: MECHANIC_ID,
    hourly_rate: 15000,
    effective_from: "2026-01-01",
    effective_to: null,
    ...overrides,
  };
}

function makePayrollRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "pr-1",
    organization_id: ORG_ID,
    mechanic_id: MECHANIC_ID,
    period_start: "2026-01-01",
    period_end: "2026-01-31",
    total_hours: 160,
    hourly_rate: 15000,
    gross_pay: 2400000,
    status: "draft" as const,
    paid_at: null,
    notes: null,
    ...overrides,
  };
}

// ── getPayRate ─────────────────────────────────────────────────────

describe("getPayRate", () => {
  it("returns the current effective pay rate when found", async () => {
    const expected = makePayRate();
    const q = db.from("mechanic_pay_rates") as ReturnType<typeof db.from>;
    q.maybeSingle = vi.fn().mockResolvedValue({ data: expected, error: null });

    const r = await getPayRate(db as never, ORG_ID, MECHANIC_ID);

    expect(r).toEqual(expected);
  });

  it("returns null when no current rate exists", async () => {
    const r = await getPayRate(db as never, ORG_ID, MECHANIC_ID);

    expect(r).toBeNull();
  });

  it("returns null on DB error", async () => {
    const q = db.from("mechanic_pay_rates") as ReturnType<typeof db.from>;
    q.maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error("DB fail") });

    const r = await getPayRate(db as never, ORG_ID, MECHANIC_ID);

    expect(r).toBeNull();
  });

  it("queries with correct filters", async () => {
    const expected = makePayRate();
    const q = db.from("mechanic_pay_rates") as ReturnType<typeof db.from>;
    q.maybeSingle = vi.fn().mockResolvedValue({ data: expected, error: null });

    await getPayRate(db as never, ORG_ID, MECHANIC_ID);

    expect(db.from).toHaveBeenCalledWith("mechanic_pay_rates");
    expect(q.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(q.eq).toHaveBeenCalledWith("mechanic_id", MECHANIC_ID);
    expect(q.is).toHaveBeenCalledWith("effective_to", null);
  });
});

// ── upsertPayRate ──────────────────────────────────────────────────

describe("upsertPayRate", () => {
  const HOURLY_RATE = 16000;
  const EFFECTIVE_FROM = "2026-02-01";

  it("creates a new pay rate and ends the previous one", async () => {
    const inserted = makePayRate({
      id: "rate-2",
      hourly_rate: HOURLY_RATE,
      effective_from: EFFECTIVE_FROM,
    });
    // First await: update previous rate (result ignored)
    // Second await: insert().select().single()
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: inserted, error: null });

    const r = await upsertPayRate(
      db as never,
      ORG_ID,
      MECHANIC_ID,
      HOURLY_RATE,
      EFFECTIVE_FROM,
    );

    expect(r).toEqual(inserted);
  });

  it("updates effective_to of previous rate to day before effectiveFrom", async () => {
    const inserted = makePayRate({
      id: "rate-2",
      hourly_rate: HOURLY_RATE,
      effective_from: EFFECTIVE_FROM,
    });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: inserted, error: null });

    await upsertPayRate(
      db as never,
      ORG_ID,
      MECHANIC_ID,
      HOURLY_RATE,
      EFFECTIVE_FROM,
    );

    expect(db.from).toHaveBeenCalledWith("mechanic_pay_rates");
    // The update chain
    const updateChain = db.from("mechanic_pay_rates") as ReturnType<
      typeof db.from
    >;
    expect(updateChain.update).toHaveBeenCalledWith({
      effective_to: "2026-01-31",
    });
    expect(updateChain.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(updateChain.eq).toHaveBeenCalledWith("mechanic_id", MECHANIC_ID);
    expect(updateChain.is).toHaveBeenCalledWith("effective_to", null);
  });

  it("inserts new rate with correct values", async () => {
    const inserted = makePayRate({
      id: "rate-2",
      hourly_rate: HOURLY_RATE,
      effective_from: EFFECTIVE_FROM,
    });
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({ data: inserted, error: null }); // insert

    await upsertPayRate(
      db as never,
      ORG_ID,
      MECHANIC_ID,
      HOURLY_RATE,
      EFFECTIVE_FROM,
    );

    const insertChain = db.from("mechanic_pay_rates") as ReturnType<
      typeof db.from
    >;
    expect(insertChain.insert).toHaveBeenCalledWith({
      organization_id: ORG_ID,
      mechanic_id: MECHANIC_ID,
      hourly_rate: HOURLY_RATE,
      effective_from: EFFECTIVE_FROM,
    });
    expect(insertChain.select).toHaveBeenCalled();
    expect(insertChain.single).toHaveBeenCalled();
  });

  it("throws on insert error", async () => {
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({ data: null, error: new Error("Insert failed") }); // insert

    await expect(
      upsertPayRate(
        db as never,
        ORG_ID,
        MECHANIC_ID,
        HOURLY_RATE,
        EFFECTIVE_FROM,
      ),
    ).rejects.toThrow("Insert failed");
  });

  it("calls logAuditAfter with correct params", async () => {
    const inserted = makePayRate({
      id: "rate-2",
      hourly_rate: HOURLY_RATE,
      effective_from: EFFECTIVE_FROM,
    });
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({ data: inserted, error: null }); // insert

    await upsertPayRate(
      db as never,
      ORG_ID,
      MECHANIC_ID,
      HOURLY_RATE,
      EFFECTIVE_FROM,
    );

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        supabase: db,
        action: "create",
        table_name: "mechanic_pay_rates",
        record_id: "rate-2",
        organization_id: ORG_ID,
      }),
    );
  });

  it("calls revalidateTag", async () => {
    const inserted = makePayRate({
      id: "rate-2",
      hourly_rate: HOURLY_RATE,
      effective_from: EFFECTIVE_FROM,
    });
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({ data: inserted, error: null }); // insert

    await upsertPayRate(
      db as never,
      ORG_ID,
      MECHANIC_ID,
      HOURLY_RATE,
      EFFECTIVE_FROM,
    );

    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("handles effective_from on the 1st of the month", async () => {
    const inserted = makePayRate({
      id: "rate-2",
      hourly_rate: 17000,
      effective_from: "2026-03-01",
    });
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({ data: inserted, error: null }); // insert

    await upsertPayRate(db as never, ORG_ID, MECHANIC_ID, 17000, "2026-03-01");

    const updateChain = db.from("mechanic_pay_rates") as ReturnType<
      typeof db.from
    >;
    expect(updateChain.update).toHaveBeenCalledWith({
      effective_to: "2026-02-28",
    });
  });
});

// ── listPayRates ───────────────────────────────────────────────────

describe("listPayRates", () => {
  it("returns all current pay rates with mechanic names", async () => {
    const rates = [
      makePayRate({ id: "rate-1", mechanic_id: "mech-1" }),
      makePayRate({ id: "rate-2", mechanic_id: "mech-2", hourly_rate: 16000 }),
    ];
    const profiles = [
      { id: "mech-1", full_name: "Alice" },
      { id: "mech-2", full_name: "Bob" },
    ];

    // Two awaits: the rates query, then the profiles query
    db.__qb.resolveOnce({ data: rates, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });

    const r = await listPayRates(db as never, ORG_ID);

    expect(r).toHaveLength(2);
    expect(r[0].mechanic_name).toBe("Alice");
    expect(r[1].mechanic_name).toBe("Bob");
    expect(r[0].hourly_rate).toBe(15000);
    expect(r[1].hourly_rate).toBe(16000);
  });

  it("filters by branch when branchId provided", async () => {
    const branchMechanics = [{ id: "mech-1" }];
    const rates = [makePayRate({ id: "rate-1", mechanic_id: "mech-1" })];
    const profiles = [{ id: "mech-1", full_name: "Alice" }];

    // Query 1: branch mechanics from profiles
    // Query 2: rates filtered by mechanic_ids
    // Query 3: profiles for names
    db.__qb.resolveOnce({ data: branchMechanics, error: null });
    db.__qb.resolveOnce({ data: rates, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });

    const r = await listPayRates(db as never, ORG_ID, BRANCH_ID);

    expect(r).toHaveLength(1);
    expect(r[0].mechanic_name).toBe("Alice");
    expect(r[0].mechanic_id).toBe("mech-1");
  });

  it("returns empty array when branch has no mechanics", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const r = await listPayRates(db as never, ORG_ID, BRANCH_ID);

    expect(r).toEqual([]);
  });

  it("handles null mechanic_name when profile missing", async () => {
    const rates = [makePayRate({ id: "rate-1", mechanic_id: "mech-1" })];
    db.__qb.resolveOnce({ data: rates, error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const r = await listPayRates(db as never, ORG_ID);

    expect(r).toHaveLength(1);
    expect(r[0].mechanic_name).toBeNull();
  });

  it("throws on DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("DB fail") });

    await expect(listPayRates(db as never, ORG_ID)).rejects.toThrow("DB fail");
  });

  it("returns empty array when no pay rates exist", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const r = await listPayRates(db as never, ORG_ID);

    expect(r).toEqual([]);
  });
});

// ── calculateMonthlyPayroll ────────────────────────────────────────

describe("calculateMonthlyPayroll", () => {
  const YEAR = 2026;
  const MONTH = 1; // January

  function makeHoursRow(mechanicId: string, hours: number) {
    return { mechanic_id: mechanicId, hours_worked: hours };
  }

  it("calculates payroll for a single mechanic with no existing record", async () => {
    const hoursData = [makeHoursRow(MECHANIC_ID, 160)];
    const profiles = [{ id: MECHANIC_ID, full_name: "Alice" }];
    const ratesData = [
      {
        mechanic_id: MECHANIC_ID,
        hourly_rate: 15000,
        effective_from: "2026-01-01",
      },
    ];
    const existingRecords: Array<Record<string, unknown>> = [];
    const insertedRecord = makePayrollRecord({ id: "pr-new" });

    // 1. hours query
    // 2. profiles fetch
    // 3. rates fetch
    // 4. existing records fetch
    // 5. insert with .single() → await qb
    db.__qb.resolveOnce({ data: hoursData, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });
    db.__qb.resolveOnce({ data: ratesData, error: null });
    db.__qb.resolveOnce({ data: existingRecords, error: null });
    db.__qb.resolveOnce({ data: insertedRecord, error: null });

    const r = await calculateMonthlyPayroll(db as never, ORG_ID, YEAR, MONTH);

    expect(r).toHaveLength(1);
    expect(r[0].mechanic_id).toBe(MECHANIC_ID);
    expect(r[0].total_hours).toBe(160);
    expect(r[0].hourly_rate).toBe(15000);
    expect(r[0].gross_pay).toBe(2400000);
    expect(r[0].status).toBe("draft");
    expect(r[0].mechanic_name).toBe("Alice");
  });

  it("returns empty when no hours data for the period", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const r = await calculateMonthlyPayroll(db as never, ORG_ID, YEAR, MONTH);

    expect(r).toEqual([]);
  });

  it("returns empty when branch has no mechanics", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const r = await calculateMonthlyPayroll(
      db as never,
      ORG_ID,
      YEAR,
      MONTH,
      BRANCH_ID,
    );

    expect(r).toEqual([]);
  });

  it("upserts existing payroll records instead of inserting new", async () => {
    const hoursData = [makeHoursRow(MECHANIC_ID, 160)];
    const profiles = [{ id: MECHANIC_ID, full_name: "Alice" }];
    const ratesData = [
      {
        mechanic_id: MECHANIC_ID,
        hourly_rate: 15000,
        effective_from: "2026-01-01",
      },
    ];
    const existingRecords = [
      {
        id: "pr-existing",
        mechanic_id: MECHANIC_ID,
        status: "draft",
        paid_at: null,
      },
    ];
    const updatedRecord = makePayrollRecord({
      id: "pr-existing",
      total_hours: 160,
    });

    // 1. hours query
    // 2. profiles fetch
    // 3. rates fetch
    // 4. existing records fetch
    // 5. update with .select().single() — await qb
    db.__qb.resolveOnce({ data: hoursData, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });
    db.__qb.resolveOnce({ data: ratesData, error: null });
    db.__qb.resolveOnce({ data: existingRecords, error: null });
    db.__qb.resolveOnce({ data: updatedRecord, error: null });

    const r = await calculateMonthlyPayroll(db as never, ORG_ID, YEAR, MONTH);

    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("pr-existing");
    expect(r[0].total_hours).toBe(160);
    expect(r[0].hourly_rate).toBe(15000);
    expect(r[0].gross_pay).toBe(2400000);
  });

  it("handles multiple mechanics", async () => {
    const hoursData = [makeHoursRow("mech-1", 160), makeHoursRow("mech-2", 80)];
    const profiles = [
      { id: "mech-1", full_name: "Alice" },
      { id: "mech-2", full_name: "Bob" },
    ];
    const ratesData = [
      {
        mechanic_id: "mech-1",
        hourly_rate: 15000,
        effective_from: "2026-01-01",
      },
      {
        mechanic_id: "mech-2",
        hourly_rate: 12000,
        effective_from: "2026-01-01",
      },
    ];
    const existingRecords: Array<Record<string, unknown>> = [];
    // Insert for mech-1
    const inserted1 = makePayrollRecord({
      id: "pr-1",
      mechanic_id: "mech-1",
      total_hours: 160,
      hourly_rate: 15000,
      gross_pay: 2400000,
    });
    // Insert for mech-2
    const inserted2 = makePayrollRecord({
      id: "pr-2",
      mechanic_id: "mech-2",
      total_hours: 80,
      hourly_rate: 12000,
      gross_pay: 960000,
    });

    db.__qb.resolveOnce({ data: hoursData, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });
    db.__qb.resolveOnce({ data: ratesData, error: null });
    db.__qb.resolveOnce({ data: existingRecords, error: null });
    db.__qb.resolveOnce({ data: inserted1, error: null });
    db.__qb.resolveOnce({ data: inserted2, error: null });

    const r = await calculateMonthlyPayroll(db as never, ORG_ID, YEAR, MONTH);

    expect(r).toHaveLength(2);
    expect(r[0].mechanic_id).toBe("mech-1");
    expect(r[0].gross_pay).toBe(2400000);
    expect(r[1].mechanic_id).toBe("mech-2");
    expect(r[1].gross_pay).toBe(960000);
  });

  it("uses rate of 0 when no pay rate found for mechanic", async () => {
    const hoursData = [makeHoursRow(MECHANIC_ID, 100)];
    const profiles = [{ id: MECHANIC_ID, full_name: "Alice" }];
    const ratesData: Array<Record<string, unknown>> = [];
    const existingRecords: Array<Record<string, unknown>> = [];
    const insertedRecord = makePayrollRecord({
      id: "pr-no-rate",
      mechanic_id: MECHANIC_ID,
      total_hours: 100,
      hourly_rate: 0,
      gross_pay: 0,
    });

    db.__qb.resolveOnce({ data: hoursData, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });
    db.__qb.resolveOnce({ data: ratesData, error: null });
    db.__qb.resolveOnce({ data: existingRecords, error: null });
    db.__qb.resolveOnce({ data: insertedRecord, error: null });

    const r = await calculateMonthlyPayroll(db as never, ORG_ID, YEAR, MONTH);

    expect(r).toHaveLength(1);
    expect(r[0].hourly_rate).toBe(0);
  });
  it("names mechanics as null when profile missing", async () => {
    const hoursData = [makeHoursRow(MECHANIC_ID, 80)];
    const profiles: Array<Record<string, unknown>> = [];
    const ratesData = [
      {
        mechanic_id: MECHANIC_ID,
        hourly_rate: 10000,
        effective_from: "2026-01-01",
      },
    ];
    const existingRecords: Array<Record<string, unknown>> = [];
    const insertedRecord = makePayrollRecord({
      id: "pr-unknown",
      mechanic_id: MECHANIC_ID,
      hourly_rate: 10000,
    });

    db.__qb.resolveOnce({ data: hoursData, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });
    db.__qb.resolveOnce({ data: ratesData, error: null });
    db.__qb.resolveOnce({ data: existingRecords, error: null });
    db.__qb.resolveOnce({ data: insertedRecord, error: null });

    const r = await calculateMonthlyPayroll(db as never, ORG_ID, YEAR, MONTH);

    expect(r).toHaveLength(1);
    expect(r[0].mechanic_name).toBeNull();
  });

  it("uses 'Unknown' when profile has null full_name", async () => {
    const hoursData = [makeHoursRow(MECHANIC_ID, 80)];
    const profiles = [{ id: MECHANIC_ID, full_name: null }];
    const ratesData = [
      {
        mechanic_id: MECHANIC_ID,
        hourly_rate: 10000,
        effective_from: "2026-01-01",
      },
    ];
    const existingRecords: Array<Record<string, unknown>> = [];
    const insertedRecord = makePayrollRecord({
      id: "pr-unknown",
      mechanic_id: MECHANIC_ID,
      hourly_rate: 10000,
    });

    db.__qb.resolveOnce({ data: hoursData, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });
    db.__qb.resolveOnce({ data: ratesData, error: null });
    db.__qb.resolveOnce({ data: existingRecords, error: null });
    db.__qb.resolveOnce({ data: insertedRecord, error: null });

    const r = await calculateMonthlyPayroll(db as never, ORG_ID, YEAR, MONTH);

    expect(r).toHaveLength(1);
    expect(r[0].mechanic_name).toBe("Unknown");
  });

  it("filters by branch and uses branch mechanic IDs", async () => {
    const branchMechanics = [{ id: MECHANIC_ID }];
    const hoursData = [makeHoursRow(MECHANIC_ID, 120)];
    const profiles = [{ id: MECHANIC_ID, full_name: "Alice" }];
    const ratesData = [
      {
        mechanic_id: MECHANIC_ID,
        hourly_rate: 14000,
        effective_from: "2026-01-01",
      },
    ];
    const existingRecords: Array<Record<string, unknown>> = [];
    const insertedRecord = makePayrollRecord({
      id: "pr-branch",
      mechanic_id: MECHANIC_ID,
      hourly_rate: 14000,
    });

    // 1. branch query
    // 2. hours query
    // 3. profiles
    // 4. rates
    // 5. existing records
    // 6. insert
    db.__qb.resolveOnce({ data: branchMechanics, error: null });
    db.__qb.resolveOnce({ data: hoursData, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });
    db.__qb.resolveOnce({ data: ratesData, error: null });
    db.__qb.resolveOnce({ data: existingRecords, error: null });
    db.__qb.resolveOnce({ data: insertedRecord, error: null });

    const r = await calculateMonthlyPayroll(
      db as never,
      ORG_ID,
      YEAR,
      MONTH,
      BRANCH_ID,
    );

    expect(r).toHaveLength(1);
    expect(r[0].mechanic_id).toBe(MECHANIC_ID);
  });

  it("calls revalidateTag after calculation", async () => {
    const hoursData = [makeHoursRow(MECHANIC_ID, 40)];
    const profiles = [{ id: MECHANIC_ID, full_name: "Alice" }];
    const ratesData = [
      {
        mechanic_id: MECHANIC_ID,
        hourly_rate: 10000,
        effective_from: "2026-01-01",
      },
    ];
    const existingRecords: Array<Record<string, unknown>> = [];
    const insertedRecord = makePayrollRecord({ id: "pr-cache" });

    db.__qb.resolveOnce({ data: hoursData, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });
    db.__qb.resolveOnce({ data: ratesData, error: null });
    db.__qb.resolveOnce({ data: existingRecords, error: null });
    db.__qb.resolveOnce({ data: insertedRecord, error: null });

    await calculateMonthlyPayroll(db as never, ORG_ID, YEAR, MONTH);

    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("uses latest rate when multiple rates overlap the period", async () => {
    const hoursData = [makeHoursRow(MECHANIC_ID, 100)];
    const profiles = [{ id: MECHANIC_ID, full_name: "Alice" }];
    const ratesData = [
      {
        mechanic_id: MECHANIC_ID,
        hourly_rate: 15000,
        effective_from: "2026-01-01",
      },
      {
        mechanic_id: MECHANIC_ID,
        hourly_rate: 18000,
        effective_from: "2026-01-15",
      },
    ];
    const existingRecords: Array<Record<string, unknown>> = [];
    const insertedRecord = makePayrollRecord({
      id: "pr-rate",
      mechanic_id: MECHANIC_ID,
      hourly_rate: 18000,
    });

    db.__qb.resolveOnce({ data: hoursData, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });
    db.__qb.resolveOnce({ data: ratesData, error: null });
    db.__qb.resolveOnce({ data: existingRecords, error: null });
    db.__qb.resolveOnce({ data: insertedRecord, error: null });

    const r = await calculateMonthlyPayroll(db as never, ORG_ID, YEAR, MONTH);

    expect(r[0].hourly_rate).toBe(18000);
  });
});

// ── getPayrollRecords ──────────────────────────────────────────────

describe("getPayrollRecords", () => {
  const YEAR = 2026;
  const MONTH = 1;

  it("returns payroll records for the period", async () => {
    const records = [
      makePayrollRecord({ id: "pr-1", mechanic_id: "mech-1" }),
      makePayrollRecord({
        id: "pr-2",
        mechanic_id: "mech-2",
        hourly_rate: 12000,
      }),
    ];
    const profiles = [
      { id: "mech-1", full_name: "Alice" },
      { id: "mech-2", full_name: "Bob" },
    ];

    db.__qb.resolveOnce({ data: records, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });

    const r = await getPayrollRecords(db as never, ORG_ID, YEAR, MONTH);

    expect(r).toHaveLength(2);
    expect(r[0].mechanic_name).toBe("Alice");
    expect(r[1].mechanic_name).toBe("Bob");
  });

  it("filters by branch when branchId provided", async () => {
    const branchMechanics = [{ id: "mech-1" }];
    const records = [makePayrollRecord({ id: "pr-1", mechanic_id: "mech-1" })];
    const profiles = [{ id: "mech-1", full_name: "Alice" }];

    db.__qb.resolveOnce({ data: branchMechanics, error: null });
    db.__qb.resolveOnce({ data: records, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });

    const r = await getPayrollRecords(
      db as never,
      ORG_ID,
      YEAR,
      MONTH,
      BRANCH_ID,
    );

    expect(r).toHaveLength(1);
    expect(r[0].mechanic_id).toBe("mech-1");
  });

  it("returns empty array when branch has no mechanics", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const r = await getPayrollRecords(
      db as never,
      ORG_ID,
      YEAR,
      MONTH,
      BRANCH_ID,
    );

    expect(r).toEqual([]);
  });

  it("handles null mechanic_name when profile missing", async () => {
    const records = [makePayrollRecord({ id: "pr-1", mechanic_id: "mech-1" })];
    db.__qb.resolveOnce({ data: records, error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const r = await getPayrollRecords(db as never, ORG_ID, YEAR, MONTH);

    expect(r).toHaveLength(1);
    expect(r[0].mechanic_name).toBeNull();
  });

  it("returns empty array when no records exist", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const r = await getPayrollRecords(db as never, ORG_ID, YEAR, MONTH);

    expect(r).toEqual([]);
  });
});

// ── updatePayrollRecordStatus ──────────────────────────────────────

describe("updatePayrollRecordStatus", () => {
  const RECORD_ID = "pr-1";

  it("updates status to approved", async () => {
    const updated = makePayrollRecord({ status: "approved" });
    db.__qb.resolveOnce({ data: updated, error: null });

    const r = await updatePayrollRecordStatus(
      db as never,
      ORG_ID,
      RECORD_ID,
      "approved",
    );

    expect(r.status).toBe("approved");
    expect(r.paid_at).toBeNull();
  });

  it("sets paid_at when status is paid", async () => {
    const now = new Date();
    const updated = makePayrollRecord({
      status: "paid",
      paid_at: now.toISOString(),
    });
    db.__qb.resolveOnce({ data: updated, error: null });

    const r = await updatePayrollRecordStatus(
      db as never,
      ORG_ID,
      RECORD_ID,
      "paid",
    );

    expect(r.status).toBe("paid");
    expect(r.paid_at).toBe(now.toISOString());
  });

  it("sends correct update payload for paid status", async () => {
    const updated = makePayrollRecord({
      status: "paid",
      paid_at: new Date().toISOString(),
    });
    db.__qb.resolveOnce({ data: updated, error: null });

    await updatePayrollRecordStatus(db as never, ORG_ID, RECORD_ID, "paid");

    const updateChain = db.from("payroll_records") as ReturnType<
      typeof db.from
    >;
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "paid",
        paid_at: expect.any(String),
      }),
    );
    expect(updateChain.eq).toHaveBeenCalledWith("id", RECORD_ID);
    expect(updateChain.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
  });

  it("sends correct update payload for non-paid status", async () => {
    const updated = makePayrollRecord({ status: "draft" });
    db.__qb.resolveOnce({ data: updated, error: null });

    await updatePayrollRecordStatus(db as never, ORG_ID, RECORD_ID, "draft");

    const updateChain = db.from("payroll_records") as ReturnType<
      typeof db.from
    >;
    expect(updateChain.update).toHaveBeenCalledWith({ status: "draft" });
  });

  it("throws on DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("Update failed") });

    await expect(
      updatePayrollRecordStatus(db as never, ORG_ID, RECORD_ID, "approved"),
    ).rejects.toThrow("Update failed");
  });

  it("calls revalidateTag after update", async () => {
    const updated = makePayrollRecord({ status: "approved" });
    db.__qb.resolveOnce({ data: updated, error: null });

    await updatePayrollRecordStatus(db as never, ORG_ID, RECORD_ID, "approved");

    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("selects after update and calls single", async () => {
    const updated = makePayrollRecord({ status: "approved" });
    db.__qb.resolveOnce({ data: updated, error: null });

    await updatePayrollRecordStatus(db as never, ORG_ID, RECORD_ID, "approved");

    const updateChain = db.from("payroll_records") as ReturnType<
      typeof db.from
    >;
    expect(updateChain.select).toHaveBeenCalled();
    expect(updateChain.single).toHaveBeenCalled();
  });
});
