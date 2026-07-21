import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, type MockSupabaseClient } from "@/test/mocks/supabase";

// ── Module-level mocks ────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    serviceSchedules: (orgId: string) => `service-schedules:${orgId}`,
    serviceSchedule: (id: string) => `service-schedule:${id}`,
    reminderLogs: (orgId: string) => `reminder-logs:${orgId}`,
  },
}));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn() } }));
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: vi.fn().mockResolvedValue("branch-1"),
  withBranchFilter: vi.fn((q: unknown) => q),
}));
vi.mock("@/lib/services/email-service", () => ({
  sendReminderEmail: vi.fn().mockResolvedValue({ id: "email-1" }),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { reportServerError } from "@/lib/sentry-report-server";
import { withBranchFilter } from "@/lib/supabase/with-branch";
import { sendReminderEmail } from "@/lib/services/email-service";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockLoggerWarn = vi.mocked(logger.warn);
const mockReportServerError = vi.mocked(reportServerError);
const mockWithBranchFilter = vi.mocked(withBranchFilter);
const mockSendReminderEmail = vi.mocked(sendReminderEmail);

// ── Imports under test ────────────────────────────────────────────

import {
  getServiceSchedules,
  getServiceSchedule,
  createServiceSchedule,
  updateServiceSchedule,
  deleteServiceSchedule,
  syncWorkOrderToSchedules,
  backfillSchedulesFromHistory,
  getReminderLogs,
  sendPendingReminders,
  createReminderLog,
} from "../service-reminder-service";

const ORG_ID = "org-1";
const SCHEDULE_ID = "sched-1";
const USER_ID = "user-1";
const VEHICLE_ID = "v-1";
const BRANCH_ID = "branch-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  mockWithBranchFilter.mockImplementation((q: unknown) => q);
  db = createMockSupabaseClient();
});

// ── Helpers ───────────────────────────────────────────────────────

const makeSchedule = (overrides: Record<string, unknown> = {}) => ({
  id: SCHEDULE_ID,
  organization_id: ORG_ID,
  branch_id: null,
  vehicle_id: VEHICLE_ID,
  service_catalog_id: null,
  service_name: "Oil Change",
  interval_months: 6,
  interval_km: 5000,
  last_service_date: null,
  last_service_odometer: null,
  next_due_date: "2026-01-15",
  next_due_km: null,
  reminder_enabled: true,
  contact_status: "pending",
  contacted_at: null,
  notes: null,
  created_by: USER_ID,
  updated_by: USER_ID,
  created_at: "2025-07-01T00:00:00Z",
  updated_at: "2025-07-01T00:00:00Z",
  deleted_at: null,
  vehicle: {
    plate_number: "ABC-123",
    make: "Toyota",
    model: "Camry",
    year: 2020,
    customer_id: "c-1",
    customer: {
      id: "c-1",
      first_name: "John",
      last_name: "Doe",
      phone: "+97612345678",
    },
  },
  ...overrides,
});

const makeReminderLog = (overrides: Record<string, unknown> = {}) => ({
  id: "log-1",
  organization_id: ORG_ID,
  vehicle_service_schedule_id: SCHEDULE_ID,
  vehicle_id: VEHICLE_ID,
  customer_id: "c-1",
  service_catalog_id: null,
  service_name: "Oil Change",
  reminder_type: "service_due",
  channel: "email",
  status: "pending",
  scheduled_at: "2026-01-15T00:00:00Z",
  sent_at: null,
  error_message: null,
  created_at: "2026-01-10T00:00:00Z",
  vehicle: {
    plate_number: "ABC-123",
    make: "Toyota",
    model: "Camry",
  },
  customer: {
    first_name: "John",
    last_name: "Doe",
    phone: "+97612345678",
    email: "john@example.com",
  },
  ...overrides,
});

// ── getServiceSchedules ───────────────────────────────────────────

describe("getServiceSchedules", () => {
  it("returns schedules for an org", async () => {
    const rows = [
      makeSchedule(),
      makeSchedule({ id: "sched-2", service_name: "Tire Rotation" }),
    ];
    db.__qb.resolveWith({ data: rows, error: null });

    const result = await getServiceSchedules(db, ORG_ID);

    expect(result).toEqual(rows);
    expect(db.from).toHaveBeenCalledWith("vehicle_service_schedules");
    expect(result).toHaveLength(2);
  });

  it("filters by vehicleId when provided", async () => {
    db.__qb.resolveWith({ data: [makeSchedule()], error: null });

    await getServiceSchedules(db, ORG_ID, "v-2");

    expect(db.from("vehicle_service_schedules").eq).toHaveBeenCalledWith(
      "vehicle_id",
      "v-2",
    );
  });

  it("applies branch filter when branchId is provided", async () => {
    db.__qb.resolveWith({ data: [makeSchedule()], error: null });

    await getServiceSchedules(db, ORG_ID, undefined, BRANCH_ID);

    expect(mockWithBranchFilter).toHaveBeenCalled();
  });

  it("returns empty array on null data", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    const result = await getServiceSchedules(db, ORG_ID);

    expect(result).toEqual([]);
  });

  it("throws on database error", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "DB error" } });

    await expect(getServiceSchedules(db, ORG_ID)).rejects.toThrow("DB error");
  });
});

// ── getServiceSchedule ─────────────────────────────────────────────

describe("getServiceSchedule", () => {
  it("returns a single schedule by id", async () => {
    const row = makeSchedule();
    db.__qb.resolveWith({ data: row, error: null });

    const result = await getServiceSchedule(db, SCHEDULE_ID);

    expect(result).toEqual(row);
    expect(db.from).toHaveBeenCalledWith("vehicle_service_schedules");
  });

  it("throws NotFoundError when schedule not found", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    await expect(getServiceSchedule(db, SCHEDULE_ID)).rejects.toThrow(
      "Service schedule not found",
    );
  });

  it("throws NotFoundError on database error", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "Not found" } });

    await expect(getServiceSchedule(db, SCHEDULE_ID)).rejects.toThrow(
      "Service schedule not found",
    );
  });
});

// ── createServiceSchedule ──────────────────────────────────────────

describe("createServiceSchedule", () => {
  const params = {
    vehicle_id: VEHICLE_ID,
    service_name: "  Oil Change  ",
    interval_months: 6,
    interval_km: 5000,
    last_service_date: "2025-07-15",
    notes: "  Use synthetic oil  ",
  };

  it("creates a schedule and returns it", async () => {
    const row = makeSchedule();
    db.__qb.resolveWith({ data: row, error: null });

    const result = await createServiceSchedule(db, ORG_ID, USER_ID, params);

    expect(result).toEqual(row);
    expect(db.from).toHaveBeenCalledWith("vehicle_service_schedules");

    // Verify the insert payload was trimmed (service_name, notes)
    const insertCall = (
      db.from("vehicle_service_schedules").insert as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    expect(insertCall.service_name).toBe("Oil Change");
    expect(insertCall.notes).toBe("Use synthetic oil");
    expect(insertCall.organization_id).toBe(ORG_ID);
    expect(insertCall.created_by).toBe(USER_ID);
    expect(insertCall.updated_by).toBe(USER_ID);

    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `service-schedules:${ORG_ID}`,
      "max",
    );
  });

  it("throws ValidationError when service_name is empty", async () => {
    await expect(
      createServiceSchedule(db, ORG_ID, USER_ID, {
        ...params,
        service_name: "  ",
      }),
    ).rejects.toThrow("Service name is required");
  });

  it("throws ValidationError when no interval is set", async () => {
    await expect(
      createServiceSchedule(db, ORG_ID, USER_ID, {
        ...params,
        interval_months: undefined,
        interval_km: undefined,
      }),
    ).rejects.toThrow(
      "At least one interval type (months or km) must be set",
    );
  });

  it("throws on database error", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "Insert failed" } });

    await expect(
      createServiceSchedule(db, ORG_ID, USER_ID, params),
    ).rejects.toThrow("Insert failed");
  });
});

// ── updateServiceSchedule ──────────────────────────────────────────

describe("updateServiceSchedule", () => {
  const params = {
    service_name: "  Premium Oil Change  ",
    interval_months: 12,
    notes: "  Updated notes  ",
  };

  it("updates a schedule and returns it", async () => {
    const row = makeSchedule({ service_name: "Premium Oil Change" });
    db.__qb.resolveWith({ data: row, error: null });

    const result = await updateServiceSchedule(
      db,
      SCHEDULE_ID,
      ORG_ID,
      USER_ID,
      params,
    );

    expect(result).toEqual(row);
    expect(db.from).toHaveBeenCalledWith("vehicle_service_schedules");

    // Verify buildUpdates + audit + revalidate
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        table_name: "vehicle_service_schedules",
        record_id: row.id,
        user_id: USER_ID,
        organization_id: ORG_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `service-schedules:${ORG_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `service-schedule:${SCHEDULE_ID}`,
      "max",
    );
  });

  it("throws NotFoundError when schedule not found", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    await expect(
      updateServiceSchedule(db, SCHEDULE_ID, ORG_ID, USER_ID, params),
    ).rejects.toThrow("Service schedule not found");
  });

  it("throws on database error", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "Update failed" } });

    await expect(
      updateServiceSchedule(db, SCHEDULE_ID, ORG_ID, USER_ID, params),
    ).rejects.toThrow("Service schedule not found");
  });
});

// ── deleteServiceSchedule ──────────────────────────────────────────

describe("deleteServiceSchedule", () => {
  it("soft-deletes a schedule with audit log", async () => {
    // First await: select existing
    db.__qb.resolveOnce({ data: { id: SCHEDULE_ID }, error: null });
    // Second await: update deleted_at
    db.__qb.resolveOnce({ data: null, error: null });

    await deleteServiceSchedule(db, SCHEDULE_ID, ORG_ID);

    expect(db.from).toHaveBeenCalledWith("vehicle_service_schedules");

    // Verify update sets deleted_at
    const updateCall = (
      db.from("vehicle_service_schedules").update as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    expect(updateCall).toHaveProperty("deleted_at");
    expect(typeof updateCall.deleted_at).toBe("string");

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "soft_delete",
        table_name: "vehicle_service_schedules",
        record_id: SCHEDULE_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `service-schedules:${ORG_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `service-schedule:${SCHEDULE_ID}`,
      "max",
    );
  });

  it("throws NotFoundError when update fails", async () => {
    db.__qb.resolveOnce({ data: { id: SCHEDULE_ID }, error: null });
    db.__qb.resolveWith({ data: null, error: { message: "DB error" } });

    await expect(
      deleteServiceSchedule(db, SCHEDULE_ID, ORG_ID),
    ).rejects.toThrow("Service schedule not found");
  });

  it("does not call logAudit when existing is already null", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveWith({ data: null, error: null });

    await deleteServiceSchedule(db, SCHEDULE_ID, ORG_ID);

    expect(mockLogAudit).not.toHaveBeenCalled();
  });
});

// ── syncWorkOrderToSchedules ──────────────────────────────────────

describe("syncWorkOrderToSchedules", () => {
  const WORK_ORDER_ID = "wo-1";

  const woRow = {
    id: WORK_ORDER_ID,
    organization_id: ORG_ID,
    vehicle_id: VEHICLE_ID,
    completed_at: "2026-01-10T00:00:00Z",
  };

  const serviceRow = {
    service_catalog_id: "cat-1",
    service_name: "Oil Change",
    service_catalog: [
      {
        interval_months: 6,
        interval_km: 5000,
      },
    ],
  };

  it("creates new schedules from completed work order services", async () => {
    // work_orders query
    db.__qb.resolveOnce({ data: woRow, error: null });
    // work_order_services query
    db.__qb.resolveOnce({ data: [serviceRow], error: null });
    // existing schedule check -> not found
    db.__qb.resolveOnce({ data: null, error: null });
    // insert resolves
    db.__qb.resolveWith({ data: null, error: null });

    const result = await syncWorkOrderToSchedules(db, WORK_ORDER_ID);

    expect(result).toBe(1);

    // Verify insert
    const insertCall = (
      db.from("vehicle_service_schedules").insert as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    expect(insertCall.organization_id).toBe(ORG_ID);
    expect(insertCall.vehicle_id).toBe(VEHICLE_ID);
    expect(insertCall.service_name).toBe("Oil Change");
    expect(insertCall.interval_months).toBe(6);
    expect(insertCall.interval_km).toBe(5000);
    expect(insertCall.reminder_enabled).toBe(true);
    expect(insertCall.last_service_date).toBe(woRow.completed_at);
    // next_due_date should be computed (completed_at + 6 months = 2026-07-10)
    expect(insertCall.next_due_date).toBe("2026-07-10");

    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `service-schedules:${ORG_ID}`,
      "max",
    );
  });

  it("updates existing schedules instead of creating duplicates", async () => {
    db.__qb.resolveOnce({ data: woRow, error: null });
    db.__qb.resolveOnce({ data: [serviceRow], error: null });
    // maybeSingle returns a pre-resolved promise (not via qb.then), so override it
    (db.from("vehicle_service_schedules").maybeSingle as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: "existing-1" },
      error: null,
    });
    db.__qb.resolveWith({ data: null, error: null });

    const result = await syncWorkOrderToSchedules(db, WORK_ORDER_ID);

    expect(result).toBe(1);
    // Should have called update, not insert
    const updateCall = (
      db.from("vehicle_service_schedules").update as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    expect(updateCall.last_service_date).toBe(woRow.completed_at);
    expect(updateCall).toHaveProperty("next_due_date");

    // Insert should NOT have been called for this service (update path)
    expect(db.from("vehicle_service_schedules").insert).not.toHaveBeenCalled();
  });

  it("returns 0 when work order has no vehicle", async () => {
    db.__qb.resolveOnce({
      data: { ...woRow, vehicle_id: null },
      error: null,
    });

    const result = await syncWorkOrderToSchedules(db, WORK_ORDER_ID);

    expect(result).toBe(0);
  });

  it("returns 0 when work order is not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await syncWorkOrderToSchedules(db, WORK_ORDER_ID);

    expect(result).toBe(0);
  });

  it("returns 0 when work order has no services", async () => {
    db.__qb.resolveOnce({ data: woRow, error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await syncWorkOrderToSchedules(db, WORK_ORDER_ID);

    expect(result).toBe(0);
  });
});

// ── backfillSchedulesFromHistory ──────────────────────────────────

describe("backfillSchedulesFromHistory", () => {
  it("syncs all completed work orders and returns total count", async () => {
    // Fetch completed work orders
    db.__qb.resolveOnce({ data: [{ id: "wo-1" }, { id: "wo-2" }], error: null });
    // wo-1: work_orders query (first sync function starts)
    db.__qb.resolveOnce({
      data: {
        id: "wo-1",
        organization_id: ORG_ID,
        vehicle_id: VEHICLE_ID,
        completed_at: "2026-01-10T00:00:00Z",
      },
      error: null,
    });
    // wo-2: work_orders query (second sync function starts before first hits next await)
    db.__qb.resolveOnce({
      data: {
        id: "wo-2",
        organization_id: ORG_ID,
        vehicle_id: VEHICLE_ID,
        completed_at: "2026-01-11T00:00:00Z",
      },
      error: null,
    });
    // wo-1: work_order_services query (empty -> returns 0)
    db.__qb.resolveOnce({ data: [], error: null });
    // wo-2: work_order_services query (empty -> returns 0)
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await backfillSchedulesFromHistory(db, ORG_ID);

    expect(result).toBe(0);
    expect(db.from).toHaveBeenCalledWith("work_orders");
  });
  it("returns 0 when no completed work orders exist", async () => {
    db.__qb.resolveWith({ data: [], error: null });

    const result = await backfillSchedulesFromHistory(db, ORG_ID);

    expect(result).toBe(0);
  });

  it("returns 0 on query error", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "DB error" } });

    const result = await backfillSchedulesFromHistory(db, ORG_ID);

    expect(result).toBe(0);
  });
});

// ── getReminderLogs ───────────────────────────────────────────────

describe("getReminderLogs", () => {
  it("returns reminder logs for an org", async () => {
    const logs = [
      makeReminderLog(),
      makeReminderLog({ id: "log-2", service_name: "Tire Rotation" }),
    ];
    db.__qb.resolveWith({ data: logs, error: null });

    const result = await getReminderLogs(db, ORG_ID);

    expect(result).toHaveLength(2);
    expect(result).toEqual(logs);
    expect(db.from).toHaveBeenCalledWith("reminder_logs");
  });

  it("filters by vehicleId when provided", async () => {
    db.__qb.resolveWith({ data: [makeReminderLog()], error: null });

    await getReminderLogs(db, ORG_ID, "v-2");

    expect(db.from("reminder_logs").eq).toHaveBeenCalledWith(
      "vehicle_id",
      "v-2",
    );
  });

  it("filters by branchId by querying vehicle branch_ids", async () => {
    // Branch vehicle query
    db.__qb.resolveOnce({ data: [{ id: VEHICLE_ID }], error: null });
    // Main reminder_logs query
    db.__qb.resolveWith({ data: [makeReminderLog()], error: null });

    const result = await getReminderLogs(db, ORG_ID, undefined, BRANCH_ID);

    expect(db.from).toHaveBeenCalledWith("vehicles");
    expect(result).toHaveLength(1);
  });

  it("returns empty array when branch has no vehicles", async () => {
    db.__qb.resolveWith({ data: [], error: null });

    const result = await getReminderLogs(db, ORG_ID, undefined, BRANCH_ID);

    expect(result).toEqual([]);
  });

  it("returns empty array on null data", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    const result = await getReminderLogs(db, ORG_ID);

    expect(result).toEqual([]);
  });

  it("throws on database error", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "DB error" } });

    await expect(getReminderLogs(db, ORG_ID)).rejects.toThrow("DB error");
  });
});

// ── sendPendingReminders ──────────────────────────────────────────

describe("sendPendingReminders", () => {
  it("sends pending email reminders and updates status to sent", async () => {
    const log = makeReminderLog();
    // Fetch pending logs
    db.__qb.resolveOnce({ data: [log], error: null });
    // Org name query (from Promise.all with import)
    db.__qb.resolveOnce({ data: { name: "Test Garage" }, error: null });
    // Update status after sending
    db.__qb.resolveWith({ data: null, error: null });

    const result = await sendPendingReminders(db, ORG_ID);

    expect(result).toBe(1);
    expect(mockSendReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "john@example.com",
        customerName: "John Doe",
        vehicleLabel: "Toyota Camry (ABC-123)",
        serviceName: "Oil Change",
        orgName: "Test Garage",
        dueDate: expect.any(String),
      }),
    );

    // Verify status update to "sent"
    const updateCall = (
      db.from("reminder_logs").update as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    expect(updateCall.status).toBe("sent");
    expect(updateCall).toHaveProperty("sent_at");

    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `reminder-logs:${ORG_ID}`,
      "max",
    );
  });

  it("returns 0 when no pending logs", async () => {
    db.__qb.resolveWith({ data: [], error: null });

    const result = await sendPendingReminders(db, ORG_ID);

    expect(result).toBe(0);
    expect(mockSendReminderEmail).not.toHaveBeenCalled();
  });

  it("logs a warning and skips logs without recipient email", async () => {
    const log = makeReminderLog({
      customer: {
        first_name: "John",
        last_name: "Doe",
        phone: "+97612345678",
        email: null,
      },
    });
    db.__qb.resolveOnce({ data: [log], error: null });
    db.__qb.resolveWith({ data: { name: "Test Garage" }, error: null });

    const result = await sendPendingReminders(db, ORG_ID);

    expect(result).toBe(0);
    expect(mockLoggerWarn).toHaveBeenCalled();
    expect(mockSendReminderEmail).not.toHaveBeenCalled();
  });

  it("handles email sending errors gracefully", async () => {
    mockSendReminderEmail.mockRejectedValueOnce(new Error("SMTP error"));

    const log = makeReminderLog();
    db.__qb.resolveOnce({ data: [log], error: null });
    db.__qb.resolveWith({ data: { name: "Test Garage" }, error: null });

    const result = await sendPendingReminders(db, ORG_ID);

    expect(result).toBe(0);
    expect(mockReportServerError).toHaveBeenCalled();
  });

  it("returns 0 on query error", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "DB error" } });

    const result = await sendPendingReminders(db, ORG_ID);

    expect(result).toBe(0);
  });
});

// ── createReminderLog ─────────────────────────────────────────────

describe("createReminderLog", () => {
  const params = {
    vehicle_service_schedule_id: SCHEDULE_ID,
    vehicle_id: VEHICLE_ID,
    customer_id: "c-1",
    service_name: "Oil Change",
    reminder_type: "service_due" as const,
    channel: "email" as const,
    scheduled_at: "2026-01-15T00:00:00Z",
  };

  it("creates a reminder log and returns it", async () => {
    const row = makeReminderLog();
    db.__qb.resolveWith({ data: row, error: null });

    const result = await createReminderLog(db, ORG_ID, params);

    expect(result).toEqual(row);
    expect(db.from).toHaveBeenCalledWith("reminder_logs");

    const insertCall = (
      db.from("reminder_logs").insert as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    expect(insertCall.organization_id).toBe(ORG_ID);
    expect(insertCall.vehicle_service_schedule_id).toBe(SCHEDULE_ID);
    expect(insertCall.vehicle_id).toBe(VEHICLE_ID);
    expect(insertCall.service_name).toBe("Oil Change");
    expect(insertCall.reminder_type).toBe("service_due");
    expect(insertCall.channel).toBe("email");
    expect(insertCall.status).toBe("pending");

    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `reminder-logs:${ORG_ID}`,
      "max",
    );
  });

  it("uses defaults for optional fields", async () => {
    const minimalParams = {
      vehicle_id: VEHICLE_ID,
      service_name: "Oil Change",
    };
    db.__qb.resolveWith({
      data: makeReminderLog({
        reminder_type: "service_due",
        channel: "in_app",
        status: "pending",
      }),
      error: null,
    });

    await createReminderLog(db, ORG_ID, minimalParams);

    const insertCall = (
      db.from("reminder_logs").insert as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    expect(insertCall.reminder_type).toBe("service_due");
    expect(insertCall.channel).toBe("in_app");
    expect(insertCall.status).toBe("pending");
    expect(insertCall.vehicle_service_schedule_id).toBeNull();
    expect(insertCall.customer_id).toBeNull();
    expect(insertCall.service_catalog_id).toBeNull();
    expect(insertCall.error_message).toBeNull();
    expect(insertCall.scheduled_at).toBeTruthy();
  });

  it("throws on database error", async () => {
    db.__qb.resolveWith({
      data: null,
      error: { message: "Insert failed" },
    });

    await expect(createReminderLog(db, ORG_ID, params)).rejects.toThrow("Insert failed");
  });
});
