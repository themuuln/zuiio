import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";

export { dynamic } from "@/lib/api-handler";

const AGENT_GATEWAY_URL =
  process.env.AGENT_GATEWAY_URL ?? "https://agent-gateway-delta.vercel.app";

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

  // Generate a compact token via the agent-gateway
  const res = await fetch(`${AGENT_GATEWAY_URL}/api/link/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orgId,
      userId: user.id,
      productType: "tolom",
    }),
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    return apiError(
      "GATEWAY_ERROR",
      json.error ?? "Failed to generate link",
      500,
    );
  }

  return ok({
    token: json.token,
    expires_in_minutes: json.expiresInMinutes,
    bot_deep_link: json.telegramUrl,
  });
});
