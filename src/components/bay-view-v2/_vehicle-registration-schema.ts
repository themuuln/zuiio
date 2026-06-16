import { z } from "zod";
import { isValidMongolianPhone } from "@/lib/form-validation";

// ── Schema ───────────────────────────────────────────────────

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
  custPhone: z
    .string()
    .optional()
    .refine(
      (val) => !val || isValidMongolianPhone(val),
      "Enter a valid Mongolian phone number (8 digits)",
    ),
  complaint: z.string().optional(),
});

export type VehicleRegistrationFormValues = z.infer<
  typeof vehicleRegistrationSchema
>;

// ── Types ──────────────────────────────────────────────────

export interface LookupVehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  vin: string | null;
  engine: string | null;
  transmission: string | null;
  fuel_type: string | null;
  odometer: number | null;
}

export interface LookupCustomer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

export interface ServiceHistoryEntry {
  work_order_id: string;
  status: string;
  created_at: string;
  complaint: string | null;
  diagnosis: string | null;
  notes: string | null;
  total: number;
  mechanic_name: string | null;
  services: { name: string; price: number }[];
}

export interface LookupResult {
  exists: boolean;
  /** True when the plate was not found in DB but was found via SmartCar.mn API. */
  smartcarFound?: boolean;
  vehicle: LookupVehicle | null;
  customer: LookupCustomer | null;
  serviceHistory: ServiceHistoryEntry[];
}

export const EMPTY_LOOKUP: LookupResult = {
  exists: false,
  vehicle: null,
  customer: null,
  serviceHistory: [],
};

export interface SearchVehicleResult {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
}

// ── Helper to resolve current vehicle/customer IDs ─────────────

export function resolveQueueIds(
  savedVehicleId: string | null,
  savedCustomerId: string | null,
  lookupResult: LookupResult,
): { vehicleId: string | null; customerId: string | null } {
  return {
    vehicleId: savedVehicleId ?? lookupResult.vehicle?.id ?? null,
    customerId: savedCustomerId ?? lookupResult.customer?.id ?? null,
  };
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
