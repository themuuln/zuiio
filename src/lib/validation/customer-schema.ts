import { z } from "zod";
import { emailSchema, phoneSchema } from "./schemas";

// ── Customer Types ─────────────────────────────────────────────

export const CUSTOMER_TYPES = ["individual", "company"] as const;

// ── Quick Customer Schema (minimal fields) ─────────────────────

export const quickCustomerSchema = z.object({
  type: z.enum(CUSTOMER_TYPES).default("individual"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: phoneSchema,
  email: emailSchema,
  address: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

export type QuickCustomerInput = z.infer<typeof quickCustomerSchema>;

// ── Full Customer Schema ───────────────────────────────────────

export const customerSchema = z.object({
  type: z.enum(CUSTOMER_TYPES).default("individual"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: emailSchema,
  address: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
