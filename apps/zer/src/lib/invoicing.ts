"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { capture, withDbCapture } from "@zuiio/capture";
import type { Database } from "@/lib/supabase/types";

/**
 * Creates an invoice from a completed sale.
 * Queries the sale and its items, then generates an invoice + invoice_items.
 * Sharing is opt-in — no share token is auto-generated.
 *
 * This is called after a sale succeeds. Failures are logged but do not
 * roll back the sale — the sale is already committed.
 */
export async function createInvoiceFromSale(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  userId: string,
  saleId: string,
  contactId?: string | null,
  branchId?: string,
) {
  // Fetch sale details with org-scoped check
  const { data: sale } = await withDbCapture(
    "invoicing: fetch sale",
    supabase
      .from("sales")
      .select("total_amount, paid_amount")
      .eq("id", saleId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (!sale) {
    capture(new Error(`Invoice generation: sale not found: ${saleId}`), {
      context: "invoicing: sale lookup",
    });
    return null;
  }

  // Fetch sale items with product info
  const { data: items } = await withDbCapture(
    "invoicing: fetch sale items",
    supabase
      .from("sale_items")
      .select("product_id, quantity, unit_price, total_price, products(name)")
      .eq("sale_id", saleId),
  );

  if (!items || items.length === 0) {
    capture(new Error(`Invoice generation: no sale items found: ${saleId}`), {
      context: "invoicing: items lookup",
    });
    return null;
  }
  if (!branchId) {
    capture(
      new Error(`Invoice generation: branchId is required for sale ${saleId}`),
      {
        context: "invoicing: branchId guard",
      },
    );
    return null;
  }
  const { data: invNum, error: invNumError } = await supabase.rpc(
    "generate_invoice_number",
  );

  if (invNumError) {
    capture(invNumError, { context: "invoicing: generate number" });
  }

  const invoiceNumber = invNum as string;

  // Create invoice
  const { data: invoice, error: invoiceError } = await withDbCapture(
    "invoicing: create invoice",
    supabase
      .from("invoices")
      .insert({
        organization_id: organizationId,
        branch_id: branchId,
        invoice_number: invoiceNumber,
        contact_id: contactId || null,
        sale_id: saleId,
        total_amount: sale.total_amount,
        paid_amount: sale.paid_amount ?? 0,
        status: "paid",
        created_by: userId,
      })
      .select("id")
      .single(),
  );

  if (invoiceError) {
    capture(invoiceError, { context: "invoicing: create invoice" });
    return null;
  }

  // Create invoice items from sale items
  const invoiceItems = items.map((item) => {
    const product = item.products as { name: string } | null;
    return {
      invoice_id: invoice.id,
      product_id: item.product_id,
      description: product?.name ?? "Бүтээгдэхүүн",
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    };
  });

  const { error: itemsError } = await withDbCapture(
    "invoicing: create invoice items",
    supabase.from("invoice_items").insert(invoiceItems),
  );
  if (itemsError) {
    // Invoice exists but without items — partially bad state
    capture(itemsError, { context: "invoicing: create invoice items" });
  }

  return { invoiceId: invoice.id, invoiceNumber };
}
