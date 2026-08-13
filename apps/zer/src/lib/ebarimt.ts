import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import type { Database } from "@/lib/supabase/types";

/**
 * e-Barimt tax receipt API client (prepared; activates when credentials
 * exist).
 *
 * Environment contract (all optional today):
 *   EBARIMT_BASE_URL   — tax authority endpoint (default per env)
 *   EBARIMT_API_KEY    — merchant API key / token
 *
 * Legal requirement (G-EBARIMT): paid sales must issue an e-Barimt
 * receipt and store the receipt id on the invoice (`invoices.ebarimt_id`).
 * `issueReceiptForPaidOrder` is the integration point: called after a
 * payment is confirmed (QPay webhook → confirm_online_payment, or staff
 * marking an order paid) when the org has the eBarimt vertical flag and
 * the API key is configured.
 */

/** True when e-Barimt credentials are present. */
export function isEbarimtConfigured(): boolean {
  return Boolean(process.env.EBARIMT_API_KEY);
}

/**
 * Issue an e-Barimt receipt for a completed sale. Best-effort by design:
 * callers must never fail the order when the receipt service is down —
 * the receipt can be re-issued from the paid order later.
 *
 * The exact request/response contract arrives with the API credentials;
 * the shape below is the documented seam. Until then, returns
 * { issued: false, reason: "not_configured" }.
 */
export async function issueReceiptForPaidOrder(
  supabase: SupabaseClient<Database>,
  saleId: string,
): Promise<{ issued: boolean; ebarimtId?: string; reason?: string }> {
  if (!isEbarimtConfigured()) {
    return { issued: false, reason: "not_configured" };
  }

  try {
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, invoice_number, ebarimt_id, sale_id")
      .eq("sale_id", saleId)
      .maybeSingle();

    if (!invoice) {
      return { issued: false, reason: "no_invoice" };
    }
    if (invoice.ebarimt_id) {
      return { issued: true, ebarimtId: invoice.ebarimt_id };
    }

    const { data: sale } = await supabase
      .from("sales")
      .select(
        "organization_id, total_amount, paid_amount, status, contact_id, contact_email, organization:organizations(name)",
      )
      .eq("id", saleId)
      .maybeSingle();

    if (!sale) return { issued: false, reason: "no_sale" };

    // TODO(contract): POST to EBARIMT_BASE_URL with the payload below.
    // Response expected to carry the receipt id, stored on the invoice.
    const baseUrl = process.env.EBARIMT_BASE_URL;
    if (!baseUrl) return { issued: false, reason: "no_base_url" };

    const payload = {
      invoice_no: invoice.invoice_number,
      sale_id: saleId,
      amount: sale.total_amount,
      org: { name: sale.organization?.name ?? null },
    };

    const res = await fetch(`${baseUrl}/receipt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EBARIMT_API_KEY ?? ""}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as {
      receipt_id?: string;
      error?: string;
    } | null;
    if (!res.ok || !json?.receipt_id) {
      throw new Error(json?.error ?? `e-Barimt failed: ${res.status}`);
    }

    await supabase
      .from("invoices")
      .update({ ebarimt_id: json.receipt_id })
      .eq("id", invoice.id);

    return { issued: true, ebarimtId: json.receipt_id };
  } catch (err) {
    capture(err, { context: "ebarimt: issueReceiptForPaidOrder" });
    return { issued: false, reason: "error" };
  }
}
