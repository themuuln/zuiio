/**
 * Schema ↔ DB compatibility tests.
 *
 * Prevents the class of bug where a Zod schema rejects null/undefined
 * for a column that the database accepts as nullable.
 *
 * HOW IT WORKS:
 * Each test case maps a Zod schema to the DB columns it validates,
 * marking which columns are nullable in the database. The test then
 * verifies the schema accepts null for those columns.
 *
 * WHEN TO ADD CASES:
 * - After adding a new Zod schema in validation/
 * - After a migration changes column nullability
 * - When a bug like service_catalog_id arises
 */
import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  addPartParamsSchema,
  addServiceParamsSchema,
  addWorkOrderPartSchema,
  addWorkOrderServiceSchema,
  createAttachmentSchema,
  createWorkOrderSchema,
} from "./work-orders";

/**
 * Test helper: verifies a schema accepts null and undefined for the given fields.
 */
function assertNullableFieldsAcceptNull(
  schema: z.ZodTypeAny,
  nullableFields: string[],
  requiredFields: Record<string, unknown>,
) {
  for (const field of nullableFields) {
    const withNull = { ...requiredFields, [field]: null };
    const result = schema.safeParse(withNull);
    expect(
      result.success,
      `Schema should accept null for nullable field "${field}", but got: ${JSON.stringify(result.error?.issues)}`,
    ).toBe(true);

    const withUndefined = { ...requiredFields, [field]: undefined };
    const result2 = schema.safeParse(withUndefined);
    expect(
      result2.success,
      `Schema should accept undefined for optional field "${field}", but got: ${JSON.stringify(result2.error?.issues)}`,
    ).toBe(true);
  }
}

/**
 * Test helper: verifies a schema rejects null for required fields.
 */
function assertRequiredFieldsRejectNull(
  schema: z.ZodTypeAny,
  requiredFields: Record<string, unknown>,
) {
  for (const [field] of Object.entries(requiredFields)) {
    const withNull = { ...requiredFields, [field]: null };
    const result = schema.safeParse(withNull);
    expect(
      result.success,
      `Schema should reject null for required field "${field}"`,
    ).toBe(false);
  }
}

// ── Schema ↔ DB column nullability tests ─────────────────────

describe("Schema ↔ DB nullability compatibility", () => {
  describe("addWorkOrderServiceSchema (POST /work-orders/[id]/services)", () => {
    // DB: work_order_services.service_catalog_id is string | null
    // DB: work_order_services.service_name is string (NOT NULL)
    // DB: work_order_services.quantity is number (default 1)
    // DB: work_order_services.unit_price is number (NOT NULL)
    // DB: work_order_services.discount_amount is number | null
    // DB: work_order_services.discount_percentage is number | null
    // DB: work_order_services.notes is string | null

    const base = {
      service_name: "Oil Change",
      unit_price: 50000,
    };

    it("accepts null for service_catalog_id (global catalog service)", () => {
      assertNullableFieldsAcceptNull(
        addWorkOrderServiceSchema,
        [
          "service_catalog_id",
          "discount_amount",
          "discount_percentage",
          "notes",
        ],
        base,
      );
    });

    it("accepts valid string for service_catalog_id (org catalog service)", () => {
      const result = addWorkOrderServiceSchema.safeParse({
        ...base,
        service_catalog_id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("rejects null for service_name (required)", () => {
      assertRequiredFieldsRejectNull(addWorkOrderServiceSchema, base);
    });
  });

  describe("addServiceParamsSchema (POST /work-orders — inline services)", () => {
    // Same DB table: work_order_services
    const base = {
      service_name: "Brake Check",
      unit_price: 30000,
    };

    it("accepts null for service_catalog_id", () => {
      assertNullableFieldsAcceptNull(
        addServiceParamsSchema,
        [
          "service_catalog_id",
          "discount_amount",
          "discount_percentage",
          "notes",
        ],
        base,
      );
    });
  });

  describe("addWorkOrderPartSchema (POST /work-orders/[id]/parts)", () => {
    // DB: work_order_parts.part_id is string | null
    // DB: work_order_parts.part_name is string (NOT NULL)
    // DB: work_order_parts.part_number is string | null
    // DB: work_order_parts.quantity is number (default 1)
    // DB: work_order_parts.unit_price is number (NOT NULL)
    // DB: work_order_parts.discount_amount is number | null
    // DB: work_order_parts.discount_percentage is number | null
    // DB: work_order_parts.notes is string | null

    const base = {
      part_name: "Brake Pad",
      unit_price: 120000,
    };

    it("accepts null for nullable fields", () => {
      assertNullableFieldsAcceptNull(
        addWorkOrderPartSchema,
        [
          "part_id",
          "part_number",
          "discount_amount",
          "discount_percentage",
          "notes",
        ],
        base,
      );
    });
  });

  describe("addPartParamsSchema (POST /work-orders — inline parts)", () => {
    const base = {
      part_name: "Oil Filter",
      unit_price: 25000,
    };

    it("accepts null for nullable fields", () => {
      assertNullableFieldsAcceptNull(
        addPartParamsSchema,
        [
          "part_id",
          "part_number",
          "discount_amount",
          "discount_percentage",
          "notes",
        ],
        base,
      );
    });
  });

  describe("createWorkOrderSchema (POST /work-orders)", () => {
    // DB: work_orders.diagnosis_label_id is string | null
    // DB: work_orders.notes is string | null
    // DB: work_orders.complaint is string | null
    // DB: work_orders.mechanic_id is string | null
    const base = {
      customer_id: "550e8400-e29b-41d4-a716-446655440000",
      vehicle_id: "550e8400-e29b-41d4-a716-446655440001",
    };

    it("accepts null for nullable fields", () => {
      assertNullableFieldsAcceptNull(
        createWorkOrderSchema,
        ["diagnosis_label_id", "notes", "complaint", "mechanic_id", "branchId"],
        base,
      );
    });
  });

  describe("createAttachmentSchema (POST /work-orders/[id]/attachments)", () => {
    // DB: work_order_attachments.file_type is string (default 'other')
    // DB: work_order_attachments.public_url is string | null
    const base = {
      file_name: "photo.jpg",
      file_size: 1024,
      mime_type: "image/jpeg",
      storage_path: "attachments/photo.jpg",
      file_type: "photo" as const,
    };

    it("accepts null for public_url", () => {
      assertNullableFieldsAcceptNull(
        createAttachmentSchema,
        ["public_url"],
        base,
      );
    });
  });
});

// ── Cross-cutting: reject obviously invalid data ─────────────

describe("Schemas reject invalid data", () => {
  it("addWorkOrderServiceSchema rejects empty service_name", () => {
    const result = addWorkOrderServiceSchema.safeParse({
      service_name: "",
      unit_price: 50000,
    });
    expect(result.success).toBe(false);
  });

  it("addWorkOrderServiceSchema rejects negative unit_price", () => {
    const result = addWorkOrderServiceSchema.safeParse({
      service_name: "Oil Change",
      unit_price: -100,
    });
    expect(result.success).toBe(false);
  });

  it("addWorkOrderServiceSchema rejects non-integer quantity", () => {
    const result = addWorkOrderServiceSchema.safeParse({
      service_name: "Oil Change",
      unit_price: 50000,
      quantity: 1.5,
    });
    expect(result.success).toBe(false);
  });
});
