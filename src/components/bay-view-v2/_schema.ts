import { z } from "zod";

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
}

export interface PostServiceFormProps {
  woId: string;
  vehicleId: string;
  vehiclePlate: string;
  currentOdometer: number | null;
  services: WorkOrderServiceItem[];
  newStatus: string;
  onConfirm: (data: PostServiceFormData) => Promise<void>;
  onCancel: () => void;
}

// ── Schema ───────────────────────────────────────────────────

export const postServiceSchema = z.object({
  odometer: z.string().optional(),
  mechanicNotes: z.string().optional(),
});

export type PostServiceFormValues = z.infer<typeof postServiceSchema>;
