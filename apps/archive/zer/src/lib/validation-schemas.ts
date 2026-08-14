import { z } from "zod";

// ---------------------------------------------------------------------------
// Common primitives
// ---------------------------------------------------------------------------

/** Money amount — coerced from FormData string, must be > 0. */
const positiveMoney = z.coerce
  .number({ message: "Дүн тоо байх ёстой" })
  .min(0.01, "Дүн 0-ээс их байх ёстой");

/** Money amount — coerced from FormData string, ≥ 0 (for optional fields). */
const nonNegativeMoney = z.coerce
  .number({ message: "Дүн тоо байх ёстой" })
  .min(0, "Дүн 0-ээс багагүй байх ёстой");

/** Required non-empty date string. */
const requiredDate = z.string().min(1, "Огноо шаардлагатай");

/** Parses a JSON-stringified array that must be non-empty. */
const jsonItemsArray = z
  .string()
  .min(1, "Барааны мэдээлэл шаардлагатай")
  .refine(
    (val) => {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    },
    { message: "Барааны мэдээлэл шаардлагатай" },
  );

// ---------------------------------------------------------------------------
// Expense
// ---------------------------------------------------------------------------

export const expenseSchema = z.object({
  category: z.string().min(1, "Ангилал шаардлагатай"),
  amount: positiveMoney,
  expense_date: requiredDate,
  description: z.string().nullable().optional(),
  payment_method: z.string().default("cash"),
});

// ---------------------------------------------------------------------------
// Discount
// ---------------------------------------------------------------------------

export const discountSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  description: z.string().nullable().optional(),
  type: z.enum(["percentage", "fixed_amount"], {
    message: "Хямдралын төрөл буруу байна",
  }),
  value: positiveMoney,
  applies_to: z.enum(["all", "selected_products", "selected_categories"], {
    message: "Хэрэглэх талбар буруу байна",
  }),
  min_purchase_amount: nonNegativeMoney.default(0),
  valid_from: z.string().min(1, "Хүчинтэй эхлэх огноо шаардлагатай"),
  valid_until: z.string().nullable().optional(),
  is_active: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .transform((v) => v === true || v === "true")
    .default(true),
  usage_limit: z.coerce.number().int().min(0).nullable().optional(),
  conditions: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Purchase order
// ---------------------------------------------------------------------------

export const purchaseSchema = z.object({
  supplier_id: z.string().nullable().optional(),
  order_date: requiredDate,
  expected_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: jsonItemsArray,
});

// ---------------------------------------------------------------------------
// Quotation (pre-sale)
// ---------------------------------------------------------------------------

export const quotationSchema = z.object({
  contact_id: z.string().nullable().optional(),
  issue_date: requiredDate,
  expiry_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: jsonItemsArray,
});
