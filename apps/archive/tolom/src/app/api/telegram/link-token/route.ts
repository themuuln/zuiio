import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";

const AGENT_GATEWAY_URL =
  process.env.AGENT_GATEWAY_URL ?? "https://agent.zuiiotech.com";

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

  const payload = {
    orgId,
    userId: user.id,
    productType: "tolom" as const,
  };

  const gatewayHeaders = {
    "Content-Type": "application/json",
    "x-api-key": process.env.AGENT_GATEWAY_API_SECRET ?? "",
  };

  // Generate deep link and link code in parallel
  const [generateResult, codeResult] = await Promise.allSettled([
    fetch(`${AGENT_GATEWAY_URL}/api/link/generate`, {
      method: "POST",
      headers: gatewayHeaders,
      body: JSON.stringify(payload),
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Failed to generate link");
      }
      return json;
    }),
    fetch(`${AGENT_GATEWAY_URL}/api/link/code`, {
      method: "POST",
      headers: gatewayHeaders,
      body: JSON.stringify(payload),
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Failed to generate code");
      }
      return json;
    }),
  ]);

  // Deep link generation is required; code generation is optional
  if (generateResult.status === "rejected") {
    return apiError(
      "GATEWAY_ERROR",
      generateResult.reason?.message ?? "Failed to generate link",
      500,
    );
  }

  const json = generateResult.value;
  const codeJson = codeResult.status === "fulfilled" ? codeResult.value : null;

  return ok({
    token: json.token,
    expires_in_minutes: json.expiresInMinutes,
    bot_deep_link: json.telegramUrl,
    link_code: codeJson?.formatted ?? null,
    link_code_expires_in_minutes: codeJson?.expiresInMinutes ?? null,
  });
});
