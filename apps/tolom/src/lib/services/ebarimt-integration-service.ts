/**
 * E-Barimt Integration Service
 *
 * Wraps the existing E-Invoice (Э-Баримт) service for Mongolia's
 * electronic tax receipt system. Provides higher-level operations:
 *  - Invoice submission on completion
 *  - Config validation
 *  - Status lookup
 *  - Connection testing
 *
 * This service does NOT modify invoice-service.ts — it composes over it.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { ValidationError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";
import {
  getEInvoiceSettings,
  registerEInvoice,
  type EInvoiceRegistrationResult,
  type EInvoiceSettings,
} from "./einvoice-service";

// ── Types ────────────────────────────────────────────────────

export interface EbarimtIntegrationResult {
  registrationId: string;
  qrCode: string;
  status: "registered" | "failed" | "skipped";
  error?: string;
}

export interface EbarimtConfigStatus {
  configured: boolean;
  enabled: boolean;
  hasApiKey: boolean;
  hasMerchantId: boolean;
  endpoint: string;
  missing: string[];
}

export interface EbarimtInvoiceStatus {
  einvoiceStatus: string | null;
  einvoiceRegistrationId: string | null;
  einvoiceQrCode: string | null;
  einvoiceRegisteredAt: string | null;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

// ── Validate E-Barimt Config ─────────────────────────────────

/**
 * Validates that e-barimt settings are properly configured for an organization.
 * Returns a detailed status object rather than throwing — callers can inspect
 * `.configured` for a boolean answer and `.missing` for actionable messages.
 */
export async function validateEbarimtConfig(
  db: SupabaseClient,
  orgId: string,
): Promise<EbarimtConfigStatus> {
  const settings = await getEInvoiceSettings(db, orgId);

  const status: EbarimtConfigStatus = {
    configured: false,
    enabled: settings.enabled,
    hasApiKey: !!settings.apiKey,
    hasMerchantId: !!settings.merchantId,
    endpoint: settings.endpoint,
    missing: [],
  };

  if (!settings.enabled) {
    status.missing.push("e-barimt is disabled");
  }
  if (!settings.apiKey) {
    status.missing.push("API key is not set");
  }
  if (!settings.merchantId) {
    status.missing.push("Merchant ID is not set");
  }

  status.configured =
    settings.enabled && !!settings.apiKey && !!settings.merchantId;

  return status;
}

// ── Get E-Barimt Status for Invoice ──────────────────────────

/**
 * Checks whether an invoice has been sent to e-barimt and returns
 * its current registration status.
 */
export async function getEbarimtStatusForInvoice(
  db: SupabaseClient,
  invoiceId: string,
): Promise<EbarimtInvoiceStatus> {
  const { data, error } = await db
    .from("invoices")
    .select(
      "einvoice_status, einvoice_registration_id, einvoice_qr_code, einvoice_registered_at",
    )
    .eq("id", invoiceId)
    .single()
    .throwOnError();

  if (error || !data) {
    throw new ValidationError("Invoice not found");
  }

  return {
    einvoiceStatus: data.einvoice_status,
    einvoiceRegistrationId: data.einvoice_registration_id,
    einvoiceQrCode: data.einvoice_qr_code,
    einvoiceRegisteredAt: data.einvoice_registered_at,
  };
}

// ── Create E-Barimt Invoice ──────────────────────────────────

/**
 * Creates an e-barimt electronic receipt for a given invoice.
 *
 * Flow:
 *  1. Validates the org's e-barimt configuration
 *  2. Calls registerEInvoice to send the invoice
 *  3. Returns the integration result
 *
 * Returns `skipped` when e-barimt is not configured (no error thrown).
 * Throws ValidationError when the invoice is not found.
 */
export async function createEbarimtInvoice(
  db: SupabaseClient,
  invoiceId: string,
  orgId: string,
): Promise<EbarimtIntegrationResult> {
  // Step 1: Validate config
  const configStatus = await validateEbarimtConfig(db, orgId);
  if (!configStatus.configured) {
    return {
      registrationId: "",
      qrCode: "",
      status: "skipped",
      error: `E-barimt not configured: ${configStatus.missing.join(", ")}`,
    };
  }

  // Step 2: Check if already registered
  const existingStatus = await getEbarimtStatusForInvoice(db, invoiceId);
  if (existingStatus.einvoiceStatus === "registered") {
    return {
      registrationId: existingStatus.einvoiceRegistrationId ?? "",
      qrCode: existingStatus.einvoiceQrCode ?? "",
      status: "registered",
    };
  }

  // Step 3: Register via the underlying service
  try {
    const result = await registerEInvoice(db, invoiceId, orgId);

    if (!result) {
      // Shouldn't happen after config validation, but handle gracefully
      return {
        registrationId: "",
        qrCode: "",
        status: "skipped",
        error: "E-barimt registration returned no result",
      };
    }

    revalidateTag(cacheTags.invoice(invoiceId), "max");
    revalidateTag(cacheTags.invoices(orgId), "max");

    return {
      registrationId: result.registrationId,
      qrCode: result.qrCode,
      status: result.status === "registered" ? "registered" : "failed",
      error: result.error,
    };
  } catch (error) {
    reportServerError("E-barimt integration failed", error);
    revalidateTag(cacheTags.invoice(invoiceId), "max");

    return {
      registrationId: "",
      qrCode: "",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ── Test E-Barimt Connection ─────────────────────────────────

/**
 * Tests the e-barimt connection by making a lightweight API call
 * with the configured credentials.
 *
 * This does NOT register an invoice — it simply validates that the
 * endpoint is reachable and the API key is accepted.
 */
export async function testEbarimtConnection(
  db: SupabaseClient,
  orgId: string,
): Promise<ConnectionTestResult> {
  const settings = await getEInvoiceSettings(db, orgId);

  if (!settings.endpoint) {
    return {
      success: false,
      message: "E-barimt endpoint URL is not configured",
    };
  }

  if (!settings.apiKey) {
    return {
      success: false,
      message: "E-barimt API key is not configured",
    };
  }

  if (!settings.merchantId) {
    return {
      success: false,
      message: "E-barimt merchant ID is not configured",
    };
  }

  try {
    // Use a lightweight GET to the endpoint to verify reachability
    const response = await fetch(`${settings.endpoint}/info`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        "X-Merchant-ID": settings.merchantId,
        Accept: "application/json",
      },
      // Short timeout so the test doesn't hang
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) {
      return {
        success: true,
        message: "Connection successful",
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message:
          "Authentication failed — check your API key and merchant ID",
      };
    }

    return {
      success: false,
      message: `E-barimt API returned status ${response.status}`,
    };
  } catch (error) {
    if (
      error instanceof DOMException && error.name === "TimeoutError" ||
      error instanceof Error && error.name === "TimeoutError"
    ) {
      return {
        success: false,
        message: `Connection timed out — ${settings.endpoint} is not reachable`,
      };
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to connect to e-barimt",
    };
  }
}
