import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

// ── Module-level mocks ────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    vehicles: (orgId: string) => `vehicles:${orgId}`,
  },
}));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn() } }));
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const { sendItpReminderEmailMock } = vi.hoisted(() => ({
  sendItpReminderEmailMock: vi.fn(),
}));
vi.mock("@/lib/services/email-service", () => ({
  sendItpReminderEmail: sendItpReminderEmailMock,
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { reportServerError } from "@/lib/sentry-report-server";
import { sendItpReminderEmail } from "@/lib/services/email-service";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const _mockLoggerWarn = vi.mocked(logger.warn);
const mockReportServerError = vi.mocked(reportServerError);
const mockSendItpReminderEmail = vi.mocked(sendItpReminderEmail);

import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  getExpiringItpRecords,
  getItpHistory,
  getItpRecord,
  getItpRecords,
  getItpStats,
  getVehiclesNeedingReminder,
  recordItpInspection,
  sendItpReminder,
  updateItpRecord,
} from "../itp-service";

const ORG_ID = "org-1";
const USER_ID = "user-1";
const VEHICLE_ID = "v-1";
const BRANCH_ID = "branch-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── Helpers ───────────────────────────────────────────────────────

const makeVehicleRow = (overrides: Record<string, unknown> = {}) => ({
  id: VEHICLE_ID,
  plate_number: "5555УНА",
  make: "Toyota",
  model: "Camry",
  year: 2020,
  itp_expiry_date: "2026-12-31",
  itp_last_passed_date: "2025-12-31",
  itp_notes: null,
  customer: {
    id: "c-1",
    first_name: "Бат",
    last_name: "Дорж",
    phone: "99111111",
  },
  ...overrides,
});

const makeHistoryRow = (overrides: Record<string, unknown> = {}) => ({
  id: "hist-1",
  organization_id: ORG_ID,
  vehicle_id: VEHICLE_ID,
  branch_id: null,
  user_id: USER_ID,
  previous_expiry_date: "2025-12-31",
  new_expiry_date: "2026-12-31",
  previous_status: "expiring_soon",
  new_status: "valid",
  notes: null,
  action_type: "record_inspection",
  created_at: "2026-07-01T00:00:00Z",
  ...overrides,
});

// ── getItpRecords ─────────────────────────────────────────────────

describe("getItpRecords", () => {
  it("returns all ITP records for org", async () => {
    const row = makeVehicleRow();
    db.__qb.resolveOnce({ data: [row], error: null, count: 1 });

    const result = await getItpRecords(db, ORG_ID);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].vehicle_id).toBe(VEHICLE_ID);
    expect(result.data[0].plate_number).toBe("5555УНА");
    expect(result.data[0].itp_status).toBe("valid");
    expect(result.data[0].customer_name).toBe("Бат Дорж");
  });

  it("filters by status (computed post-query)", async () => {
    const rows = [
      makeVehicleRow({ id: "v-1", itp_expiry_date: "2099-12-31" }),
      makeVehicleRow({ id: "v-2", itp_expiry_date: "2020-01-01" }),
      makeVehicleRow({ id: "v-3", itp_expiry_date: null }),
    ];
    db.__qb.resolveOnce({ data: rows, error: null, count: 3 });

    const result = await getItpRecords(db, ORG_ID, { status: "expired" });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].vehicle_id).toBe("v-2");
    expect(result.data[0].itp_status).toBe("expired");
  });

  it("filters by branch_id", async () => {
    const row = makeVehicleRow();
    db.__qb.resolveOnce({ data: [row], error: null, count: 1 });

    await getItpRecords(db, ORG_ID, { branchId: BRANCH_ID });

    expect(db.from("vehicles").eq).toHaveBeenCalledWith("branch_id", BRANCH_ID);
  });

  it("filters by vehicle id", async () => {
    const row = makeVehicleRow();
    db.__qb.resolveOnce({ data: [row], error: null, count: 1 });

    await getItpRecords(db, ORG_ID, { vehicleId: VEHICLE_ID });

    expect(db.from("vehicles").eq).toHaveBeenCalledWith("id", VEHICLE_ID);
  });

  it("filters by search via matching customer ids", async () => {
    // customers match
    db.__qb.resolveOnce({ data: [{ id: "cust-1" }], error: null });
    // vehicles (main query)
    db.__qb.resolveOnce({ data: [makeVehicleRow()], error: null, count: 1 });

    const result = await getItpRecords(db, ORG_ID, { search: "John" });

    expect(db.from).toHaveBeenCalledWith("customers");
    expect(db.from("vehicles").or).toHaveBeenCalledWith(
      "plate_number.ilike.%John%,customer_id.in.(cust-1)",
    );
    expect(result.data).toHaveLength(1);
  });

  it("searches by plate alone when no customer matches", async () => {
    // customers no match
    db.__qb.resolveOnce({ data: [], error: null });
    // vehicles (main query)
    db.__qb.resolveOnce({ data: [makeVehicleRow()], error: null, count: 1 });

    const result = await getItpRecords(db, ORG_ID, { search: "ABC" });

    expect(db.from("vehicles").or).toHaveBeenCalledWith(
      "plate_number.ilike.%ABC%",
    );
    expect(result.data).toHaveLength(1);
  });

  it("handles empty results", async () => {
    db.__qb.resolveOnce({ data: [], error: null, count: 0 });

    const result = await getItpRecords(db, ORG_ID);
    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("handles null expiry dates and computes unknown status", async () => {
    const row = makeVehicleRow({ itp_expiry_date: null });
    db.__qb.resolveOnce({ data: [row], error: null, count: 1 });

    const result = await getItpRecords(db, ORG_ID);
    expect(result.data[0].itp_status).toBe("unknown");
    expect(result.data[0].days_until_expiry).toBeNull();
  });

  it("handles db error", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("DB connection failed"),
    });

    await expect(getItpRecords(db, ORG_ID)).rejects.toThrow(
      "DB connection failed",
    );
    expect(mockReportServerError).toHaveBeenCalled();
  });
});

// ── getExpiringItpRecords ─────────────────────────────────────────

describe("getExpiringItpRecords", () => {
  it("returns vehicles expiring within 30 days", async () => {
    const today = new Date();
    const expiringDate = new Date(today);
    expiringDate.setDate(expiringDate.getDate() + 15);
    const expiringDateStr = expiringDate.toISOString().split("T")[0];

    const row = makeVehicleRow({ itp_expiry_date: expiringDateStr });
    db.__qb.resolveOnce({ data: [row], error: null });

    const result = await getExpiringItpRecords(db, ORG_ID);
    expect(result).toHaveLength(1);
    expect(result[0].itp_status).toBe("expiring_soon");
  });

  it("returns empty array when none expiring", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getExpiringItpRecords(db, ORG_ID);
    expect(result).toHaveLength(0);
  });
});

// ── getItpRecord ──────────────────────────────────────────────────

describe("getItpRecord", () => {
  it("returns a single vehicle ITP record", async () => {
    const row = makeVehicleRow();
    // getItpRecord chains .select().eq().eq().is().single() → await qb
    // .single() returns qb, and qb.then() dequeues from resolveOnceQueue
    db.__qb.resolveOnce({ data: row, error: null });

    const result = await getItpRecord(db, VEHICLE_ID, ORG_ID);
    expect(result.vehicle_id).toBe(VEHICLE_ID);
    expect(result.itp_status).toBe("valid");
  });

  it("throws NotFoundError for missing vehicle", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("not found") });

    await expect(getItpRecord(db, VEHICLE_ID, ORG_ID)).rejects.toThrow(
      NotFoundError,
    );
  });
});

// ── recordItpInspection ───────────────────────────────────────────

describe("recordItpInspection", () => {
  const validParams = {
    vehicle_id: VEHICLE_ID,
    itp_expiry_date: "2027-06-15",
    itp_last_passed_date: "2026-06-15",
    itp_notes: "Passed all checks",
  };

  it("records an inspection successfully", async () => {
    // 1) getItpRecord (return call) + recordItpInspection body
    //    recordItpInspection does .select().eq().eq().single() to get prev state
    //    .single() returns qb, then await qb dequeues from resolveOnceQueue
    db.__qb.resolveOnce({
      data: {
        itp_expiry_date: "2026-12-31",
        itp_last_passed_date: "2025-12-31",
        itp_notes: null,
      },
      error: null,
    });

    // 2) Update: .update().eq().eq() — no terminal method, await chain
    db.__qb.resolveOnce({ data: null, error: null });

    // 3) History insert: no terminal method
    db.__qb.resolveOnce({ data: null, error: null });

    // 4) getItpRecord (inner return): .select().eq().eq().is().single()
    db.__qb.resolveOnce({
      data: makeVehicleRow({
        itp_expiry_date: "2027-06-15",
        itp_last_passed_date: "2026-06-15",
        itp_notes: "Passed all checks",
      }),
      error: null,
    });

    const result = await recordItpInspection(db, ORG_ID, USER_ID, validParams);

    expect(result.itp_status).toBe("valid");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(`vehicles:${ORG_ID}`, "max");
  });

  it("throws ValidationError when vehicle_id is empty", async () => {
    await expect(
      recordItpInspection(db, ORG_ID, USER_ID, {
        ...validParams,
        vehicle_id: "",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when expiry date is invalid", async () => {
    await expect(
      recordItpInspection(db, ORG_ID, USER_ID, {
        ...validParams,
        itp_expiry_date: "not-a-date",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when passed date is invalid", async () => {
    await expect(
      recordItpInspection(db, ORG_ID, USER_ID, {
        ...validParams,
        itp_last_passed_date: "not-a-date",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when expiry is before passed date", async () => {
    await expect(
      recordItpInspection(db, ORG_ID, USER_ID, {
        ...validParams,
        itp_expiry_date: "2025-01-01",
        itp_last_passed_date: "2026-01-01",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("handles update db error", async () => {
    db.__qb.resolveOnce({
      data: {
        itp_expiry_date: "2026-12-31",
        itp_last_passed_date: "2025-12-31",
        itp_notes: null,
      },
      error: null,
    });

    db.__qb.resolveOnce({ data: null, error: new Error("Update failed") });

    await expect(
      recordItpInspection(db, ORG_ID, USER_ID, validParams),
    ).rejects.toThrow("Update failed");
    expect(mockReportServerError).toHaveBeenCalled();
  });
});

// ── updateItpRecord ───────────────────────────────────────────────

describe("updateItpRecord", () => {
  it("updates ITP fields successfully", async () => {
    // 1) .select().eq().eq().single().then((r) => r.data) — old data
    db.__qb.resolveOnce({
      data: {
        itp_expiry_date: "2026-12-31",
        itp_last_passed_date: "2025-12-31",
        itp_notes: null,
        itp_reminder_sent_at: null,
      },
      error: null,
    });

    // 2) .update().eq().eq() — await chain (no terminal method)
    db.__qb.resolveOnce({ data: null, error: null });

    // 3) getItpRecord (return) — .select().eq().eq().is().single()
    //    note: history insert only fires when itp_expiry_date is provided
    db.__qb.resolveOnce({
      data: makeVehicleRow({ itp_notes: "Updated notes" }),
      error: null,
    });

    const result = await updateItpRecord(db, VEHICLE_ID, ORG_ID, USER_ID, {
      itp_notes: "Updated notes",
    });

    expect(result.itp_notes).toBe("Updated notes");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(`vehicles:${ORG_ID}`, "max");
  });

  it("throws NotFoundError when vehicle does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      updateItpRecord(db, VEHICLE_ID, ORG_ID, USER_ID, {
        itp_notes: "test",
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ── sendItpReminder ───────────────────────────────────────────────

describe("sendItpReminder", () => {
  // Helper: queue the update + history inserts, then stub the vehicle/org
  // fetches used for email delivery (they use .maybeSingle(), which resolves
  // via mockResolvedValueOnce in call order: vehicle first, org second).
  const stubEmailLookups = ({
    customer,
    orgName = "Тест Орг",
  }: {
    customer: Record<string, unknown> | null;
    orgName?: string;
  }) => {
    vi.mocked(db.from("vehicles").maybeSingle).mockResolvedValueOnce({
      data: {
        plate_number: "5555УНА",
        make: "Toyota",
        model: "Camry",
        itp_expiry_date: "2026-12-31",
        customer,
      },
      error: null,
    });
    vi.mocked(db.from("vehicles").maybeSingle).mockResolvedValueOnce({
      data: { name: orgName },
      error: null,
    });
  };

  it("updates reminder_sent_at and creates history entry", async () => {
    // 1) .update().eq().eq()
    db.__qb.resolveOnce({ data: null, error: null });

    // 2) .insert()
    db.__qb.resolveOnce({ data: null, error: null });

    // No customer email → email lookup resolves to null customer
    stubEmailLookups({ customer: null });

    const result = await sendItpReminder(db, VEHICLE_ID, ORG_ID, USER_ID);

    expect(db.from("vehicles").update).toHaveBeenCalledWith(
      expect.objectContaining({
        itp_reminder_sent_at: expect.any(String),
      }),
    );
    expect(db.from("vehicle_itp_history").insert).toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(`vehicles:${ORG_ID}`, "max");
    expect(mockSendItpReminderEmail).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: true, emailDelivered: false });
  });

  it("sends email when customer has email", async () => {
    // 1) .update().eq().eq()
    db.__qb.resolveOnce({ data: null, error: null });

    // 2) .insert()
    db.__qb.resolveOnce({ data: null, error: null });

    mockSendItpReminderEmail.mockResolvedValue({ id: "msg-1" });
    stubEmailLookups({
      customer: {
        id: "c-1",
        first_name: "Бат",
        last_name: "Дорж",
        email: "bat@example.com",
      },
    });

    const result = await sendItpReminder(db, VEHICLE_ID, ORG_ID, USER_ID);

    expect(mockSendItpReminderEmail).toHaveBeenCalledTimes(1);
    expect(mockSendItpReminderEmail).toHaveBeenCalledWith({
      recipientEmail: "bat@example.com",
      orgName: "Тест Орг",
      vehicleLabel: "5555УНА Toyota Camry",
      itpExpiryDate: "2026-12-31",
      customerName: "Бат Дорж",
    });
    expect(result).toEqual({ sent: true, emailDelivered: true });
  });

  it("skips email when customer email missing but still stamps", async () => {
    // 1) .update().eq().eq()
    db.__qb.resolveOnce({ data: null, error: null });

    // 2) .insert()
    db.__qb.resolveOnce({ data: null, error: null });

    stubEmailLookups({
      customer: {
        id: "c-1",
        first_name: "Бат",
        last_name: "Дорж",
        email: null,
      },
    });

    const result = await sendItpReminder(db, VEHICLE_ID, ORG_ID, USER_ID);

    expect(db.from("vehicles").update).toHaveBeenCalledWith(
      expect.objectContaining({
        itp_reminder_sent_at: expect.any(String),
      }),
    );
    expect(db.from("vehicle_itp_history").insert).toHaveBeenCalled();
    expect(mockSendItpReminderEmail).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: true, emailDelivered: false });
  });

  it("stamps and writes history even when email send throws", async () => {
    // 1) .update().eq().eq()
    db.__qb.resolveOnce({ data: null, error: null });

    // 2) .insert()
    db.__qb.resolveOnce({ data: null, error: null });

    mockSendItpReminderEmail.mockRejectedValue(new Error("SMTP down"));
    stubEmailLookups({
      customer: {
        id: "c-1",
        first_name: "Бат",
        last_name: "Дорж",
        email: "bat@example.com",
      },
    });

    const result = await sendItpReminder(db, VEHICLE_ID, ORG_ID, USER_ID);

    expect(db.from("vehicles").update).toHaveBeenCalledWith(
      expect.objectContaining({
        itp_reminder_sent_at: expect.any(String),
      }),
    );
    expect(db.from("vehicle_itp_history").insert).toHaveBeenCalled();
    expect(mockSendItpReminderEmail).toHaveBeenCalledTimes(1);
    expect(mockReportServerError).toHaveBeenCalledWith(
      "sendItpReminderEmail",
      expect.any(Error),
    );
    expect(result).toEqual({ sent: true, emailDelivered: false });
  });

  it("handles db error on update", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("Update failed") });

    await expect(
      sendItpReminder(db, VEHICLE_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Update failed");
    expect(mockReportServerError).toHaveBeenCalled();
  });
});

// ── getItpStats ───────────────────────────────────────────────────

describe("getItpStats", () => {
  it("counts vehicles by ITP status", async () => {
    db.__qb.resolveOnce({
      data: [
        { itp_expiry_date: "2099-12-31" },
        { itp_expiry_date: "2099-12-31" },
        {
          itp_expiry_date: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 15);
            return d.toISOString().split("T")[0];
          })(),
        },
        { itp_expiry_date: "2020-01-01" },
        { itp_expiry_date: null },
      ],
      error: null,
    });

    const stats = await getItpStats(db, ORG_ID);

    expect(stats.total).toBe(5);
    expect(stats.valid).toBe(2);
    expect(stats.expiring_soon).toBe(1);
    expect(stats.expired).toBe(1);
    expect(stats.unknown).toBe(1);
  });

  it("filters by branch_id when provided", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    await getItpStats(db, ORG_ID, BRANCH_ID);
    expect(db.from("vehicles").eq).toHaveBeenCalledWith("branch_id", BRANCH_ID);
  });
});

// ── getItpHistory ─────────────────────────────────────────────────

describe("getItpHistory", () => {
  it("returns history ordered by created_at desc", async () => {
    const rows = [makeHistoryRow()];
    db.__qb.resolveOnce({ data: rows, error: null });

    const result = await getItpHistory(db, VEHICLE_ID, ORG_ID);
    expect(result).toHaveLength(1);
    expect(result[0].action_type).toBe("record_inspection");
  });

  it("returns empty array when no history", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getItpHistory(db, VEHICLE_ID, ORG_ID);
    expect(result).toHaveLength(0);
  });
});

// ── getVehiclesNeedingReminder ────────────────────────────────────

describe("getVehiclesNeedingReminder", () => {
  it("returns vehicles that need reminder", async () => {
    const today = new Date();
    const expiringDate = new Date(today);
    expiringDate.setDate(expiringDate.getDate() + 15);
    const expiringDateStr = expiringDate.toISOString().split("T")[0];

    const row = makeVehicleRow({
      id: "v-needs-reminder",
      itp_expiry_date: expiringDateStr,
      itp_reminder_sent_at: null,
    });
    db.__qb.resolveOnce({ data: [row], error: null });

    const result = await getVehiclesNeedingReminder(db, ORG_ID);
    expect(result).toHaveLength(1);
  });

  it("excludes vehicles that already had a reminder sent", async () => {
    const today = new Date();
    const expiringDate = new Date(today);
    expiringDate.setDate(expiringDate.getDate() + 15);
    const expiringDateStr = expiringDate.toISOString().split("T")[0];

    const row = makeVehicleRow({
      id: "v-reminded",
      itp_expiry_date: expiringDateStr,
      itp_reminder_sent_at: "2026-07-01T00:00:00Z",
      itp_last_passed_date: "2025-12-31",
    });
    db.__qb.resolveOnce({ data: [row], error: null });

    const result = await getVehiclesNeedingReminder(db, ORG_ID);
    expect(result).toHaveLength(0);
  });

  it("returns vehicles where reminder was sent before last passed date", async () => {
    const today = new Date();
    const expiringDate = new Date(today);
    expiringDate.setDate(expiringDate.getDate() + 15);
    const expiringDateStr = expiringDate.toISOString().split("T")[0];

    const row = makeVehicleRow({
      id: "v-reinspect",
      itp_expiry_date: expiringDateStr,
      itp_reminder_sent_at: "2025-01-01T00:00:00Z",
      itp_last_passed_date: "2026-06-15",
    });
    db.__qb.resolveOnce({ data: [row], error: null });

    const result = await getVehiclesNeedingReminder(db, ORG_ID);
    expect(result).toHaveLength(1);
  });
});
