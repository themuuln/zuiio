import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors";

// Mock sentry-report-server so parseBody tests don't emit real Sentry calls
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

import {
  addPartParamsSchema,
  addServiceParamsSchema,
  addWorkOrderPartSchema,
  addWorkOrderServiceSchema,
  cancelWorkOrderSchema,
  createAttachmentSchema,
  createWorkOrderSchema,
  parseBody,
  updatePartPriceSchema,
  updateServicePriceSchema,
  updateWorkOrderSchema,
} from "../work-orders";

// ── Shared test UUID ──────────────────────────────────────────
const TEST_UUID = "00000000-0000-4000-8000-000000000001";

// ── parseBody ─────────────────────────────────────────────────

describe("parseBody", () => {
  it("parses valid JSON body and validates against schema", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "In Progress" }),
    });
    const result = await parseBody(req, updateWorkOrderSchema);
    expect(result).toEqual({ status: "In Progress" });
  });

  it("throws ValidationError on invalid JSON body", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    await expect(parseBody(req, updateWorkOrderSchema)).rejects.toThrow(
      ValidationError,
    );
  });

  it("throws ValidationError when schema validation fails", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invalid_status" }),
    });
    await expect(parseBody(req, updateWorkOrderSchema)).rejects.toThrow(
      ValidationError,
    );
  });
});

// ── updateWorkOrderSchema ─────────────────────────────────────

describe("updateWorkOrderSchema", () => {
  it("accepts valid partial update with one field", () => {
    const result = updateWorkOrderSchema.safeParse({ status: "In Progress" });
    expect(result.success).toBe(true);
  });

  it("accepts multiple fields", () => {
    const result = updateWorkOrderSchema.safeParse({
      status: "Completed",
      notes: "All done",
    });
    expect(result.success).toBe(true);
  });

  it("accepts nullable fields set to null", () => {
    const result = updateWorkOrderSchema.safeParse({
      mechanic_id: null,
      complaint: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts nuat_enabled boolean", () => {
    const result = updateWorkOrderSchema.safeParse({ nuat_enabled: true });
    expect(result.success).toBe(true);
  });

  it("rejects empty object (refine)", () => {
    const result = updateWorkOrderSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid status value", () => {
    const result = updateWorkOrderSchema.safeParse({ status: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for mechanic_id", () => {
    const result = updateWorkOrderSchema.safeParse({
      mechanic_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects string that exceeds max length for complaint", () => {
    const result = updateWorkOrderSchema.safeParse({
      complaint: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

// ── cancelWorkOrderSchema ─────────────────────────────────────

describe("cancelWorkOrderSchema", () => {
  it("accepts with a reason", () => {
    const result = cancelWorkOrderSchema.safeParse({
      reason: "Customer request",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (reason is optional)", () => {
    const result = cancelWorkOrderSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects reason exceeding 500 characters", () => {
    const result = cancelWorkOrderSchema.safeParse({
      reason: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// ── createWorkOrderSchema ─────────────────────────────────────

describe("createWorkOrderSchema", () => {
  it("accepts complete valid data", () => {
    const result = createWorkOrderSchema.safeParse({
      customer_id: TEST_UUID,
      vehicle_id: TEST_UUID,
      mechanic_id: TEST_UUID,
      notes: "Customer says weird noise",
      complaint: "Engine knocking",
      services: [
        {
          service_name: "Oil change",
          unit_price: 50000,
        },
      ],
      parts: [
        {
          part_name: "Oil filter",
          unit_price: 15000,
          quantity: 1,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimum required fields only", () => {
    const result = createWorkOrderSchema.safeParse({
      customer_id: TEST_UUID,
      vehicle_id: TEST_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing customer_id", () => {
    const result = createWorkOrderSchema.safeParse({
      vehicle_id: TEST_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing vehicle_id", () => {
    const result = createWorkOrderSchema.safeParse({
      customer_id: TEST_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for customer_id", () => {
    const result = createWorkOrderSchema.safeParse({
      customer_id: "bad",
      vehicle_id: TEST_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects services exceeding max 50 items", () => {
    const result = createWorkOrderSchema.safeParse({
      customer_id: TEST_UUID,
      vehicle_id: TEST_UUID,
      services: Array(51).fill({
        service_name: "Service",
        unit_price: 1000,
      }),
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative discount_amount", () => {
    const result = createWorkOrderSchema.safeParse({
      customer_id: TEST_UUID,
      vehicle_id: TEST_UUID,
      discount_amount: -100,
    });
    expect(result.success).toBe(false);
  });
});

// ── addWorkOrderServiceSchema ─────────────────────────────────

describe("addWorkOrderServiceSchema", () => {
  it("accepts valid data", () => {
    const result = addWorkOrderServiceSchema.safeParse({
      service_name: "Brake pad replacement",
      unit_price: 120000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts data with all optional fields", () => {
    const result = addWorkOrderServiceSchema.safeParse({
      service_catalog_id: "cat-1",
      service_name: "Brake pad replacement",
      quantity: 2,
      unit_price: 120000,
      discount_amount: 5000,
      discount_percentage: 5,
      notes: "Front brakes only",
    });
    expect(result.success).toBe(true);
  });

  it("applies default quantity of 1", () => {
    const result = addWorkOrderServiceSchema.parse({
      service_name: "Test",
      unit_price: 1000,
    });
    expect(result.quantity).toBe(1);
  });

  it("rejects missing service_name", () => {
    const result = addWorkOrderServiceSchema.safeParse({
      unit_price: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing unit_price", () => {
    const result = addWorkOrderServiceSchema.safeParse({
      service_name: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative unit_price", () => {
    const result = addWorkOrderServiceSchema.safeParse({
      service_name: "Test",
      unit_price: -10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive quantity", () => {
    const result = addWorkOrderServiceSchema.safeParse({
      service_name: "Test",
      unit_price: 1000,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });
});

// ── addWorkOrderPartSchema ────────────────────────────────────

describe("addWorkOrderPartSchema", () => {
  it("accepts valid data", () => {
    const result = addWorkOrderPartSchema.safeParse({
      part_name: "Oil filter",
      unit_price: 25000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts data with all optional fields", () => {
    const result = addWorkOrderPartSchema.safeParse({
      part_id: "00000000-0000-4000-8000-000000000002",
      part_name: "Oil filter",
      part_number: "OF-123",
      quantity: 2,
      unit_price: 25000,
      discount_amount: 1000,
      discount_percentage: 5,
      notes: "Genuine parts only",
    });
    expect(result.success).toBe(true);
  });

  it("applies default quantity of 1", () => {
    const result = addWorkOrderPartSchema.parse({
      part_name: "Filter",
      unit_price: 1000,
    });
    expect(result.quantity).toBe(1);
  });

  it("rejects missing part_name", () => {
    const result = addWorkOrderPartSchema.safeParse({
      unit_price: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing unit_price", () => {
    const result = addWorkOrderPartSchema.safeParse({
      part_name: "Filter",
    });
    expect(result.success).toBe(false);
  });
});

// ── updateServicePriceSchema ──────────────────────────────────

describe("updateServicePriceSchema", () => {
  it("accepts final_price only", () => {
    const result = updateServicePriceSchema.safeParse({ final_price: 100000 });
    expect(result.success).toBe(true);
  });

  it("accepts quantity only", () => {
    const result = updateServicePriceSchema.safeParse({ quantity: 3 });
    expect(result.success).toBe(true);
  });

  it("accepts unit_price only", () => {
    const result = updateServicePriceSchema.safeParse({ unit_price: 50000 });
    expect(result.success).toBe(true);
  });

  it("accepts all fields", () => {
    const result = updateServicePriceSchema.safeParse({
      final_price: 100000,
      quantity: 2,
      unit_price: 50000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty object (refine)", () => {
    const result = updateServicePriceSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects negative final_price", () => {
    const result = updateServicePriceSchema.safeParse({ final_price: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive quantity", () => {
    const result = updateServicePriceSchema.safeParse({ quantity: 0 });
    expect(result.success).toBe(false);
  });
});

// ── updatePartPriceSchema ─────────────────────────────────────

describe("updatePartPriceSchema", () => {
  it("accepts final_price only", () => {
    const result = updatePartPriceSchema.safeParse({ final_price: 50000 });
    expect(result.success).toBe(true);
  });

  it("accepts quantity only", () => {
    const result = updatePartPriceSchema.safeParse({ quantity: 2 });
    expect(result.success).toBe(true);
  });

  it("accepts unit_price only", () => {
    const result = updatePartPriceSchema.safeParse({ unit_price: 25000 });
    expect(result.success).toBe(true);
  });

  it("rejects empty object (refine)", () => {
    const result = updatePartPriceSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ── createAttachmentSchema ────────────────────────────────────

describe("createAttachmentSchema", () => {
  it("accepts valid data", () => {
    const result = createAttachmentSchema.safeParse({
      file_name: "repair-photo.jpg",
      file_size: 204800,
      mime_type: "image/jpeg",
      storage_path: "/uploads/work-orders/wo-123/photo.jpg",
      file_type: "photo",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid data with optional public_url", () => {
    const result = createAttachmentSchema.safeParse({
      file_name: "invoice.pdf",
      file_size: 102400,
      mime_type: "application/pdf",
      storage_path: "/uploads/work-orders/wo-123/invoice.pdf",
      public_url: "https://cdn.example.com/invoice.pdf",
      file_type: "document",
    });
    expect(result.success).toBe(true);
  });

  it("accepts file_type other", () => {
    const result = createAttachmentSchema.safeParse({
      file_name: "readme.txt",
      file_size: 100,
      mime_type: "text/plain",
      storage_path: "/uploads/readme.txt",
      file_type: "other",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing file_name", () => {
    const result = createAttachmentSchema.safeParse({
      file_size: 204800,
      mime_type: "image/jpeg",
      storage_path: "/uploads/photo.jpg",
      file_type: "photo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid file_type", () => {
    const result = createAttachmentSchema.safeParse({
      file_name: "test.jpg",
      file_size: 100,
      mime_type: "image/jpeg",
      storage_path: "/uploads/test.jpg",
      file_type: "video",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative file_size", () => {
    const result = createAttachmentSchema.safeParse({
      file_name: "test.jpg",
      file_size: -1,
      mime_type: "image/jpeg",
      storage_path: "/uploads/test.jpg",
      file_type: "photo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-url public_url", () => {
    const result = createAttachmentSchema.safeParse({
      file_name: "test.jpg",
      file_size: 100,
      mime_type: "image/jpeg",
      storage_path: "/uploads/test.jpg",
      public_url: "not-a-url",
      file_type: "photo",
    });
    expect(result.success).toBe(false);
  });
});

// ── addServiceParamsSchema ────────────────────────────────────

describe("addServiceParamsSchema", () => {
  it("accepts valid data", () => {
    const result = addServiceParamsSchema.safeParse({
      service_name: "AC recharge",
      unit_price: 80000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts service_catalog_id set to null", () => {
    const result = addServiceParamsSchema.safeParse({
      service_name: "AC recharge",
      unit_price: 80000,
      service_catalog_id: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing service_name", () => {
    const result = addServiceParamsSchema.safeParse({ unit_price: 1000 });
    expect(result.success).toBe(false);
  });

  it("rejects negative discount_percentage", () => {
    const result = addServiceParamsSchema.safeParse({
      service_name: "Test",
      unit_price: 1000,
      discount_percentage: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects discount_percentage over 100", () => {
    const result = addServiceParamsSchema.safeParse({
      service_name: "Test",
      unit_price: 1000,
      discount_percentage: 101,
    });
    expect(result.success).toBe(false);
  });
});

// ── addPartParamsSchema ───────────────────────────────────────

describe("addPartParamsSchema", () => {
  it("accepts valid data", () => {
    const result = addPartParamsSchema.safeParse({
      part_name: "Brake pads",
      unit_price: 45000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts part_id set to null", () => {
    const result = addPartParamsSchema.safeParse({
      part_name: "Brake pads",
      unit_price: 45000,
      part_id: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing part_name", () => {
    const result = addPartParamsSchema.safeParse({ unit_price: 1000 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for part_id", () => {
    const result = addPartParamsSchema.safeParse({
      part_name: "Test",
      unit_price: 1000,
      part_id: "not-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty part_name string", () => {
    const result = addPartParamsSchema.safeParse({
      part_name: "",
      unit_price: 1000,
    });
    expect(result.success).toBe(false);
  });
});
