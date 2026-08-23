import type { Queue } from "@cloudflare/workers-types";
import type { MetaEventEnvelope, MetaQueueMessage } from "./event-envelope";

export interface GatewayStoreEnv {
	GATEWAY_SUPABASE_URL: string;
	GATEWAY_SUPABASE_SECRET_KEY: string;
}

interface IngestResult {
	eventId: string;
	duplicate?: boolean;
}

function endpoint(env: GatewayStoreEnv, path: string): string {
	return `${env.GATEWAY_SUPABASE_URL.replace(/\/$/, "")}${path}`;
}

async function gatewayFetch(
	env: GatewayStoreEnv,
	path: string,
	init: RequestInit,
): Promise<Response> {
	return fetch(endpoint(env, path), {
		...init,
		headers: {
			apikey: env.GATEWAY_SUPABASE_SECRET_KEY,
			Authorization: `Bearer ${env.GATEWAY_SUPABASE_SECRET_KEY}`,
			"Accept-Profile": "gateway",
			"Content-Profile": "gateway",
			...(init.headers ?? {}),
		},
	});
}

export async function ingestMetaEvent(
	env: GatewayStoreEnv,
	event: MetaEventEnvelope,
): Promise<IngestResult> {
	const response = await gatewayFetch(env, "/rest/v1/rpc/ingest_meta_event", {
		method: "POST",
		body: JSON.stringify({
			p_provider: event.provider,
			p_provider_event_id: event.providerEventId,
			p_external_endpoint_id: event.externalEndpointId,
			p_payload: event.payload,
			p_trace_id: event.traceId,
		}),
		headers: { "content-type": "application/json" },
	});
	if (!response.ok) throw new Error(`gateway_ingest_${response.status}`);
	const value: unknown = await response.json();
	const row = Array.isArray(value) ? value[0] : value;
	if (typeof row === "string") return { eventId: row };
	if (
		!row ||
		typeof row !== "object" ||
		typeof (row as Record<string, unknown>).event_id !== "string"
	)
		throw new Error("gateway_ingest_invalid_response");
	return {
		eventId: (row as Record<string, unknown>).event_id as string,
		duplicate: (row as Record<string, unknown>).duplicate === true,
	};
}

export async function listExpiringInstallations(
	env: GatewayStoreEnv,
	now = new Date(),
): Promise<string[]> {
	const threshold = new Date(
		now.getTime() + 7 * 24 * 60 * 60 * 1000,
	).toISOString();
	const query = new URLSearchParams({
		select: "installation_id",
		expires_at: `lte.${threshold}`,
		status: "eq.active",
	});
	const response = await gatewayFetch(
		env,
		`/rest/v1/provider_credentials?${query}`,
		{ method: "GET" },
	);
	if (!response.ok) throw new Error(`gateway_credentials_${response.status}`);
	const value: unknown = await response.json();
	if (!Array.isArray(value)) return [];
	return [
		...new Set(
			value.flatMap((row) =>
				row &&
				typeof row === "object" &&
				typeof (row as Record<string, unknown>).installation_id === "string"
					? [(row as Record<string, unknown>).installation_id as string]
					: [],
			),
		),
	];
}

export async function enqueueOnlyIds(
	queue: Queue<MetaQueueMessage>,
	message: MetaQueueMessage,
): Promise<void> {
	await queue.send(message);
}

export async function consumeServiceNonce(
	env: GatewayStoreEnv,
	clientId: string,
	nonce: string,
	expiresAt: string,
): Promise<boolean> {
	const response = await gatewayFetch(
		env,
		"/rest/v1/rpc/consume_service_nonce",
		{
			method: "POST",
			body: JSON.stringify({
				p_client_id: clientId,
				p_nonce: nonce,
				p_expires_at: expiresAt,
			}),
			headers: { "content-type": "application/json" },
		},
	);
	if (!response.ok) throw new Error(`gateway_nonce_${response.status}`);
	const value: unknown = await response.json();
	const row = Array.isArray(value) ? value[0] : value;
	return (
		row === true ||
		(row !== null &&
			typeof row === "object" &&
			(row as Record<string, unknown>).accepted === true)
	);
}
