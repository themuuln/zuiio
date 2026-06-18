"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEventWithClient } from "@/lib/audit";
import { withBranchFilter } from "@/lib/branches";
import { checkPermission, requireAppContext } from "@/lib/erp";
import { getString, normalizePhone } from "@/lib/validation";

export type InvoiceShareState = {
  token?: string;
  error?: string;
};

export async function createInvoice(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const {
    supabase,
    organizationId,
    userId,
    branchId,
    isBranchScoped,
    permissions,
  } = await requireAppContext();
  const permError = checkPermission(permissions, "invoices.create");
  if (permError) return { error: permError };

  // Scoped users must have a branch
  if (isBranchScoped && !branchId) {
    return { error: "Салбар тодорхойгүй байна." };
  }

  let contactId = formData.get("contact_id") as string;
  const newContactName = getString(formData, "new_contact_name");
  const issueDate = formData.get("issue_date") as string;
  const dueDate = formData.get("due_date") as string;
  const notes = formData.get("notes") as string;
  const itemsJson = formData.get("items") as string;

  // Create contact on-the-fly if new_contact_name is provided
  if (newContactName && !contactId) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("type", "customer")
      .eq("name", newContactName)
      .maybeSingle();

    if (existing) {
      contactId = existing.id;
    } else {
      const phone = normalizePhone(getString(formData, "new_contact_phone"));
      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          organization_id: organizationId,
          type: "customer",
          name: newContactName,
          phone: phone || null,
        })
        .select("id")
        .single();

      if (contactError) {
        return {
          error: `Харилцагч үүсгэхэд алдаа гарлаа: ${contactError.message}`,
        };
      }
      contactId = newContact.id;
    }
  }

  if (!itemsJson) {
    return { error: "Барааны мэдээлэл шаардлагатай." };
  }

  const items = JSON.parse(itemsJson) as Array<{
    product_id: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    variant_id?: string;
  }>;

  if (items.length === 0) {
    return { error: "Дор хаяж нэг бараа оруулна уу." };
  }

  // Generate invoice number
  const { data: invNum } = await supabase.rpc("generate_invoice_number");
  const invoiceNumber = invNum as string;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      organization_id: organizationId,
      branch_id: branchId!,
      invoice_number: invoiceNumber,
      contact_id: contactId || null,
      issue_date: issueDate || new Date().toISOString().slice(0, 10),
      due_date: dueDate || null,
      total_amount: totalAmount,
      paid_amount: 0,
      status: "pending",
      notes: notes || null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (invoiceError) {
    return {
      error: `Нэхэмжлэл үүсгэхэд алдаа гарлаа: ${invoiceError.message}`,
    };
  }

  // Insert invoice items
  const invoiceItems = items.map((item) => ({
    invoice_id: invoice.id,
    product_id: item.product_id || null,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
    variant_id: item.variant_id ?? null,
  }));

  const { error: itemsError } = await supabase
    .from("invoice_items")
    .insert(invoiceItems);

  if (itemsError) {
    return {
      error: `Барааны мэдээлэл хадгалахад алдаа гарлаа: ${itemsError.message}`,
    };
  }

  await logAuditEventWithClient(
    supabase,
    organizationId,
    userId,
    "created",
    "invoice",
    invoice.id,
    undefined,
    `Нэхэмжлэл ${invoiceNumber} үүсгэсэн`,
  );

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

export async function createInvoiceShareLink(
  _prevState: InvoiceShareState | undefined,
  formData: FormData,
): Promise<InvoiceShareState> {
  const {
    supabase,
    organizationId,
    userId,
    branchId,
    isBranchScoped,
    permissions,
  } = await requireAppContext();
  const permError = checkPermission(permissions, "invoices.update");
  if (permError) return { error: permError };

  const invoiceId = formData.get("invoice_id") as string;
  if (!invoiceId) {
    return { error: "Нэхэмжлэлийн ID олдсонгүй." };
  }

  const token = randomBytes(32).toString("hex");

  let updateQuery = supabase
    .from("invoices")
    .update({ token, created_by: userId })
    .eq("id", invoiceId)
    .eq("organization_id", organizationId);

  updateQuery = withBranchFilter(updateQuery, branchId, isBranchScoped);

  const { error: updateError } = await updateQuery;

  if (updateError) {
    return {
      error: `Хуваалцах холбоос үүсгэхэд алдаа гарлаа: ${updateError.message}`,
    };
  }

  await logAuditEventWithClient(
    supabase,
    organizationId,
    userId,
    "shared",
    "invoice",
    invoiceId,
    undefined,
    "Нэхэмжлэлийн хуваалцах холбоос үүсгэсэн",
  );

  return { token };
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const {
    supabase,
    organizationId,
    userId,
    branchId,
    isBranchScoped,
    permissions,
  } = await requireAppContext();
  const permError = checkPermission(permissions, "invoices.update");
  if (permError) return { error: permError };

  let fetchQuery = supabase
    .from("invoices")
    .select("status")
    .eq("id", invoiceId)
    .eq("organization_id", organizationId);

  fetchQuery = withBranchFilter(fetchQuery, branchId, isBranchScoped);

  const { data: invoice } = await fetchQuery.single();

  if (!invoice) {
    return { error: "Нэхэмжлэл олдсонгүй." };
  }

  let updateQuery = supabase
    .from("invoices")
    .update({ status })
    .eq("id", invoiceId)
    .eq("organization_id", organizationId);

  updateQuery = withBranchFilter(updateQuery, branchId, isBranchScoped);

  const { error } = await updateQuery;

  if (error) {
    return { error: `Төлөв шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  await logAuditEventWithClient(
    supabase,
    organizationId,
    userId,
    "status_changed",
    "invoice",
    invoiceId,
    { status: { old: invoice.status, new: status } },
    `Нэхэмжлэлийн төлөв "${invoice.status}" → "${status}" болж өөрчлөгдсөн`,
  );

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  return { success: true as const };
}
