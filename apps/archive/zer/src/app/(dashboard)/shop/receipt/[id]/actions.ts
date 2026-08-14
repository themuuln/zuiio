"use server";

import { capture } from "@zuiio/capture";
import { requireWriteAction } from "@/lib/action-utils";
import {
  defaultExpiryDate,
  generateToken,
  hashToken,
} from "@/lib/public-share-token";

export type ReceiptShareState = {
  token?: string;
  error?: string;
  success?: boolean;
};

export async function createReceiptShareLink(
  _prevState: ReceiptShareState | undefined,
  formData: FormData,
): Promise<ReceiptShareState> {
  const ctx = await requireWriteAction("invoices.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const invoiceId = formData.get("invoice_id") as string;
  if (!invoiceId) {
    return { error: "Баримтын ID олдсонгүй." };
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  const { error } = await supabase
    .from("invoices")
    .update({
      receipt_token_hash: tokenHash,
      receipt_expires_at: defaultExpiryDate("receipt").toISOString(),
      is_receipt: true,
      created_by: userId,
    })
    .eq("id", invoiceId)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "createReceiptShareLink" });
    return {
      error: `Хуваалцах холбоос үүсгэхэд алдаа гарлаа: ${error.message}`,
    };
  }

  return { token: rawToken, success: true };
}

export async function rotateReceiptShareLink(
  _prevState: ReceiptShareState | undefined,
  formData: FormData,
): Promise<ReceiptShareState> {
  const ctx = await requireWriteAction("invoices.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const invoiceId = formData.get("invoice_id") as string;
  if (!invoiceId) {
    return { error: "Баримтын ID олдсонгүй." };
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  const { error } = await supabase
    .from("invoices")
    .update({
      receipt_token_hash: tokenHash,
      rotated_at: new Date().toISOString(),
      created_by: userId,
    })
    .eq("id", invoiceId)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "rotateReceiptShareLink" });
    return { error: `Холбоос шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  return { token: rawToken, success: true };
}

export async function revokeReceiptShareLink(
  _prevState: ReceiptShareState | undefined,
  formData: FormData,
): Promise<ReceiptShareState> {
  const ctx = await requireWriteAction("invoices.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const invoiceId = formData.get("invoice_id") as string;
  if (!invoiceId) {
    return { error: "Баримтын ID олдсонгүй." };
  }

  const { error } = await supabase
    .from("invoices")
    .update({ receipt_revoked_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "revokeReceiptShareLink" });
    return { error: `Холбоос цуцлахад алдаа гарлаа: ${error.message}` };
  }

  return { success: true };
}
