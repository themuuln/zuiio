import { z } from "zod";
import { emailSchema, phoneSchema } from "./schemas";

// ── Branch Schema ──────────────────────────────────────────────

export const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address: z.string().optional(),
  phone: phoneSchema.optional(),
  email: emailSchema,
});

export type BranchFormValues = z.infer<typeof branchSchema>;

// ── Quick Branch Schema (stricter validators) ──────────────────

export const quickBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address: z.string().optional(),
  phone: phoneSchema.optional(),
  email: emailSchema,
});

export type QuickBranchInput = z.infer<typeof quickBranchSchema>;
