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
  UnauthorizedError: class extends Error {
    constructor(m?: string) {
      super(m ?? "Unauthorized");
      this.name = "UnauthorizedError";
    }
  },
  ValidationError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "ValidationError";
    }
  },
}));
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: vi.fn().mockResolvedValue("branch-1"),
  withBranchFilter: vi.fn((q: unknown) => q),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { capture } from "@/lib/capture";
import { resolveBranchId } from "@/lib/supabase/with-branch";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockCapture = vi.mocked(capture);
const mockResolveBranchId = vi.mocked(resolveBranchId);

import { UnauthorizedError, ValidationError } from "@/lib/errors";
import type { AppointmentStatus, CreateAppointmentParams } from "@/lib/types";
import type { MockSupabaseClient } from "@/test/mocks/supabase";
import {
  createAppointment,
  deleteAppointment,
  getAppointment,
  getAppointments,
  updateAppointment,
  updateAppointmentStatus,
} from "../appointment-service";

const ORG_ID = "org-1";
const USER_ID = "user-1";
const APPOINTMENT_ID = "apt-1";
const CUSTOMER_ID = "cust-1";
const VEHICLE_ID = "veh-1";
const MECHANIC_ID = "mech-1";

function makeAppointmentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: APPOINTMENT_ID,
    organization_id: ORG_ID,
    customer_id: CUSTOMER_ID,
    vehicle_id: VEHICLE_ID,
    title: "Oil Change",
    description: "Regular maintenance oil change",
    scheduled_at: "2025-06-15T10:00:00Z",
    end_at: null,
    status: "scheduled",
    mechanic_id: MECHANIC_ID,
    notes: null,
    branch_id: "branch-1",
    source_estimate_id: null,
    created_by: USER_ID,
    updated_by: USER_ID,
    created_at: "2025-06-10T08:00:00Z",
    updated_at: "2025-06-10T08:00:00Z",
    deleted_at: null,
    customer: {
      first_name: "John",
      last_name: "Doe",
      phone: "99112233",
    },
    vehicle: {
      plate_number: "0001УБА",
      make: "Toyota",
      model: "Camry",
      color: "White",
    },
    estimate: null,
    mechanic_profile: { id: MECHANIC_ID, full_name: "Mech One" },
    ...overrides,
  } as Record<string, unknown>;
}

const validCreateParams: CreateAppointmentParams = {
  customer_id: CUSTOMER_ID,
  vehicle_id: VEHICLE_ID,
  title: "Oil Change",
  scheduled_at: "2025-06-15T10:00:00Z",
};

let db: MockSupabaseClient;

beforeEach(() => {
  vi.resetAllMocks();
  mockResolveBranchId.mockResolvedValue("branch-1");
  db = createMockSupabaseClient();
  db.rpc.mockResolvedValue({ data: ORG_ID, error: null });
  db.auth.getUser.mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  });
});

// ── getAppointments ────────────────────────────────────────────────

describe("getAppointments", () => {
  it("returns list of appointment details with mechanic mapping", async () => {
    db.__qb.resolveWith({ data: [makeAppointmentRow()], error: null });

    const result = await getAppointments(db as never);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(APPOINTMENT_ID);
    expect(result[0].title).toBe("Oil Change");
    expect(result[0].mechanic).toEqual({
      id: MECHANIC_ID,
      full_name: "Mech One",
    });
    expect(result[0].customer).toEqual(
      expect.objectContaining({ first_name: "John" }),
    );
    expect(result[0].vehicle).toEqual(
      expect.objectContaining({ plate_number: "0001УБА" }),
    );
  });

  it("returns empty array when no appointments exist", async () => {
    db.__qb.resolveWith({ data: [], error: null });

    const result = await getAppointments(db as never);

    expect(result).toEqual([]);
  });

  it("filters by status", async () => {
    db.__qb.resolveWith({ data: [makeAppointmentRow()], error: null });

    await getAppointments(db as never, { status: "scheduled" });

    const qb = db.from("appointments") as never as Record<
      string,
      ReturnType<typeof vi.fn>
    >;
    expect(qb.eq).toHaveBeenCalledWith("status", "scheduled");
  });

  it("filters by mechanic_id", async () => {
    db.__qb.resolveWith({ data: [makeAppointmentRow()], error: null });

    await getAppointments(db as never, { mechanic_id: MECHANIC_ID });

    const qb = db.from("appointments") as never as Record<
      string,
      ReturnType<typeof vi.fn>
    >;
    expect(qb.eq).toHaveBeenCalledWith("mechanic_id", MECHANIC_ID);
  });

  it("filters by date", async () => {
    db.__qb.resolveWith({ data: [makeAppointmentRow()], error: null });

    await getAppointments(db as never, { date: "2025-06-15" });

    const qb = db.from("appointments") as never as Record<
      string,
      ReturnType<typeof vi.fn>
    >;
    expect(qb.gte).toHaveBeenCalledWith(
      "scheduled_at",
      expect.stringMatching(/2025-06-1[45]T/),
    );
    expect(qb.lte).toHaveBeenCalledWith(
      "scheduled_at",
      expect.stringMatching(/2025-06-1[45]T/),
    );
  });

  it("filters by date range", async () => {
    db.__qb.resolveWith({ data: [makeAppointmentRow()], error: null });

    await getAppointments(db as never, {
      date_from: "2025-06-01T00:00:00Z",
      date_to: "2025-06-30T23:59:59Z",
    });

    const qb = db.from("appointments") as never as Record<
      string,
      ReturnType<typeof vi.fn>
    >;
    expect(qb.gte).toHaveBeenCalledWith("scheduled_at", "2025-06-01T00:00:00Z");
    expect(qb.lte).toHaveBeenCalledWith("scheduled_at", "2025-06-30T23:59:59Z");
  });

  it("filters by customer_id", async () => {
    db.__qb.resolveWith({ data: [makeAppointmentRow()], error: null });

    await getAppointments(db as never, { customer_id: CUSTOMER_ID });

    const qb = db.from("appointments") as never as Record<
      string,
      ReturnType<typeof vi.fn>
    >;
    expect(qb.eq).toHaveBeenCalledWith("customer_id", CUSTOMER_ID);
  });

  it("returns mechanic with id and null full_name when mechanic_profile missing but mechanic_id present", async () => {
    db.__qb.resolveWith({
      data: [
        makeAppointmentRow({
          mechanic_profile: null,
          mechanic_id: MECHANIC_ID,
        }),
      ],
      error: null,
    });

    const result = await getAppointments(db as never);

    expect(result[0].mechanic).toEqual({
      id: MECHANIC_ID,
      full_name: null,
    });
  });

  it("returns null mechanic when both mechanic_profile and mechanic_id are missing", async () => {
    db.__qb.resolveWith({
      data: [
        makeAppointmentRow({
          mechanic_profile: null,
          mechanic_id: null,
        }),
      ],
      error: null,
    });

    const result = await getAppointments(db as never);

    expect(result[0].mechanic).toBeNull();
  });

  it("captures error but returns empty array on DB error", async () => {
    const dbError = new Error("Database connection failed");
    db.__qb.resolveWith({ data: null, error: dbError });

    const result = await getAppointments(db as never);

    expect(result).toEqual([]);
    expect(mockCapture).toHaveBeenCalledWith(dbError);
  });

  it("throws UnauthorizedError when rpc returns no org", async () => {
    db.rpc.mockResolvedValue({ data: null, error: null });

    await expect(getAppointments(db as never)).rejects.toThrow(
      UnauthorizedError,
    );
  });
});

// ── getAppointment ─────────────────────────────────────────────────

describe("getAppointment", () => {
  it("returns single appointment with mechanic mapping", async () => {
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null });

    const result = await getAppointment(db as never, APPOINTMENT_ID);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(APPOINTMENT_ID);
    expect(result?.title).toBe("Oil Change");
    expect(result?.mechanic).toEqual({
      id: MECHANIC_ID,
      full_name: "Mech One",
    });
  });

  it("returns null when appointment not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getAppointment(db as never, "nonexistent-id");

    expect(result).toBeNull();
  });

  it("returns mechanic with id and null full_name when mechanic_profile missing but mechanic_id present", async () => {
    db.__qb.resolveOnce({
      data: makeAppointmentRow({
        mechanic_profile: null,
        mechanic_id: MECHANIC_ID,
      }),
      error: null,
    });

    const result = await getAppointment(db as never, APPOINTMENT_ID);

    expect(result?.mechanic).toEqual({
      id: MECHANIC_ID,
      full_name: null,
    });
  });

  it("returns null mechanic when both mechanic_profile and mechanic_id are missing", async () => {
    db.__qb.resolveOnce({
      data: makeAppointmentRow({
        mechanic_profile: null,
        mechanic_id: null,
      }),
      error: null,
    });

    const result = await getAppointment(db as never, APPOINTMENT_ID);

    expect(result?.mechanic).toBeNull();
  });

  it("captures error and returns null on DB error", async () => {
    const dbError = new Error("DB error");
    db.__qb.resolveOnce({ data: null, error: dbError });

    const result = await getAppointment(db as never, APPOINTMENT_ID);

    expect(result).toBeNull();
    expect(mockCapture).toHaveBeenCalledWith(dbError);
  });
});

// ── createAppointment ──────────────────────────────────────────────

describe("createAppointment", () => {
  it("creates appointment, audits, revalidates, and returns detail", async () => {
    // Insert .single() — queue entry #1
    db.__qb.resolveOnce({ data: { id: APPOINTMENT_ID }, error: null });
    // getAppointment .single() — queue entry #2
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null });

    const result = await createAppointment(
      db as never,
      validCreateParams,
      USER_ID,
    );

    expect(result.id).toBe(APPOINTMENT_ID);
    expect(result.title).toBe("Oil Change");
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        table_name: "appointments",
        record_id: APPOINTMENT_ID,
        user_id: USER_ID,
        organization_id: ORG_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalled();
    expect(mockResolveBranchId).toHaveBeenCalled();
  });

  it("creates appointment without explicit userId (falls back to auth.getUser)", async () => {
    // Insert .single()
    db.__qb.resolveOnce({ data: { id: APPOINTMENT_ID }, error: null });
    // getAppointment .single()
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null });

    const result = await createAppointment(db as never, validCreateParams);

    expect(result.id).toBe(APPOINTMENT_ID);
    expect(db.auth.getUser).toHaveBeenCalled();
  });

  it("rejects missing customer_id", async () => {
    await expect(
      createAppointment(
        db as never,
        { ...validCreateParams, customer_id: "" },
        USER_ID,
      ),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects missing vehicle_id", async () => {
    await expect(
      createAppointment(
        db as never,
        { ...validCreateParams, vehicle_id: "" },
        USER_ID,
      ),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects empty title", async () => {
    await expect(
      createAppointment(
        db as never,
        { ...validCreateParams, title: "   " },
        USER_ID,
      ),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects missing scheduled_at", async () => {
    await expect(
      createAppointment(
        db as never,
        { ...validCreateParams, scheduled_at: "" },
        USER_ID,
      ),
    ).rejects.toThrow(ValidationError);
  });

  it("throws on insert failure", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("Insert failed"),
    });

    await expect(
      createAppointment(db as never, validCreateParams, USER_ID),
    ).rejects.toThrow("Insert failed");
  });

  it("throws when insert returns no data without error", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      createAppointment(db as never, validCreateParams, USER_ID),
    ).rejects.toThrow("Failed to create appointment");
  });

  it("throws UnauthorizedError when auth returns no user and no userId_", async () => {
    db.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Insert .single() won't be reached
    await expect(
      createAppointment(db as never, validCreateParams),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("includes optional fields when provided", async () => {
    db.__qb.resolveOnce({ data: { id: APPOINTMENT_ID }, error: null });
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null });

    await createAppointment(
      db as never,
      {
        ...validCreateParams,
        description: " Full synthetic ",
        notes: " Customer prefers morning ",
        end_at: "2025-06-15T11:00:00Z",
        mechanic_id: MECHANIC_ID,
        source_estimate_id: "est-1",
      },
      USER_ID,
    );

    const qb = db.from("appointments") as never as Record<
      string,
      ReturnType<typeof vi.fn>
    >;
    // Check that the insert method was called — it's called via qb.insert
    expect(qb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Full synthetic",
        notes: "Customer prefers morning",
        end_at: "2025-06-15T11:00:00Z",
        mechanic_id: MECHANIC_ID,
        source_estimate_id: "est-1",
      }),
    );
  });
});

// ── updateAppointment ──────────────────────────────────────────────

describe("updateAppointment", () => {
  it("updates title and returns updated appointment", async () => {
    // Fetch existing — queue entry #1
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null });
    // Update call — queue entry #2
    db.__qb.resolveOnce({ data: null, error: null });
    // getAppointment after update — queue entry #3
    db.__qb.resolveOnce({
      data: makeAppointmentRow({ title: "Synthetic Oil Change" }),
      error: null,
    });

    const result = await updateAppointment(
      db as never,
      APPOINTMENT_ID,
      { title: "Synthetic Oil Change" },
      USER_ID,
    );

    expect(result.title).toBe("Synthetic Oil Change");
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        table_name: "appointments",
        record_id: APPOINTMENT_ID,
        organization_id: ORG_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalled();
  });
  it("updates status from scheduled to in_progress", async () => {
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null }); // 1: fetch
    db.__qb.resolveOnce({ data: null, error: null }); // 2: update
    db.__qb.resolveOnce({
      data: makeAppointmentRow({
        status: "in_progress",
        mechanic_profile: { id: MECHANIC_ID, full_name: "Mech One" },
      }),
      error: null,
    }); // 3: getAppointment

    const result = await updateAppointment(
      db as never,
      APPOINTMENT_ID,
      { status: "in_progress" as AppointmentStatus },
      USER_ID,
    );

    expect(result.status).toBe("in_progress");
  });

  it("updates multiple fields at once", async () => {
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null }); // 1: fetch
    db.__qb.resolveOnce({ data: null, error: null }); // 2: update
    db.__qb.resolveOnce({
      data: makeAppointmentRow({
        scheduled_at: "2025-06-16T14:00:00Z",
        mechanic_id: "mech-2",
        notes: "Rescheduled",
      }),
      error: null,
    }); // 3: getAppointment

    const result = await updateAppointment(
      db as never,
      APPOINTMENT_ID,
      {
        scheduled_at: "2025-06-16T14:00:00Z",
        mechanic_id: "mech-2",
        notes: "Rescheduled",
      },
      USER_ID,
    );

    expect(result.scheduled_at).toBe("2025-06-16T14:00:00Z");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("updates appointment without explicit userId", async () => {
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null }); // 1: fetch
    db.__qb.resolveOnce({ data: null, error: null }); // 2: update
    db.__qb.resolveOnce({
      data: makeAppointmentRow({ title: "Updated" }),
      error: null,
    }); // 3: getAppointment

    const _result = await updateAppointment(db as never, APPOINTMENT_ID, {
      title: "Updated",
    });
  });

  it("throws NotFoundError when fetch before update returns no data", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      updateAppointment(db as never, "nonexistent", { title: "New" }, USER_ID),
    ).rejects.toThrow("Appointment not found");
  });

  it("throws NotFoundError when the update itself fails", async () => {
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null });
    // Update resolves with an error
    db.__qb.resolveWith({ data: null, error: new Error("Update failed") });

    await expect(
      updateAppointment(db as never, APPOINTMENT_ID, { title: "New" }, USER_ID),
    ).rejects.toThrow("Appointment not found");
  });

  it("throws NotFoundError when refetch after successful update returns nothing", async () => {
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null });
    // Update succeeds (default resolveWith)
    // getAppointment .single() resolves with null
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      updateAppointment(db as never, APPOINTMENT_ID, { title: "New" }, USER_ID),
    ).rejects.toThrow("Appointment not found");
  });
});

// ── updateAppointmentStatus ────────────────────────────────────────

describe("updateAppointmentStatus", () => {
  it("delegates to updateAppointment with just the status", async () => {
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null }); // 1: fetch
    db.__qb.resolveOnce({ data: null, error: null }); // 2: update
    db.__qb.resolveOnce({
      data: makeAppointmentRow({ status: "completed" }),
      error: null,
    }); // 3: getAppointment

    const result = await updateAppointmentStatus(
      db as never,
      APPOINTMENT_ID,
      "completed" as AppointmentStatus,
    );

    expect(result.status).toBe("completed");
  });
});

// ── deleteAppointment ──────────────────────────────────────────────

describe("deleteAppointment", () => {
  it("soft-deletes appointment, logs audit, revalidates cache", async () => {
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null });

    await deleteAppointment(db as never, APPOINTMENT_ID, USER_ID);

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "soft_delete",
        table_name: "appointments",
        record_id: APPOINTMENT_ID,
        user_id: USER_ID,
        organization_id: ORG_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("soft-deletes appointment without explicit userId", async () => {
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null });

    await deleteAppointment(db as never, APPOINTMENT_ID);

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "soft_delete" }),
    );
    expect(db.auth.getUser).toHaveBeenCalled();
  });

  it("idempotent: does not throw when record does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null }); // fetch returns null
    // update uses default thenResolveData → { data: null, error: null }

    await expect(
      deleteAppointment(db as never, "nonexistent", USER_ID),
    ).resolves.toBeUndefined();
  });

  it("throws NotFoundError when the delete/update itself fails", async () => {
    db.__qb.resolveOnce({ data: makeAppointmentRow(), error: null });
    // The update resolves with error
    db.__qb.resolveWith({ data: null, error: new Error("Delete failed") });

    await expect(
      deleteAppointment(db as never, APPOINTMENT_ID, USER_ID),
    ).rejects.toThrow("Appointment not found");
  });
});
