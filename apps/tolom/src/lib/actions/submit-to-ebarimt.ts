/**
 * Server Action: Submit Invoice to E-Barimt
 *
 * Called after an invoice is completed/paid to trigger electronic
 * tax receipt generation. Wraps ebarimt-integration-service so that
 * the invoice completion flow stays decoupled from invoice-service.ts.
 */

"use server";

import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { logAuditAfter } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import { createEbarimtInvoice } from "@/lib/services/ebarimt-integration-service";
import type { EbarimtIntegrationResult } from "@/lib/services/ebarimt-integration-service";

/**
 * Submit an invoice to e-barimt after completion.
 *
 * Should be called after invoice status transitions to "paid" or "sent".
 * Returns the integration result — callers can inspect the status field
 * to determine next steps (e.g., show QR code on success, log on skip).
 *
 * @param invoiceId - The invoice to submit
 * @param orgId - The organization
 * @param userId - The user performing the action
 */
export async function submitInvoiceToEbarimt(
  invoiceId: string,
  orgId: string,
  userId: string,
): Promise<EbarimtIntegrationResult> {
  const db = await createClient();

  const result = await createEbarimtInvoice(db, invoiceId, orgId);

  if (result.status === "registered") {
    logAuditAfter({
      supabase: db,
      action: "update",
      table_name: "invoices",
      record_id: invoiceId,
      user_id: userId,
      organization_id: orgId,
      old_data: { einvoice_status: null },
      new_data: {
        einvoice_status: "registered",
        einvoice_registration_id: result.registrationId,
      },
    });

    revalidateTag(cacheTags.invoice(invoiceId), "max");
    revalidateTag(cacheTags.invoices(orgId), "max");
  }

  return result;
}

/**
 * Submit many invoices to e-barimt in bulk.
 *
 * Useful when enabling e-barimt for an org that has existing paid invoices.
 * Filters to invoices that haven't been submitted yet.
 *
 * @param invoiceIds - Invoices to submit
 * @param orgId - The organization
 * @param userId - The user performing the action
 * @returns Results for each invoice
 */
export async function submitInvoicesToEbarimt(
  invoiceIds: string[],
  orgId: string,
  userId: string,
): Promise<Record<string, EbarimtIntegrationResult>> {
  const results: Record<string, EbarimtIntegrationResult> = {};

  for (const invoiceId of invoiceIds) {
    // Avoid hammering the API — submit sequentially
    const result = await submitInvoiceToEbarimt(invoiceId, orgId, userId);
    results[invoiceId] = result;
  }

  return results;
}
