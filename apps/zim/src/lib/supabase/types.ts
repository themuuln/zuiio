/**
 * Row types synced from remote Supabase schema (cvqwdscitkpwlwnpajjd).
 * Generated 2026-07-11. Status union aliases and *Row names kept for app imports.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "provisioning"
  | "delivered"
  | "partially_failed"
  | "failed"
  | "expired"
  | "cancelled"
  | "refunded";

export type EsimStatus =
  | "pending"
  | "provisioning"
  | "delivered"
  | "activated"
  | "expired"
  | "failed"
  | "refunded";

export type PaymentStatus =
  | "created"
  | "paid"
  | "failed"
  | "expired"
  | "refunded";

export type ProvisioningJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed_permanent";

export type RegionKind = "country" | "regional" | "global";
export type PricingRuleScope = "global" | "region" | "package";

export interface RegionRow {
  id: string;
  slug: string;
  name_en: string;
  name_mn: string;
  kind: RegionKind;
  country_code: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface PackageRow {
  id: string;
  provider: string;
  provider_package_id: string;
  region_id: string;
  name: string;
  data_mb: number | null;
  is_unlimited: boolean;
  validity_days: number;
  coverage_countries: string[];
  cost_usd: number;
  provider_meta: Json;
  is_enabled: boolean;
  is_archived: boolean;
  needs_repricing: boolean;
  synced_at: string | null;
  created_at: string;
}

export interface FxRateRow {
  id: string;
  pair: string;
  rate: number;
  source: "manual" | "auto";
  created_by: string | null;
  created_at: string;
}

export interface PricingRuleRow {
  id: string;
  scope: PricingRuleScope;
  region_id: string | null;
  package_id: string | null;
  markup_percent: number;
  is_active: boolean;
  note: string | null;
  created_at: string;
}

export interface AppSettingRow {
  key: string;
  value: Json;
  updated_at: string;
}

export interface CustomerRow {
  id: string;
  email: string;
  phone: string;
  auth_user_id: string | null;
  created_at: string;
}

export interface OrderRow {
  id: string;
  order_code: string;
  customer_id: string;
  email: string;
  phone: string;
  locale: string;
  status: OrderStatus;
  total_mnt: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  package_id: string;
  quantity: number;
  package_name: string;
  cost_usd: number;
  fx_rate: number;
  fx_rate_id: string | null;
  markup_percent: number;
  pricing_rule_id: string | null;
  min_margin_applied: boolean;
  unit_retail_mnt: number;
  unit_cost_mnt: number;
}

export interface EsimRow {
  id: string;
  order_item_id: string;
  order_id: string;
  provider: string;
  provider_esim_id: string | null;
  provider_order_id: string | null;
  iccid: string | null;
  lpa_string: string | null;
  activation_code: string | null;
  smdp_address: string | null;
  qr_payload: string | null;
  status: EsimStatus;
  provider_status_raw: Json | null;
  delivered_at: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  order_id: string;
  provider: string;
  invoice_id: string | null;
  sender_invoice_no: string;
  amount_mnt: number;
  status: PaymentStatus;
  qpay_payment_id: string | null;
  paid_at: string | null;
  raw: Json | null;
  created_at: string;
}

export interface ProvisioningJobRow {
  id: string;
  order_id: string;
  esim_id: string | null;
  status: ProvisioningJobStatus;
  attempts: number;
  max_attempts: number;
  next_retry_at: string;
  last_error: string | null;
  created_at: string;
}

export interface WebhookEventRow {
  id: string;
  provider: string;
  event_id: string;
  payload: Json;
  processed_at: string | null;
  created_at: string;
}

export interface AdminUserRow {
  user_id: string;
  role: "admin" | "owner";
  created_at: string;
}
