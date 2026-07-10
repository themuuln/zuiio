import { z } from "zod";
import { phoneSchema, plateSchema } from "./schemas";

// ── Quick Vehicle Schema (minimal fields) ──────────────────────

export const quickVehicleSchema = z.object({
  plateNumber: plateSchema,
  make: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  engine: z.string().optional(),
  odometer: z.string().optional(),
});

export type QuickVehicleInput = z.infer<typeof quickVehicleSchema>;

// ── Full Vehicle Schema ────────────────────────────────────────

export const vehicleSchema = z.object({
  plateNumber: plateSchema,
  make: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().optional(),
  vin: z.string().optional(),
  chassisNumber: z.string().optional(),
  trim: z.string().optional(),
  color: z.string().optional(),
  engine: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  drivetrain: z.string().optional(),
  bodyType: z.string().optional(),
  odometer: z.string().optional(),
  notes: z.string().optional(),
  licenseExpiryAt: z.string().optional(),
  nextServiceAt: z.string().optional(),
  importDate: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  category: z.string().optional(),
  seats: z.string().optional(),
  steering: z.string().optional(),
  height: z.string().optional(),
  width: z.string().optional(),
  length: z.string().optional(),
  weight: z.string().optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

// ── Parts Car Schema ───────────────────────────────────────────

export const partsCarSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().optional(),
  vin: z.string().optional(),
  licensePlate: z.string().optional(),
  purchaseCost: z.string().optional(),
  notes: z.string().optional(),
});

export type PartsCarFormValues = z.infer<typeof partsCarSchema>;

// ── Vehicle Registration Schema (bay view) ─────────────────────

export const vehicleRegistrationSchema = z.object({
  make: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  engine: z.string().optional(),
  odometer: z.string().optional(),
  custFirstName: z.string().min(1, "First name is required"),
  custLastName: z.string().optional(),
  custPhone: phoneSchema,
  complaint: z.string().optional(),
});

export type VehicleRegistrationFormValues = z.infer<
  typeof vehicleRegistrationSchema
>;
