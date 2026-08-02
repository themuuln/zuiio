"use server";

import { requireActionContext } from "@/lib/action-utils";
import { revokeToken, tokenForOrg } from "@/lib/embed";
import { revalidateEntity } from "@/lib/revalidate";

export type CreateEmbedTokenState =
  | {
      token?: string;
      error?: string;
    }
  | undefined;

export type RevokeEmbedTokenState =
  | {
      success?: boolean;
      error?: string;
    }
  | undefined;

/** Create an embed token. Returns the raw token exactly once. */
export async function createEmbedToken(
  _prevState: CreateEmbedTokenState,
  formData: FormData,
): Promise<CreateEmbedTokenState> {
  const ctx = await requireActionContext("reports.manage");
  if ("error" in ctx) return ctx;

  const label = (formData.get("label") as string)?.trim() ?? "";
  if (!label) return { error: "Нэр шаардлагатай." };

  const rawDays = formData.get("expiry_days") as string;
  const days = Number.parseInt(rawDays ?? "", 10);
  const expiresInDays = Number.isFinite(days) && days > 0 ? days : 30;

  const result = await tokenForOrg(ctx.supabase, ctx.organizationId, label, {
    createdBy: ctx.userId,
    expiresInDays,
  });
  if ("error" in result) return result;

  revalidateEntity("embed");
  return { token: result.token };
}

/** Soft-revoke an embed token so its iframes stop loading. */
export async function revokeEmbedToken(
  tokenId: string,
): Promise<RevokeEmbedTokenState> {
  const ctx = await requireActionContext("reports.manage");
  if ("error" in ctx) return ctx;

  const result = await revokeToken(ctx.supabase, ctx.organizationId, tokenId);
  if ("error" in result) return result;

  revalidateEntity("embed");
  return { success: true };
}
