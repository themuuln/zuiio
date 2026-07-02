import { z } from "zod";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import type { WorkOrderPartItem } from "@/lib/services/post-service-service";
import type { PaymentMethodFees } from "./_payment-fees";

export const PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "manual",
] as const;

export type BayPaymentMethod = (typeof PAYMENT_METHODS)[number];

// ── Types ──────────────────────────────────────────────────

export interface WorkOrderServiceItem {
  id: string;
  service_name: string;
  service_catalog_id: string | null;
  catalog_interval_months: number | null;
  catalog_interval_km: number | null;
}

export interface ServiceFormEntry {
  workOrderServiceId: string;
  serviceName: string;
  serviceCatalogId: string | null;
  intervalMonths: number | null;
  intervalKm: number | null;
  priority: "standard" | "important" | "urgent";
  notes: string;
  expanded: boolean;
}

export interface PostServiceFormData {
  odometerReading: number | null;
  recommendations: Array<{
    workOrderServiceId: string;
    serviceName: string;
    serviceCatalogId: string | null;
    intervalMonths: number | null;
    intervalKm: number | null;
    priority: "standard" | "important" | "urgent";
    notes?: string;
  }>;
  mechanicNotes: string;
  paymentMethod: BayPaymentMethod;
  /** Selected org transfer bank when paymentMethod is bank_transfer. */
  transferBankId?: string | null;
}

export interface PostServiceFormProps {
  woId: string;
  vehicleId: string;
  vehiclePlate: string;
  currentOdometer: number | null;
  services: WorkOrderServiceItem[];
  /** Parts from this work order displayed for reference */
  parts: WorkOrderPartItem[];
  newStatus: string;
  grandTotal: number;
  paymentMethodFees: PaymentMethodFees;
  transferBanks: ResolvedTransferBank[];
  onConfirm: (data: PostServiceFormData) => Promise<void>;
  onCancel: () => void;
}

// ── Schema ───────────────────────────────────────────────────

export const postServiceSchema = z.object({
  odometer: z.string().optional(),
  mechanicNotes: z.string().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  transferBankId: z.string().optional(),
});

export type PostServiceFormValues = z.infer<typeof postServiceSchema>;
