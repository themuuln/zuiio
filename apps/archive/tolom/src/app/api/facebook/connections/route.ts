import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";

const AGENT_GATEWAY_URL =
  process.env.AGENT_GATEWAY_URL ?? "https://agent.zuiiotech.com";

/**
 * GET /api/facebook/connections
 *
 * Lists the org's active Messenger/Instagram page connections by proxying
 * the gateway's org-scoped endpoint. Returns safe fields only — never the
 * page access token.
 */
export const GET = createSimpleRouteHandler(async ({ user, supabase }) => {
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

  const response = await fetch(
    `${AGENT_GATEWAY_URL}/api/facebook/connections?orgId=${encodeURIComponent(orgId)}`,
    {
      headers: {
        "x-api-key": process.env.AGENT_GATEWAY_API_SECRET ?? "",
      },
      cache: "no-store",
    },
  );
  const json = (await response.json()) as {
    connections?: Array<{
      channel: string;
      pageId: string;
      pageName: string | null;
      connectedAt: string | null;
      webhookSubscribedAt: string | null;
      tokenExpiresAt: string | null;
    }>;
    error?: string;
  };
  if (!response.ok) {
    return apiError(
      "GATEWAY_ERROR",
      json.error ?? "Failed to fetch connections",
      500,
    );
  }

  return ok({ connections: json.connections ?? [] });
});
