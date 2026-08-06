import type { z } from "zod";
import type { UseFormReturn } from "@/lib/hooks/use-form";
import type { vehicleSchema } from "@/lib/validation/vehicle-schema";

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

/** Translator bound to the "vehicles" namespace (same shape as the parent casts). */
export type VehicleFormT = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/** Translator bound to the "common" namespace. */
export type CommonT = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export type VehicleFormApi = UseFormReturn<VehicleFormValues>;
