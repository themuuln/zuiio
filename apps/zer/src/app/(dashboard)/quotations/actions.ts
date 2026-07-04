"use server";

import { capture } from "@zuiio/capture";
import { requireWriteAction } from "@/lib/action-utils";
import { logAuditEventWithClient } from "@/lib/audit";
import { withBranchFilter } from "@/lib/branches";
import { createInvoiceFromSale } from "@/lib/invoicing";
import { revalidateEntities } from "@/lib/revalidate";
import { getString } from "@/lib/validation";

export async function createQuotation(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("quotations.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId } = ctx;

  const contactId = getString(formData, "contact_id");
  const issueDate = getString(formData, "issue_date");
  const expiryDate = getString(formData, "expiry_date");
  const notes = getString(formData, "notes");
  const itemsJson = getString(formData, "items");

  if (!itemsJson) {
    return { error: "Барааны мэдээлэл шаардлагатай." };
  }

  let items: Array<{
    product_id: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    variant_id?: string;
  }>;
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: "Барааны мэдээллийн формат буруу байна." };
  }

  if (items.length === 0) {
    return { error: "Дор хаяж нэг бараа оруулна уу." };
  }

  // Generate quote number
  const { data: quoteNum } = await supabase.rpc("generate_quote_number");
  const quoteNumber = quoteNum as string;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );

  // Insert quotation
  const { data: quotation, error: quotationError } = await supabase
    .from("quotations")
    .insert({
      organization_id: organizationId,
      branch_id: branchId!,
      contact_id: contactId || null,
      quote_number: quoteNumber,
      issue_date: issueDate || new Date().toISOString().slice(0, 10),
      expiry_date: expiryDate || null,
      total_amount: totalAmount,
      notes: notes || null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (quotationError) {
    return {
      error: `Үнийн санал үүсгэхэд алдаа гарлаа: ${quotationError.message}`,
    };
  }

  // Insert quotation items
  const quotationItems = items.map((item) => ({
    quotation_id: quotation.id,
    product_id: item.product_id || null,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    variant_id: item.variant_id ?? null,
  }));

  const { error: itemsError } = await supabase
    .from("quotation_items")
    .insert(quotationItems);

  if (itemsError) {
    // Rollback the quotation
    await supabase.from("quotations").delete().eq("id", quotation.id);
    return {
      error: `Барааны мэдээлэл хадгалахад алдаа гарлаа: ${itemsError.message}`,
    };
  }

  await logAuditEventWithClient(
    supabase,
    organizationId,
    userId,
    "created",
    "sale",
    quotation.id,
    undefined,
    `Үнийн санал ${quoteNumber} үүсгэсэн`,
  );

  revalidateEntities(["quotations"]);
  return { success: true as const, error: undefined };
}

export async function updateQuotationStatus(
  quotationId: string,
  status: string,
) {
  const ctx = await requireWriteAction("quotations.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId, isBranchScoped } = ctx;

  let fetchQuery = supabase
    .from("quotations")
    .select("status, quote_number")
    .eq("id", quotationId)
    .eq("organization_id", organizationId);

  fetchQuery = withBranchFilter(fetchQuery, branchId, isBranchScoped);

  const { data: quotation } = await fetchQuery.single();

  if (!quotation) {
    return { error: "Үнийн санал олдсонгүй." };
  }

  let updateQuery = supabase
    .from("quotations")
    .update({ status })
    .eq("id", quotationId)
    .eq("organization_id", organizationId);

  updateQuery = withBranchFilter(updateQuery, branchId, isBranchScoped);

  const { error } = await updateQuery;

  if (error) {
    return {
      error: `Төлөв шинэчлэхэд алдаа гарлаа: ${error.message}`,
    };
  }

  await logAuditEventWithClient(
    supabase,
    organizationId,
    userId,
    "status_changed",
    "sale",
    quotationId,
    { status: { old: quotation.status, new: status } },
    `Үнийн саналын төлөв "${quotation.status}" → "${status}" болж өөрчлөгдсөн`,
  );

  revalidateEntities(["quotations"]);
  return { success: true as const, error: undefined };
}

export async function convertQuotationToSale(quotationId: string) {
  const ctx = await requireWriteAction("quotations.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId, isBranchScoped } = ctx;

  // Fetch the quotation with items
  let fetchQuery = supabase
    .from("quotations")
    .select("*")
    .eq("id", quotationId)
    .eq("organization_id", organizationId);

  fetchQuery = withBranchFilter(fetchQuery, branchId, isBranchScoped);

  const { data: quotation, error: quotationError } = await fetchQuery.single();

  if (quotationError || !quotation) {
    return { error: "Үнийн санал олдсонгүй." };
  }

  if (quotation.status === "converted") {
    return { error: "Энэ үнийн санал аль хэдийн борлуулалт болсон." };
  }

  const { data: items, error: itemsError } = await supabase
    .from("quotation_items")
    .select("*")
    .eq("quotation_id", quotationId);

  if (itemsError || !items || items.length === 0) {
    return { error: "Үнийн саналд бараа байхгүй байна." };
  }

  const totalAmount = quotation.total_amount;

  // Create the sale
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      organization_id: organizationId,
      branch_id: branchId!,
      contact_id: quotation.contact_id,
      sale_date: new Date().toISOString().slice(0, 10),
      total_amount: totalAmount,
      paid_amount: 0,
      payment_method: "invoice",
      status: "pending",
      notes: quotation.notes
        ? `Үнийн саналаас (${quotation.quote_number}): ${quotation.notes}`
        : `Үнийн саналаас (${quotation.quote_number})`,
      created_by: userId,
    })
    .select("id")
    .single();

  if (saleError) {
    return {
      error: `Борлуулалт үүсгэхэд алдаа гарлаа: ${saleError.message}`,
    };
  }

  const saleId = sale.id;

  // Create sale_items from quotation items
  const saleItems = items.map((item) => ({
    sale_id: saleId,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
  }));

  const { error: saleItemsError } = await supabase
    .from("sale_items")
    .insert(saleItems);

  if (saleItemsError) {
    // Rollback
    await supabase.from("sales").delete().eq("id", saleId);
    return {
      error: `Борлуулалтын бараа хадгалахад алдаа гарлаа: ${saleItemsError.message}`,
    };
  }

  // Create stock movements and update product stock for each item
  for (const item of items) {
    if (!item.product_id) continue;

    // Create stock movement
    const { error: movementError } = await supabase
      .from("stock_movements")
      .insert({
        organization_id: organizationId,
        branch_id: branchId!,
        product_id: item.product_id,
        type: "out",
        quantity: item.quantity,
        unit_cost: item.unit_price,
        reference: `sale:${saleId}`,
        created_by: userId,
      });

    if (movementError) {
      capture(movementError, { context: "quotations: stock movement" });
      // Continue despite stock movement error — sale is already committed
      continue;
    }

    // Update product stock
    const { data: product } = await supabase
      .from("products")
      .select("current_stock")
      .eq("id", item.product_id)
      .single();

    if (product) {
      await supabase
        .from("products")
        .update({
          current_stock: Math.max(
            0,
            Number(product.current_stock ?? 0) - item.quantity,
          ),
        })
        .eq("id", item.product_id)
        .gte("current_stock", item.quantity);
    }
  }

  // Update quotation status to 'converted' and set converted_to_sale_id
  const { error: updateError } = await supabase
    .from("quotations")
    .update({
      status: "converted",
      converted_to_sale_id: saleId,
    })
    .eq("id", quotationId)
    .eq("organization_id", organizationId);

  if (updateError) {
    capture(updateError, { context: "quotations: update status" });
  }

  // Create invoice from the sale
  await createInvoiceFromSale(
    supabase,
    organizationId,
    userId,
    saleId,
    quotation.contact_id,
    branchId!,
  );

  await logAuditEventWithClient(
    supabase,
    organizationId,
    userId,
    "created",
    "sale",
    saleId,
    undefined,
    `Үнийн саналаас (${quotation.quote_number}) борлуулалт үүсгэсэн`,
  );

  revalidateEntities(["quotations", "sales", "invoices", "inventory"]);
  return { success: true as const, error: undefined, saleId };
}
