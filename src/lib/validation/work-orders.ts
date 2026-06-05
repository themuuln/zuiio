import { z } from "zod";
import { ValidationError } from "@/lib/errors";
import type { WorkOrderStatus } from "@/lib/types";

// ── Work Order Status enum ──────────────────────────────────────

const WORK_ORDER_STATUSES = [
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
] as const satisfies readonly WorkOrderStatus[];

// ── UUID pattern ──────────────────────────────────────────────

const uuid = z.string().uuid({ message: "Invalid UUID" });

// ── PATCH /work-orders/[workOrderId] ──────────────────────────

export const updateWorkOrderSchema = z
  .object({
    status: z.enum(WORK_ORDER_STATUSES).optional(),
    mechanic_id: uuid.nullable().optional(),
    complaint: z
      .string()
      .max(1000, "Complaint must be under 1000 characters")
      .nullable()
      .optional(),
    diagnosis: z
      .string()
      .max(1000, "Diagnosis must be under 1000 characters")
      .nullable()
      .optional(),
    notes: z
      .string()
      .max(2000, "Notes must be under 2000 characters")
      .nullable()
      .optional(),
    loss_reason: z
      .string()
      .max(500, "Loss reason must be under 500 characters")
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.mechanic_id !== undefined ||
      data.complaint !== undefined ||
      data.diagnosis !== undefined ||
      data.notes !== undefined,
    {
      message:
        "At least one of status, mechanic_id, complaint, diagnosis, or notes is required",
    },
  );
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;

// ── DELETE /work-orders/[workOrderId] (cancel) ─────────────────

export const cancelWorkOrderSchema = z.object({
  reason: z
    .string()
    .max(500, "Loss reason must be under 500 characters")
    .optional(),
});

// ── POST /work-orders (create) ─────────────────────────────────

export const addServiceParamsSchema = z.object({
  service_catalog_id: z.string().min(1).nullable().optional(),
  service_name: z.string().min(1, "Service name is required").max(200),
  quantity: z.number().int().positive("Quantity must be positive").default(1),
  unit_price: z.number().min(0, "Unit price cannot be negative"),
  discount_amount: z.number().min(0).nullable().optional(),
  discount_percentage: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const addPartParamsSchema = z.object({
  part_id: z.string().uuid().nullable().optional(),
  part_name: z.string().min(1, "Part name is required").max(200),
  part_number: z.string().max(100).nullable().optional(),
  quantity: z.number().int().positive("Quantity must be positive").default(1),
  unit_price: z.number().min(0, "Unit price cannot be negative"),
  discount_amount: z.number().min(0).nullable().optional(),
  discount_percentage: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const createWorkOrderSchema = z.object({
  customer_id: uuid,
  vehicle_id: uuid,
  branchId: z.string().nullable().optional(),
  mechanic_id: uuid.nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  complaint: z
    .string()
    .max(1000, "Complaint must be under 1000 characters")
    .nullable()
    .optional(),
  diagnosis_label_id: z.string().nullable().optional(),
  services: z.array(addServiceParamsSchema).max(50).optional(),
  parts: z.array(addPartParamsSchema).max(50).optional(),
  discount_amount: z.number().min(0).nullable().optional(),
  discount_percentage: z.number().min(0).max(100).nullable().optional(),
});
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

// ── POST /work-orders/[workOrderId]/services ──────────────────

export const addWorkOrderServiceSchema = z.object({
  service_catalog_id: z.string().min(1).nullable().optional(),
  service_name: z.string().min(1, "Service name is required").max(200),
  quantity: z.number().int().positive().default(1),
  unit_price: z.number().min(0, "Unit price cannot be negative"),
  discount_amount: z.number().min(0).nullable().optional(),
  discount_percentage: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

// ── PATCH /work-orders/[workOrderId]/services?serviceId= ───────

export const updateServicePriceSchema = z.object({
  final_price: z.number().min(0, "Price cannot be negative"),
});

// ── POST /work-orders/[workOrderId]/parts ──────────────────────

export const addWorkOrderPartSchema = z.object({
  part_id: z.string().uuid().nullable().optional(),
  part_name: z.string().min(1, "Part name is required").max(200),
  part_number: z.string().max(100).nullable().optional(),
  quantity: z.number().int().positive().default(1),
  unit_price: z.number().min(0, "Unit price cannot be negative"),
  discount_amount: z.number().min(0).nullable().optional(),
  discount_percentage: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

// ── PATCH /work-orders/[workOrderId]/parts?partId= ────────────

export const updatePartPriceSchema = z.object({
  final_price: z.number().min(0, "Price cannot be negative"),
});

// ── POST /work-orders/[workOrderId]/attachments ────────────────

export const createAttachmentSchema = z.object({
  file_name: z.string().min(1, "File name is required").max(255),
  file_size: z.number().int().positive(),
  mime_type: z.string().min(1, "MIME type is required").max(100),
  storage_path: z.string().min(1, "Storage path is required").max(500),
  public_url: z.string().url("Invalid URL").nullable().optional(),
  file_type: z.enum(["photo", "document", "other"]),
});

// ── Helper: validate request body ───────────────────────────────

/**
 * Validates a request body against a Zod schema.
 * Throws ValidationError (with structured details) on failure.
 * Returns the typed/transformed data on success.
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Invalid JSON in request body");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
    throw new ValidationError("Request body validation failed", details);
  }

  return result.data;
}
