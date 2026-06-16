"use server";

import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Creates an invoice from a completed sale.
 * Queries the sale and its items, then generates an invoice + invoice_items
 * with an auto-generated share token (acts as a receipt).
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
) {
  try {
    // Fetch sale details
    const { data: sale } = await supabase
      .from("sales")
      .select("total_amount, paid_amount")
      .eq("id", saleId)
      .single();

    if (!sale) {
      console.error("Invoice generation: sale not found", saleId);
      return null;
    }

    // Fetch sale items with product info
    const { data: items } = await supabase
      .from("sale_items")
      .select("product_id, quantity, unit_price, total_price, products(name)")
      .eq("sale_id", saleId);

    if (!items || items.length === 0) {
      console.error("Invoice generation: no sale items found", saleId);
      return null;
    }

    // Generate invoice number
    const { data: invNum } = await supabase.rpc("generate_invoice_number");
    const invoiceNumber = invNum as string;

    // Generate share token for public receipt access
    const token = randomBytes(32).toString("hex");

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        organization_id: organizationId,
        invoice_number: invoiceNumber,
        contact_id: contactId || null,
        sale_id: saleId,
        total_amount: sale.total_amount,
        paid_amount: sale.paid_amount ?? 0,
        status: "paid",
        token,
        created_by: userId,
      })
      .select("id")
      .single();

    if (invoiceError) {
      console.error("Invoice creation failed:", invoiceError.message);
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

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(invoiceItems);

    if (itemsError) {
      // Invoice exists but without items — partially bad state
      console.error("Invoice items creation failed:", itemsError.message);
    }

    return { invoiceId: invoice.id, invoiceNumber, token };
  } catch (err) {
    console.error("Unexpected error in createInvoiceFromSale:", err);
    return null;
  }
}
