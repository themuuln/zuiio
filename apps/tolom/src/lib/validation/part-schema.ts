import { z } from "zod";

// ── Part Schema ────────────────────────────────────────────────

export const partSchema = z.object({
  nameMn: z.string().min(1, "Монгол нэр шаардлагатай"),
  name: z.string().optional(),
  partNumber: z.string().optional(),
  barcode: z.string().optional(),
  defaultPrice: z.string().optional(),
  purchasePrice: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
});

export type PartFormValues = z.infer<typeof partSchema>;

// ── Work Order Part Schema ─────────────────────────────────────

export const addWorkOrderPartSchema = z.object({
  partId: z.string().uuid().nullable().optional(),
  partName: z.string().min(1, "Part name is required").max(200),
  partNumber: z.string().max(100).nullable().optional(),
  quantity: z.number().int().positive("Quantity must be positive").default(1),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  discountAmount: z.number().min(0).nullable().optional(),
  discountPercentage: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export type AddWorkOrderPartInput = z.infer<typeof addWorkOrderPartSchema>;
