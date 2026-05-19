import { z } from "zod";

// ── Reusable Primitives ───────────────────────────────────────

const uuid = z.string().uuid("Must be a valid UUID");
const nonEmpty = (field: string) => z.string().min(1, `${field} is required`);
const positiveNumber = (field: string) =>
  z.number().positive(`${field} must be positive`);

const mongolianPhone = z
  .string()
  .regex(/^(\+976|0)?\d{8}$/, "Must be a valid Mongolian phone number");

const yearField = z
  .number()
  .int()
  .min(1900, "Year must be 1900 or later")
  .max(2030, "Year must be 2030 or earlier")
  .optional();

const optStr = z.string().optional();
const optStrNullable = z.string().nullable().optional();

function atLeastOne<T extends z.ZodRawShape>(shape: T) {
  return z
    .object(shape)
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
      message: "At least one field must be provided",
    });
}

// ── Work Order Statuses ───────────────────────────────────────
// Matches DB check constraint: 'New','Diagnosing','In Progress','Ready for Pickup','Completed','Cancelled'
const workOrderStatusEnum = z.enum([
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
]);

// ── Customer Schemas ──────────────────────────────────────────

export const createCustomerSchema = z.object({
  firstName: nonEmpty("firstName"),
  lastName: nonEmpty("lastName"),
  phone: mongolianPhone.optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  type: z.enum(["individual", "company"]).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = atLeastOne({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: mongolianPhone.optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  companyName: optStr,
  contactPerson: optStr,
  address: optStr,
  notes: optStr,
  source: optStr,
  type: z.enum(["individual", "company"]).optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// ── Work Order Schemas ────────────────────────────────────────

export const createWorkOrderSchema = z
  .object({
    customer_id: uuid,
    vehicle_id: uuid,
    mechanic_id: uuid.optional(),
    branch_id: uuid.optional(),
    notes: z.string().optional(),
    discount_amount: z.number().optional(),
    discount_percentage: z.number().optional(),
    services: z
      .array(
        z.object({
          service_catalog_id: z.string().optional(),
          service_name: z.string().min(1, "Service name is required"),
          quantity: z.number().int().positive().optional().default(1),
          unit_price: z.number().min(0, "Unit price must be >= 0"),
          discount_amount: z.number().optional(),
          discount_percentage: z.number().optional(),
          notes: z.string().optional(),
        }),
      )
      .optional()
      .default([]),
    parts: z
      .array(
        z.object({
          part_id: z.string().optional(),
          part_name: z.string().min(1, "Part name is required"),
          part_number: z.string().optional(),
          quantity: z.number().int().positive().optional().default(1),
          unit_price: z.number().min(0, "Unit price must be >= 0"),
          discount_amount: z.number().optional(),
          discount_percentage: z.number().optional(),
          notes: z.string().optional(),
        }),
      )
      .optional()
      .default([]),
  })
  .refine(
    (data) => data.services.length > 0 || data.parts.length > 0,
    { message: "At least one service or part is required" },
  );

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

export const updateWorkOrderStatusSchema = z.object({
  status: workOrderStatusEnum,
  notes: z.string().optional(),
});

export type UpdateWorkOrderStatusInput = z.infer<typeof updateWorkOrderStatusSchema>;

// ── Vehicle Schemas ───────────────────────────────────────────

export const createVehicleSchema = z.object({
  plateNumber: nonEmpty("plateNumber"),
  make: nonEmpty("make"),
  model: nonEmpty("model"),
  year: yearField,
  vin: z
    .string()
    .length(17, "VIN must be exactly 17 characters")
    .optional()
    .or(z.literal("")),
  customerId: uuid.optional(),
  chassisNumber: optStr,
  trim: optStr,
  color: optStr,
  engine: optStr,
  fuelType: optStr,
  transmission: optStr,
  drivetrain: optStr,
  bodyType: optStr,
  odometer: z.number().int().min(0).optional(),
  notes: optStr,
  licenseExpiryAt: z.string().optional(),
  nextServiceAt: z.string().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = atLeastOne({
  plateNumber: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: yearField,
  vin: z
    .string()
    .length(17, "VIN must be exactly 17 characters")
    .optional()
    .or(z.literal("")),
  customerId: uuid.optional(),
  chassisNumber: optStrNullable,
  trim: optStrNullable,
  color: optStrNullable,
  engine: optStrNullable,
  fuelType: optStrNullable,
  transmission: optStrNullable,
  drivetrain: optStrNullable,
  bodyType: optStrNullable,
  odometer: z.number().int().min(0).nullable().optional(),
  notes: optStrNullable,
  licenseExpiryAt: optStrNullable,
  nextServiceAt: optStrNullable,
});

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

// ── Part Schemas ──────────────────────────────────────────────

export const createPartSchema = z.object({
  name: nonEmpty("name"),
  name_mn: optStr,
  part_number: optStr,
  category: optStr,
  description: optStr,
  unit: z.string().optional().default("pcs"),
  default_price: positiveNumber("default_price").optional(),
  purchase_price: z.number().min(0).optional(),
});

export type CreatePartInput = z.infer<typeof createPartSchema>;

export const updatePartSchema = atLeastOne({
  name: z.string().optional(),
  name_mn: z.string().optional(),
  part_number: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  default_price: z.number().min(0).optional(),
  purchase_price: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
});

export type UpdatePartInput = z.infer<typeof updatePartSchema>;

// ── Movement Schema ───────────────────────────────────────────

const movementTypeEnum = z.enum([
  "purchase",
  "sale",
  "adjustment",
  "transfer_in",
  "transfer_out",
  "return",
  "waste",
]);

export const createMovementSchema = z.object({
  part_id: uuid,
  movement_type: movementTypeEnum,
  quantity: z.number().refine((n) => n !== 0, "Quantity must be non-zero"),
  unit_cost: z.number().min(0).optional(),
  unit_price: z.number().min(0).optional(),
  reference_type: optStr,
  reference_id: uuid.optional(),
  notes: optStr,
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;

// ── Service Schemas ───────────────────────────────────────────

export const createServiceSchema = z.object({
  name: nonEmpty("name"),
  name_mn: optStr,
  default_price: positiveNumber("default_price").optional(),
  category: optStr,
  description: optStr,
  is_active: z.boolean().optional().default(true),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServicePriceSchema = z.object({
  default_price: positiveNumber("default_price"),
});

export type UpdateServicePriceInput = z.infer<typeof updateServicePriceSchema>;

// ── Expense Schemas ───────────────────────────────────────────

export const createExpenseSchema = z.object({
  amount: positiveNumber("amount"),
  category_id: uuid,
  description: nonEmpty("description"),
  vendor_name: optStr,
  tax_amount: z.number().min(0).optional().default(0),
  expense_date: z.string().optional(),
  due_date: optStrNullable,
  paid_at: optStrNullable,
  payment_method: optStr,
  reference_number: optStr,
  receipt_url: optStrNullable,
  notes: optStr,
  is_recurring: z.boolean().optional(),
  recurrence_interval: optStr,
  branch_id: uuid.optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// ── Supplier Schemas ──────────────────────────────────────────

export const createSupplierSchema = z.object({
  name: nonEmpty("name"),
  contact_person: optStr,
  phone: mongolianPhone.optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: optStr,
  tax_id: optStr,
  payment_terms: optStr,
  notes: optStr,
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = atLeastOne({
  name: z.string().optional(),
  contact_person: z.string().optional(),
  phone: mongolianPhone.optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
