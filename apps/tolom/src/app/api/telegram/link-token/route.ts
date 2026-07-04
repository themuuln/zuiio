import crypto from "node:crypto";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";
import { ok, apiError } from "@/lib/api-response";

const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? "tolom_bot";

export const POST = createSimpleRouteHandler(async ({ user, supabase }) => {
  // Get user's organization
  const { data: membership } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .is("removed_at", null)
    .maybeSingle();

  if (!membership) {
    throw new NotFoundError("You are not a member of any organization");
  }

  const orgId = membership.organization_id;

  // Generate a secure random token
  const rawToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Store the hash with 15-minute expiry
  const { error } = await supabase.from("telegram_link_tokens").insert({
    organization_id: orgId,
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });

  if (error) {
    return apiError("DB_ERROR", "Failed to generate link token", 500);
  }

  return ok({
    token: rawToken,
    expires_in_minutes: 15,
    bot_deep_link: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${rawToken}`,
  });
});
