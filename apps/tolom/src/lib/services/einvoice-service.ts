/**
 * E-Invoice (Э-Баримт) service for Mongolia's electronic invoice system.
 *
 * Handles registration of invoices with the General Taxation Authority.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { reportServerError } from "@/lib/sentry-report-server";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { ValidationError } from "@/lib/errors";

// ── Types ────────────────────────────────────────────────────

export interface EInvoiceSettings {
  enabled: boolean;
  apiKey: string | null;
  merchantId: string | null;
  endpoint: string;
}

export interface EInvoiceRegistrationResult {
  registrationId: string;
  qrCode: string;
  status: "registered" | "failed";
  error?: string;
}

// ── Get E-Invoice Settings ───────────────────────────────────

/**
 * Fetches E-Invoice settings for an organization.
 */
export async function getEInvoiceSettings(
  db: SupabaseClient,
  orgId: string,
): Promise<EInvoiceSettings> {
  const { data } = await db
    .from("organization_settings")
    .select(
      "einvoice_enabled, einvoice_api_key, einvoice_merchant_id, einvoice_endpoint",
    )
    .eq("organization_id", orgId)
    .maybeSingle();

  return {
    enabled: data?.einvoice_enabled ?? false,
    apiKey: data?.einvoice_api_key ?? null,
    merchantId: data?.einvoice_merchant_id ?? null,
    endpoint: data?.einvoice_endpoint ?? "https://ebarimt.mn/api",
  };
}

// ── Register E-Invoice ───────────────────────────────────────

/**
 * Registers an invoice with the E-Invoice system.
 *
 * @param db - Supabase client
 * @param invoiceId - Invoice ID to register
 * @param orgId - Organization ID
 * @returns Registration result
 */
export async function registerEInvoice(
  db: SupabaseClient,
  invoiceId: string,
  orgId: string,
): Promise<EInvoiceRegistrationResult | null> {
  // Check if E-Invoice is enabled
  const settings = await getEInvoiceSettings(db, orgId);
  if (!settings.enabled || !settings.apiKey || !settings.merchantId) {
    return null;
  }

  // Fetch invoice with items
  const { data: invoice, error: invoiceError } = await db
    .from("invoices")
    .select(
      "id, invoice_number, issued_at, total, tax_total, customer_name, customer_email, einvoice_status, einvoice_registration_id, einvoice_qr_code",
    )
    .eq("id", invoiceId)
    .eq("organization_id", orgId)
    .single();

  if (invoiceError || !invoice) {
    throw new ValidationError("Invoice not found");
  }

  // Skip if already registered
  if (invoice.einvoice_status === "registered") {
    return {
      registrationId: invoice.einvoice_registration_id ?? "",
      qrCode: invoice.einvoice_qr_code ?? "",
      status: "registered",
    };
  }

  // Fetch invoice items
  const { data: items } = await db
    .from("invoice_items")
    .select("description, quantity, unit_price, total_price")
    .eq("invoice_id", invoiceId);

  // Build E-Invoice payload
  const payload = {
    merchantId: settings.merchantId,
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.issued_at,
    totalAmount: Number(invoice.total),
    taxAmount: Number(invoice.tax_total),
    customerName: invoice.customer_name ?? "Walk-in Customer",
    customerEmail: invoice.customer_email,
    items: (items ?? []).map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      amount: Number(item.total_price),
    })),
  };

  try {
    // Call E-Invoice API
    const response = await fetch(`${settings.endpoint}/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ?? `E-Invoice API error: ${response.status}`,
      );
    }

    const result = await response.json();

    // Update invoice with registration data
    await db
      .from("invoices")
      .update({
        einvoice_registration_id: result.registrationId,
        einvoice_qr_code: result.qrCode,
        einvoice_status: "registered",
        einvoice_registered_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    revalidateTag(cacheTags.invoice(invoiceId), "max");
    revalidateTag(cacheTags.invoices(orgId), "max");

    return {
      registrationId: result.registrationId,
      qrCode: result.qrCode,
      status: "registered",
    };
  } catch (error) {
    reportServerError("Unexpected error", error);
    // Mark as failed
    await db
      .from("invoices")
      .update({
        einvoice_status: "failed",
      })
      .eq("id", invoiceId);

    revalidateTag(cacheTags.invoice(invoiceId), "max");

    return {
      registrationId: "",
      qrCode: "",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ── Update E-Invoice Settings ────────────────────────────────

/**
 * Updates E-Invoice settings for an organization.
 */
export async function updateEInvoiceSettings(
  db: SupabaseClient,
  orgId: string,
  settings: {
    enabled?: boolean;
    apiKey?: string;
    merchantId?: string;
    endpoint?: string;
  },
): Promise<EInvoiceSettings> {
  const updates: Record<string, unknown> = {};

  if (settings.enabled !== undefined)
    updates.einvoice_enabled = settings.enabled;
  if (settings.apiKey !== undefined) updates.einvoice_api_key = settings.apiKey;
  if (settings.merchantId !== undefined)
    updates.einvoice_merchant_id = settings.merchantId;
  if (settings.endpoint !== undefined)
    updates.einvoice_endpoint = settings.endpoint;

  if (Object.keys(updates).length === 0) {
    return getEInvoiceSettings(db, orgId);
  }

  const { error } = await db
    .from("organization_settings")
    .update(updates)
    .eq("organization_id", orgId);

  if (error) {
    throw new Error("Failed to update E-Invoice settings");
  }

  revalidateTag(cacheTags.organizationUsers(orgId), "max");

  return getEInvoiceSettings(db, orgId);
}
