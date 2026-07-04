"use server";

import { randomBytes } from "node:crypto";
import { requireActionContext } from "@/lib/action-utils";
import { capture } from "@zuiio/capture";

export type ShareLinkState = {
  token?: string;
  error?: string;
};

export async function createShareLink(
  _prevState: ShareLinkState | undefined,
  formData: FormData,
): Promise<ShareLinkState> {
  const ctx = await requireActionContext("reports.manage");
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, organizationId } = ctx;

  const dateFrom = formData.get("date_from") as string;
  const dateTo = formData.get("date_to") as string;

  if (!dateFrom || !dateTo) {
    return { error: "Огнооны хүрээ олдсонгүй." };
  }

  // Generate cryptographically random 32-byte hex token
  const token = randomBytes(32).toString("hex");

  // Upsert: one share link per organization + date range
  const { data: existing } = await supabase
    .from("shared_reports")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("date_from", dateFrom)
    .eq("date_to", dateTo)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("shared_reports")
      .update({ token })
      .eq("id", existing.id);

    if (updateError) {
      return { error: "Хуваалцах холбоос шинэчлэхэд алдаа гарлаа." };
    }
  } else {
    const { error: insertError } = await supabase
      .from("shared_reports")
      .insert({
        organization_id: organizationId,
        token,
        date_from: dateFrom,
        date_to: dateTo,
      });

    if (insertError) {
      return { error: "Хуваалцах холбоос үүсгэхэд алдаа гарлаа." };
    }
  }

  return { token };
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
