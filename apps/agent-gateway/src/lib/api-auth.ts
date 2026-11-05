import "server-only";

import { env } from "./env";

const GATEWAY_API_SECRET = "AGENT_GATEWAY_API_SECRET";
const ZER_API_SECRET = "ZER_API_SECRET";

function isApiKeyValid(request: Request, secretName: string): boolean {
	const configured = env(secretName);
	if (!configured) return false;

	const provided = request.headers.get("x-api-key") ?? "";
	if (!provided) return false;

	return provided === configured;
}

/**
 * Server-to-server auth for legacy and Tolom gateway management APIs.
 *
 * Fail-closed: if the secret is not configured, requests are rejected.
 */
export function isGatewayApiKeyValid(request: Request): boolean {
	return isApiKeyValid(request, GATEWAY_API_SECRET);
}

/**
 * Server-to-server auth for Zer-specific gateway APIs.
 */
export function isZerApiKeyValid(request: Request): boolean {
	return isApiKeyValid(request, ZER_API_SECRET);
}

/**
 * Reads the shared secret from the environment (for docs/validation only).
 */
export function hasGatewayApiSecret(): boolean {
	return Boolean(env(GATEWAY_API_SECRET));
}
