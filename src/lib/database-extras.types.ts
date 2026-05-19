// ── Supplementary types for tables added after last type generation ──
// This file exists because database.types.ts is auto-generated and
// the CI pipeline to regenerate it requires Docker (unavailable).
// When database.types.ts is next regenerated, merge these into it.

export interface ServiceRecommendation {
  id: string;
  organization_id: string;
  branch_id: string | null;
  work_order_id: string;
  work_order_service_id: string | null;
  service_name: string;
  service_catalog_id: string | null;
  recommended_interval_months: number | null;
  recommended_interval_km: number | null;
  next_due_date: string | null;
  next_due_km: number | null;
  priority: "standard" | "important" | "urgent";
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ServiceRecommendationInsert {
  id?: string;
  organization_id: string;
  branch_id?: string | null;
  work_order_id: string;
  work_order_service_id?: string | null;
  service_name: string;
  service_catalog_id?: string | null;
  recommended_interval_months?: number | null;
  recommended_interval_km?: number | null;
  next_due_date?: string | null;
  next_due_km?: number | null;
  priority?: "standard" | "important" | "urgent";
  notes?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ServiceCompletionDatum {
  id: string;
  organization_id: string;
  branch_id: string | null;
  work_order_id: string;
  vehicle_id: string;
  odometer_reading: number | null;
  customer_satisfaction: number | null;
  customer_feedback: string | null;
  customer_preferences: Record<string, unknown>;
  next_appointment_date: string | null;
  collected_at: string;
  created_by: string | null;
  created_at: string;
}

export interface ServiceCompletionDatumInsert {
  id?: string;
  organization_id: string;
  branch_id?: string | null;
  work_order_id: string;
  vehicle_id: string;
  odometer_reading?: number | null;
  customer_satisfaction?: number | null;
  customer_feedback?: string | null;
  customer_preferences?: Record<string, unknown>;
  next_appointment_date?: string | null;
  collected_at?: string;
  created_by?: string | null;
  created_at?: string;
}

// ── Customer Portal types ──────────────────────────────────

export interface CustomerPortalData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  portal_token: string;
  organization_id: string;
  total_visits: number;
  last_visit_at: string | null;
}
