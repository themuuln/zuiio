import "server-only";

import { env } from "./env";

const GATEWAY_API_SECRET = "AGENT_GATEWAY_API_SECRET";

/**
 * Server-to-server auth for gateway management APIs.
 *
 * Product apps (Zer/Tolom) call /api/link/* with `x-api-key: <secret>`.
 * The secret is shared via the `AGENT_GATEWAY_API_SECRET` env var on both sides.
 * Fail-closed: if the secret is not configured, requests are rejected.
 */
export function isGatewayApiKeyValid(request: Request): boolean {
	const configured = env(GATEWAY_API_SECRET);
	if (!configured) return false;

	const provided = request.headers.get("x-api-key") ?? "";
	if (!provided) return false;

	return provided === configured;
}

/**
 * Reads the shared secret from the environment (for docs/validation only).
 */
export function hasGatewayApiSecret(): boolean {
	return Boolean(env(GATEWAY_API_SECRET));
}
