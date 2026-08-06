import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";

const AGENT_GATEWAY_URL =
  process.env.AGENT_GATEWAY_URL ?? "https://agent.zuiiotech.com";

/**
 * POST /api/facebook/connect
 *
 * Starts the Facebook/Instagram page-connect OAuth flow:
 * 1. Mints a compact link token from the gateway (/api/link/generate)
 * 2. Asks the gateway to build the verified OAuth dialog URL
 *    (/api/facebook/start — orgId/productType come from the HMAC token,
 *    never from the client)
 *
 * Returns { redirectUrl } — the client must navigate there (full page
 * navigation, the OAuth state cookie lives on the gateway origin).
 */
export const POST = createSimpleRouteHandler(async ({ user, supabase }) => {
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
  const gatewayHeaders = {
    "Content-Type": "application/json",
    "x-api-key": process.env.AGENT_GATEWAY_API_SECRET ?? "",
  };

  // 1. Compact link token
  const generateResponse = await fetch(
    `${AGENT_GATEWAY_URL}/api/link/generate`,
    {
      method: "POST",
      headers: gatewayHeaders,
      body: JSON.stringify({ orgId, userId: user.id, productType: "tolom" }),
    },
  );
  const generateJson = (await generateResponse.json()) as {
    token?: string;
    error?: string;
  };
  if (!generateResponse.ok || !generateJson.token) {
    return apiError(
      "GATEWAY_ERROR",
      generateJson.error ?? "Failed to generate link token",
      500,
    );
  }

  // 2. Verified OAuth dialog URL
  const startResponse = await fetch(`${AGENT_GATEWAY_URL}/api/facebook/start`, {
    method: "POST",
    headers: gatewayHeaders,
    body: JSON.stringify({ token: generateJson.token }),
  });
  const startJson = (await startResponse.json()) as {
    redirectUrl?: string;
    error?: string;
  };
  if (!startResponse.ok || !startJson.redirectUrl) {
    return apiError(
      "GATEWAY_ERROR",
      startJson.error ?? "Failed to start Facebook OAuth",
      500,
    );
  }

  return ok({ redirectUrl: startJson.redirectUrl });
});
