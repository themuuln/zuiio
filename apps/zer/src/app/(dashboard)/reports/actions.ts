"use server";

import { capture } from "@zuiio/capture";
import { requireActionContext } from "@/lib/action-utils";
import {
  defaultExpiryDate,
  generateToken,
  hashToken,
} from "@/lib/public-share-token";

export type ShareLinkState = {
  token?: string;
  error?: string;
  success?: boolean;
};

export async function createShareLink(
  _prevState: ShareLinkState | undefined,
  formData: FormData,
): Promise<ShareLinkState> {
  const ctx = await requireActionContext("reports.manage");
  if ("error" in ctx) {
    capture(ctx.error, { context: "reports: createShareLink context" });
    return { error: ctx.error };
  }
  const { supabase, organizationId } = ctx;

  const dateFrom = formData.get("date_from") as string;
  const dateTo = formData.get("date_to") as string;

  if (!dateFrom || !dateTo) {
    return { error: "Огнооны хүрээ олдсонгүй." };
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = defaultExpiryDate("report").toISOString();

  // Upsert: one share link per organization + date range
  const { data: existing, error: existingError } = await supabase
    .from("shared_reports")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("date_from", dateFrom)
    .eq("date_to", dateTo)
    .maybeSingle();

  if (existingError) {
    capture(existingError, { context: "reports: fetch existing share link" });
  }
  if (existing) {
    const { error: updateError } = await supabase
      .from("shared_reports")
      .update({ token_hash: tokenHash, expires_at: expiresAt })
      .eq("id", existing.id);

    if (updateError) {
      return { error: "Хуваалцах холбоос шинэчлэхэд алдаа гарлаа." };
    }
  } else {
    const { error: insertError } = await supabase
      .from("shared_reports")
      .insert({
        organization_id: organizationId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        date_from: dateFrom,
        date_to: dateTo,
      });

    if (insertError) {
      return { error: "Хуваалцах холбоос үүсгэхэд алдаа гарлаа." };
    }
  }

  return { token: rawToken, success: true };
}
export async function rotateShareLink(
  _prevState: ShareLinkState | undefined,
  formData: FormData,
): Promise<ShareLinkState> {
  const ctx = await requireActionContext("reports.manage");
  if ("error" in ctx) {
    capture(ctx.error, { context: "reports: rotateShareLink context" });
    return { error: ctx.error };
  }
  const { supabase, organizationId } = ctx;

  const shareId = formData.get("share_id") as string;
  if (!shareId) {
    return { error: "Хуваалцах холбоосны ID олдсонгүй." };
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  const { error: updateError } = await supabase
    .from("shared_reports")
    .update({
      token_hash: tokenHash,
      rotated_at: new Date().toISOString(),
    })
    .eq("id", shareId)
    .eq("organization_id", organizationId);

  if (updateError) {
    return { error: "Хуваалцах холбоос шинэчлэхэд алдаа гарлаа." };
  }

  return { token: rawToken, success: true };
}

export async function revokeShareLink(
  _prevState: ShareLinkState | undefined,
  formData: FormData,
): Promise<ShareLinkState> {
  const ctx = await requireActionContext("reports.manage");
  if ("error" in ctx) {
    capture(ctx.error, { context: "reports: revokeShareLink context" });
    return { error: ctx.error };
  }
  const { supabase, organizationId } = ctx;

  const shareId = formData.get("share_id") as string;
  if (!shareId) {
    return { error: "Хуваалцах холбоосны ID олдсонгүй." };
  }

  const { error: updateError } = await supabase
    .from("shared_reports")
    .update({
      revoked_at: new Date().toISOString(),
    })
    .eq("id", shareId)
    .eq("organization_id", organizationId);

  if (updateError) {
    return { error: "Хуваалцах холбоос цуцлахад алдаа гарлаа." };
  }

  return { success: true };
}

export async function deleteShareLink(shareId: string) {
  const ctx = await requireActionContext("reports.manage");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { error } = await supabase
    .from("shared_reports")
    .delete()
    .eq("id", shareId)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "reports: delete share link" });
  }
}
