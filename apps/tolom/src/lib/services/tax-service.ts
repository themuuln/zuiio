/**
 * Tax service for НӨАТ (VAT) calculations.
 *
 * Handles:
 * - НӨАТ toggle at org and work order level
 * - Tax calculations for work orders and invoices
 * - Settings management
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";

// ── Types ────────────────────────────────────────────────────

export interface OrgTaxSettings {
  nuatEnabled: boolean;
  taxRate: number;
}

export interface WorkOrderTaxResult {
  taxEnabled: boolean;
  taxRate: number;
  taxTotal: number;
}

export interface TaxableItem {
  total_price: number;
  is_tax_exempt?: boolean;
  tax_rate?: number | null;
}

export interface ItemTaxResult {
  taxableAmount: number;
  taxAmount: number;
  isExempt: boolean;
  effectiveRate: number;
}

// ── Get Org Tax Settings ─────────────────────────────────────

/**
 * Fetches НӨАТ settings for an organization.
 * Returns defaults if settings not found.
 */
export async function getOrgTaxSettings(
  db: SupabaseClient,
  orgId: string,
): Promise<OrgTaxSettings> {
  const { data, error } = await db
    .from("organization_settings")
    .select("nuat_enabled, default_tax_rate")
    .eq("organization_id", orgId)
    .single();

  if (error || !data) {
    // Return defaults if settings not found
    return {
      nuatEnabled: false,
      taxRate: 10,
    };
  }

  return {
    nuatEnabled: data.nuat_enabled ?? false,
    taxRate: data.default_tax_rate ?? 10,
  };
}

// ── Calculate Tax ────────────────────────────────────────────

/**
 * Calculates НӨАТ amount based on subtotal, tax rate, and whether НӨАТ is enabled.
 *
 * @param subtotal - The amount to calculate tax on (after discounts)
 * @param taxRate - Tax rate percentage (e.g., 10 for 10%)
 * @param nuatEnabled - Whether НӨАТ is enabled
 * @returns The tax amount, rounded to nearest integer
 */
export function calculateTax(
  subtotal: number,
  taxRate: number,
  nuatEnabled: boolean,
): number {
  if (!nuatEnabled || subtotal <= 0) {
    return 0;
  }

  return Math.round((subtotal * taxRate) / 100);
}

// ── Calculate Work Order Tax ─────────────────────────────────

/**
 * Calculates tax for a work order by reading its НӨАТ setting and org tax rate.
 *
 * @param db - Supabase client
 * @param workOrderId - Work order ID
 * @param orgId - Organization ID
 * @param subtotal - Subtotal amount (after line item discounts)
 * @param orderDiscount - Work order level discount
 * @returns Tax calculation result
 */
export async function calculateWorkOrderTax(
  db: SupabaseClient,
  workOrderId: string,
  orgId: string,
  subtotal: number,
  orderDiscount: number,
): Promise<WorkOrderTaxResult> {
  // Fetch work order НӨАТ setting
  const { data: workOrder } = await db
    .from("work_orders")
    .select("nuat_enabled")
    .eq("id", workOrderId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  // Fetch org tax settings
  const orgSettings = await getOrgTaxSettings(db, orgId);

  const nuatEnabled = workOrder?.nuat_enabled ?? false;
  const taxRate = orgSettings.taxRate;
  const taxableAmount = Math.max(subtotal - orderDiscount, 0);
  const taxTotal = calculateTax(taxableAmount, taxRate, nuatEnabled);

  return {
    taxEnabled: nuatEnabled,
    taxRate,
    taxTotal,
  };
}

// ── Update Work Order НӨАТ ───────────────────────────────────

/**
 * Updates the НӨАТ toggle on a work order.
 */
export async function updateWorkOrderNuat(
  db: SupabaseClient,
  workOrderId: string,
  orgId: string,
  nuatEnabled: boolean,
  userId?: string,
): Promise<boolean> {
  // Get current value for audit log
  const { data: current } = await db
    .from("work_orders")
    .select("nuat_enabled")
    .eq("id", workOrderId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  const { error } = await db
    .from("work_orders")
    .update({ nuat_enabled: nuatEnabled })
    .eq("id", workOrderId)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) {
    throw new NotFoundError("Work order not found");
  }

  // Audit log
  await createAuditLog({
    supabase: db,
    action: "update",
    table_name: "work_orders",
    record_id: workOrderId,
    user_id: userId,
    organization_id: orgId,
    old_data: { nuat_enabled: current?.nuat_enabled },
    new_data: { nuat_enabled: nuatEnabled },
  });

  revalidateTag(cacheTags.workOrders(orgId), "max");

  return true;
}

// ── Calculate Item Tax ───────────────────────────────────────

/**
 * Calculates tax for a single line item, respecting exemptions and custom rates.
 *
 * @param item - The item to calculate tax for
 * @param orgTaxRate - The organization's default tax rate
 * @returns Tax calculation result for the item
 */
export function calculateItemTax(
  item: TaxableItem,
  orgTaxRate: number,
): ItemTaxResult {
  // If item is exempt, no tax
  if (item.is_tax_exempt) {
    return {
      taxableAmount: 0,
      taxAmount: 0,
      isExempt: true,
      effectiveRate: 0,
    };
  }

  // Use item's custom rate if set, otherwise use org rate
  const effectiveRate = item.tax_rate ?? orgTaxRate;
  const taxableAmount = item.total_price;
  const taxAmount = Math.round((taxableAmount * effectiveRate) / 100);

  return {
    taxableAmount,
    taxAmount,
    isExempt: false,
    effectiveRate,
  };
}

// ── Calculate Total Tax for Items ────────────────────────────

/**
 * Calculates total tax for an array of items, respecting exemptions.
 *
 * @param items - Array of items to calculate tax for
 * @param orgTaxRate - The organization's default tax rate
 * @returns Total taxable amount and total tax
 */
export function calculateItemsTax(
  items: TaxableItem[],
  orgTaxRate: number,
): { totalTaxable: number; totalTax: number } {
  let totalTaxable = 0;
  let totalTax = 0;

  for (const item of items) {
    const result = calculateItemTax(item, orgTaxRate);
    totalTaxable += result.taxableAmount;
    totalTax += result.taxAmount;
  }

  return { totalTaxable, totalTax };
}

// ── Update Org НӨАТ Settings ─────────────────────────────────

/**
 * Updates НӨАТ settings for an organization.
 */
export async function updateOrgNuatSettings(
  db: SupabaseClient,
  orgId: string,
  settings: {
    nuatEnabled?: boolean;
    taxRate?: number;
  },
  userId?: string,
): Promise<OrgTaxSettings> {
  // Get current settings for audit log
  const currentSettings = await getOrgTaxSettings(db, orgId);

  const updates: Record<string, unknown> = {};

  if (settings.nuatEnabled !== undefined) {
    updates.nuat_enabled = settings.nuatEnabled;
  }

  if (settings.taxRate !== undefined) {
    // Validate tax rate
    if (settings.taxRate < 0 || settings.taxRate > 100) {
      throw new ValidationError("Tax rate must be between 0 and 100");
    }
    updates.default_tax_rate = settings.taxRate;
  }

  if (Object.keys(updates).length === 0) {
    // No updates needed, return current settings
    return currentSettings;
  }

  const { error } = await db
    .from("organization_settings")
    .update(updates)
    .eq("organization_id", orgId);

  if (error) {
    throw new Error("Failed to update tax settings");
  }

  // Audit log
  await createAuditLog({
    supabase: db,
    action: "update",
    table_name: "organization_settings",
    record_id: orgId,
    user_id: userId,
    organization_id: orgId,
    old_data: currentSettings as unknown as Record<string, unknown>,
    new_data: updates,
  });

  // Settings changes are rare - invalidate organizationUsers to refresh sidebar
  revalidateTag(cacheTags.organizationUsers(orgId), "max");

  // Return updated settings
  return getOrgTaxSettings(db, orgId);
}
