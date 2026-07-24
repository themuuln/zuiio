import { z } from "zod";

// ── Service Catalog Schema ─────────────────────────────────────

export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  nameMn: z.string().optional(),
  defaultPrice: z
    .string()
    .refine(
      (v) => v.trim() !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0,
      "Enter a valid price",
    ),
  defaultCost: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

// ── Work Order Service Schema ──────────────────────────────────

export const addWorkOrderServiceSchema = z.object({
  serviceCatalogId: z.string().min(1).nullable().optional(),
  serviceName: z.string().min(1, "Service name is required").max(200),
  quantity: z.number().int().positive("Quantity must be positive").default(1),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  discountAmount: z.number().min(0).nullable().optional(),
  discountPercentage: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export type AddWorkOrderServiceInput = z.infer<
  typeof addWorkOrderServiceSchema
>;
