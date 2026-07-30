/**
 * Server Actions: E-Barimt Settings
 *
 * Read, update, and test e-barimt configuration.
 * Intended for use from the ebarimt-settings client component.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getEInvoiceSettings,
  updateEInvoiceSettings,
} from "@/lib/services/einvoice-service";
import type { EInvoiceSettings } from "@/lib/services/einvoice-service";
import {
  testEbarimtConnection,
  validateEbarimtConfig,
} from "@/lib/services/ebarimt-integration-service";
import type {
  ConnectionTestResult,
  EbarimtConfigStatus,
} from "@/lib/services/ebarimt-integration-service";

/**
 * Read the current e-barimt settings for an organization.
 */
export async function readEbarimtSettings(
  orgId: string,
): Promise<EInvoiceSettings> {
  const db = await createClient();
  return getEInvoiceSettings(db, orgId);
}

/**
 * Validate e-barimt config without making any API calls.
 */
export async function validateEbarimtSettings(
  orgId: string,
): Promise<EbarimtConfigStatus> {
  const db = await createClient();
  return validateEbarimtConfig(db, orgId);
}

/**
 * Update e-barimt settings for an organization.
 */
export async function updateEbarimtSettings(
  orgId: string,
  settings: {
    enabled?: boolean;
    apiKey?: string;
    merchantId?: string;
    endpoint?: string;
  },
): Promise<EInvoiceSettings> {
  const db = await createClient();
  return updateEInvoiceSettings(db, orgId, settings);
}

/**
 * Test the e-barimt connection with the org's current settings.
 */
export async function testCurrentEbarimtConnection(
  orgId: string,
): Promise<ConnectionTestResult> {
  const db = await createClient();
  return testEbarimtConnection(db, orgId);
}
