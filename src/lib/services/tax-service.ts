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
): Promise<boolean> {
  const { error } = await db
    .from("work_orders")
    .update({ nuat_enabled: nuatEnabled })
    .eq("id", workOrderId)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) {
    throw new NotFoundError("Work order not found");
  }

  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(cacheTags.bayView(orgId, orgId), "max");

  return true;
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
): Promise<OrgTaxSettings> {
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
    return getOrgTaxSettings(db, orgId);
  }

  const { error } = await db
    .from("organization_settings")
    .update(updates)
    .eq("organization_id", orgId);

  if (error) {
    throw new Error("Failed to update tax settings");
  }

  // Settings changes are rare - invalidate organizationUsers to refresh sidebar
  revalidateTag(cacheTags.organizationUsers(orgId), "max");

  // Return updated settings
  return getOrgTaxSettings(db, orgId);
}
