import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));

import { reportServerError } from "@/lib/sentry-report-server";

const _mockReportServerError = vi.mocked(reportServerError);

import { submitBookingRequest } from "../booking-service";

const ORG_ID = "org-1";
const CUSTOMER_ID = "customer-1";
const VEHICLE_ID = "vehicle-1";
const APPOINTMENT_ID = "appt-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── submitBookingRequest ──────────────────────────────────────────

describe("submitBookingRequest", () => {
  const params = {
    name: "John Doe",
    phone: "+976-99112233",
    plate: "УБ001АБВ",
    notes: "Check engine light on",
    requestedDate: "2025-06-15T10:00:00Z",
  };

  it("creates booking with existing customer and vehicle", async () => {
    vi.mocked(db.from("customers")).maybeSingle.mockResolvedValueOnce({
      data: {
        id: CUSTOMER_ID,
        first_name: "John",
        last_name: "Doe",
        phone: "+976-99112233",
      },
      error: null,
    });
    vi.mocked(db.from("vehicles")).maybeSingle.mockResolvedValueOnce({
      data: { id: VEHICLE_ID, plate_number: "УБ001АБВ" },
      error: null,
    });
    db.__qb.resolveOnce({
      data: { id: APPOINTMENT_ID },
      error: null,
    });
    db.__qb.resolveOnce({ data: { name: "Test Shop" }, error: null });
    vi.mocked(
      db.from("organization_settings"),
    ).maybeSingle.mockResolvedValueOnce({
      data: { notification_email: "shop@example.com" },
      error: null,
    });

    const result = await submitBookingRequest(db as never, ORG_ID, params);

    expect(result).toEqual({
      appointmentId: APPOINTMENT_ID,
      customerId: CUSTOMER_ID,
      vehicleId: VEHICLE_ID,
    });
  });

  it("creates new customer when not found", async () => {
    vi.mocked(db.from("customers")).maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    db.__qb.resolveOnce({
      data: {
        id: CUSTOMER_ID,
        first_name: "John",
        last_name: null,
        phone: "+976-99112233",
      },
      error: null,
    });

    vi.mocked(db.from("vehicles")).maybeSingle.mockResolvedValueOnce({
      data: { id: VEHICLE_ID, plate_number: "УБ001АБВ" },
      error: null,
    });

    db.__qb.resolveOnce({ data: { id: APPOINTMENT_ID }, error: null });
    db.__qb.resolveOnce({ data: { name: "Test Shop" }, error: null });
    vi.mocked(
      db.from("organization_settings"),
    ).maybeSingle.mockResolvedValueOnce({
      data: { notification_email: "shop@example.com" },
      error: null,
    });

    const result = await submitBookingRequest(db as never, ORG_ID, params);

    expect(result.customerId).toBe(CUSTOMER_ID);
  });

  it("creates new vehicle when not found", async () => {
    vi.mocked(db.from("customers")).maybeSingle.mockResolvedValueOnce({
      data: {
        id: CUSTOMER_ID,
        first_name: "John",
        last_name: "Doe",
        phone: "+976-99112233",
      },
      error: null,
    });
    vi.mocked(db.from("vehicles")).maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    db.__qb.resolveOnce({
      data: { id: VEHICLE_ID, plate_number: "УБ001АБВ" },
      error: null,
    });
    db.__qb.resolveOnce({ data: { id: APPOINTMENT_ID }, error: null });
    db.__qb.resolveOnce({ data: { name: "Test Shop" }, error: null });
    vi.mocked(
      db.from("organization_settings"),
    ).maybeSingle.mockResolvedValueOnce({
      data: { notification_email: "shop@example.com" },
      error: null,
    });

    const result = await submitBookingRequest(db as never, ORG_ID, params);

    expect(result.vehicleId).toBe(VEHICLE_ID);
  });

  it("throws on customer creation failure", async () => {
    vi.mocked(db.from("customers")).maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: new Error("Insert failed") });

    await expect(
      submitBookingRequest(db as never, ORG_ID, params),
    ).rejects.toThrow("Failed to create customer");
  });

  it("throws on vehicle creation failure", async () => {
    vi.mocked(db.from("customers")).maybeSingle.mockResolvedValueOnce({
      data: {
        id: CUSTOMER_ID,
        first_name: "John",
        last_name: "Doe",
        phone: "+976-99112233",
      },
      error: null,
    });
    vi.mocked(db.from("vehicles")).maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    db.__qb.resolveOnce({
      data: null,
      error: new Error("Vehicle insert failed"),
    });

    await expect(
      submitBookingRequest(db as never, ORG_ID, params),
    ).rejects.toThrow("Failed to create vehicle");
  });

  it("throws on appointment creation failure", async () => {
    vi.mocked(db.from("customers")).maybeSingle.mockResolvedValueOnce({
      data: {
        id: CUSTOMER_ID,
        first_name: "John",
        last_name: "Doe",
        phone: "+976-99112233",
      },
      error: null,
    });
    vi.mocked(db.from("vehicles")).maybeSingle.mockResolvedValueOnce({
      data: { id: VEHICLE_ID, plate_number: "УБ001АБВ" },
      error: null,
    });
    db.__qb.resolveOnce({
      data: null,
      error: new Error("Appointment insert failed"),
    });

    await expect(
      submitBookingRequest(db as never, ORG_ID, params),
    ).rejects.toThrow("Failed to create appointment");
  });

  it("handles vehicle owner link failure gracefully (fire-and-forget is not fatal)", async () => {
    vi.mocked(db.from("customers")).maybeSingle.mockResolvedValueOnce({
      data: {
        id: CUSTOMER_ID,
        first_name: "John",
        last_name: "Doe",
        phone: "+976-99112233",
      },
      error: null,
    });
    vi.mocked(db.from("vehicles")).maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    db.__qb.resolveOnce({
      data: { id: VEHICLE_ID, plate_number: "УБ001АБВ" },
      error: null,
    });
    // vehicle_owners.insert (fire-and-forget; test name says "handles failure gracefully")
    db.__qb.resolveOnce({ data: null, error: new Error("Link failed") });
    db.__qb.resolveOnce({ data: { id: APPOINTMENT_ID }, error: null });
    db.__qb.resolveOnce({ data: { name: "Test Shop" }, error: null });
    vi.mocked(
      db.from("organization_settings"),
    ).maybeSingle.mockResolvedValueOnce({
      data: { notification_email: "shop@example.com" },
      error: null,
    });

    const result = await submitBookingRequest(db as never, ORG_ID, params);

    expect(result.appointmentId).toBe(APPOINTMENT_ID);
  });
});
