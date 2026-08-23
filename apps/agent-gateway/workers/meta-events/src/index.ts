import type {
	ExportedHandler,
	MessageBatch,
	Queue,
	ScheduledController,
} from "@cloudflare/workers-types";
import { type MetaQueueMessage, splitMetaEvents } from "./event-envelope";
import {
	consumeServiceNonce,
	ingestMetaEvent,
	listExpiringInstallations,
} from "./gateway-store";
import {
	canonicalRequest,
	hmacHex,
	sha256Hex,
	signServiceRequest,
	verifyMetaSignature,
} from "./meta-signature";

interface Env {
	FB_APP_SECRET: string;
	FB_VERIFY_TOKEN: string;
	GATEWAY_SUPABASE_URL: string;
	GATEWAY_SUPABASE_SECRET_KEY: string;
	GATEWAY_INTERNAL_URL: string;
	GATEWAY_WORKER_SHARED_SECRET: string;
	META_EVENTS_QUEUE: Queue<MetaQueueMessage>;
}

interface QueueMessage<T> {
	body: T;
	attempts: number;
	ack(): void;
	retry(options?: { delaySeconds?: number }): void;
}

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});
}

function internalUrl(env: Env, path: string): string {
	return `${env.GATEWAY_INTERNAL_URL.replace(/\/$/, "")}${path}`;
}

function validTimestamp(value: string): boolean {
	const timestamp = Number(value);
	return (
		Number.isInteger(timestamp) &&
		Math.abs(Math.floor(Date.now() / 1000) - timestamp) <= 300
	);
}

async function verifySignedRequest(
	request: Request,
	rawBody: string,
	env: Env,
): Promise<boolean> {
	const clientId = request.headers.get("x-zuiio-client-id");
	const timestamp = request.headers.get("x-zuiio-timestamp");
	const nonce = request.headers.get("x-zuiio-nonce");
	const signature = request.headers.get("x-zuiio-signature");
	if (
		!clientId ||
		!timestamp ||
		!nonce ||
		!signature ||
		!validTimestamp(timestamp)
	)
		return false;
	const expected = await hmacHex(
		env.GATEWAY_WORKER_SHARED_SECRET,
		canonicalRequest(
			request.method,
			new URL(request.url).pathname,
			timestamp,
			nonce,
			await sha256Hex(rawBody),
		),
	);
	if (signature.length !== expected.length) return false;
	let difference = 0;
	for (let index = 0; index < expected.length; index += 1)
		difference |= signature.charCodeAt(index) ^ expected.charCodeAt(index);
	if (difference !== 0) return false;
	return consumeServiceNonce(
		env,
		clientId,
		nonce,
		new Date(Date.now() + 10 * 60 * 1000).toISOString(),
	);
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
	if (request.method === "GET") {
		const params = new URL(request.url).searchParams;
		if (params.get("hub.verify_token") !== env.FB_VERIFY_TOKEN)
			return new Response("Forbidden", { status: 403 });
		return new Response(params.get("hub.challenge") ?? "", { status: 200 });
	}
	if (request.method !== "POST")
		return new Response("Method Not Allowed", { status: 405 });
	const rawBody = await request.arrayBuffer();
	if (
		!(await verifyMetaSignature(
			rawBody,
			request.headers.get("x-hub-signature-256"),
			env.FB_APP_SECRET,
		))
	)
		return new Response("Invalid signature", { status: 401 });
	let payload: unknown;
	try {
		payload = JSON.parse(new TextDecoder().decode(rawBody));
	} catch {
		return new Response("Malformed payload", { status: 400 });
	}
	const events = await splitMetaEvents(payload);
	if (events.length === 0)
		return new Response("EVENT_RECEIVED", { status: 200 });
	try {
		for (const event of events) {
			const stored = await ingestMetaEvent(env, event);
			await env.META_EVENTS_QUEUE.send({
				kind: "process_inbound_event",
				eventId: stored.eventId,
				traceId: event.traceId,
			});
		}
	} catch {
		return new Response("Temporary failure", { status: 503 });
	}
	return new Response("EVENT_RECEIVED", { status: 200 });
}

function isQueueMessage(value: unknown): value is MetaQueueMessage {
	if (!value || typeof value !== "object") return false;
	const body = value as Record<string, unknown>;
	if (typeof body.kind !== "string" || typeof body.traceId !== "string")
		return false;
	if (
		(body.kind === "process_inbound_event" ||
			body.kind === "replay_inbound_event") &&
		typeof body.eventId === "string"
	)
		return true;
	return (
		(body.kind === "provision_meta_installation" ||
			body.kind === "refresh_meta_installation") &&
		typeof body.installationId === "string"
	);
}

async function processQueueMessage(
	message: QueueMessage<MetaQueueMessage>,
	env: Env,
): Promise<void> {
	if (!isQueueMessage(message.body)) {
		message.ack();
		return;
	}
	const body = JSON.stringify(message.body);
	const headers = await signServiceRequest(
		"POST",
		"/api/internal/v1/jobs/process",
		body,
		"meta-events-worker",
		env.GATEWAY_WORKER_SHARED_SECRET,
	);
	let response: Response;
	try {
		response = await fetch(internalUrl(env, "/api/internal/v1/jobs/process"), {
			method: "POST",
			headers,
			body,
			signal: AbortSignal.timeout(50_000),
		});
	} catch {
		message.retry({
			delaySeconds: Math.min(30 * 2 ** Math.max(0, message.attempts - 1), 900),
		});
		return;
	}
	if (response.status === 204 || response.status === 422) {
		message.ack();
		return;
	}
	if (response.status === 409) {
		message.retry({ delaySeconds: 10 });
		return;
	}
	if (response.status >= 500) {
		message.retry({
			delaySeconds: Math.min(30 * 2 ** Math.max(0, message.attempts - 1), 900),
		});
		return;
	}
	message.ack();
}

async function handleInternalEnqueue(
	request: Request,
	env: Env,
): Promise<Response> {
	const rawBody = await request.text();
	if (!(await verifySignedRequest(request, rawBody, env)))
		return json(
			{
				error: {
					code: "INVALID_SIGNATURE",
					message: "Request signature is invalid",
				},
			},
			401,
		);
	let body: unknown;
	try {
		body = JSON.parse(rawBody);
	} catch {
		return json(
			{
				error: { code: "MALFORMED_BODY", message: "Request body is malformed" },
			},
			400,
		);
	}
	if (!isQueueMessage(body))
		return json(
			{
				error: {
					code: "INVALID_QUEUE_MESSAGE",
					message: "Queue message is invalid",
				},
			},
			400,
		);
	try {
		await env.META_EVENTS_QUEUE.send(body);
	} catch {
		return json(
			{
				error: {
					code: "QUEUE_UNAVAILABLE",
					message: "Queue is temporarily unavailable",
				},
			},
			503,
		);
	}
	return new Response(null, { status: 204 });
}

async function handleScheduled(
	_controller: ScheduledController,
	env: Env,
): Promise<void> {
	const installationIds = await listExpiringInstallations(env);
	await Promise.all(
		installationIds.map((installationId) =>
			env.META_EVENTS_QUEUE.send({
				kind: "refresh_meta_installation",
				installationId,
				traceId: crypto.randomUUID(),
			}),
		),
	);
}

const worker: ExportedHandler<Env> = {
	async fetch(request, env) {
		const pathname = new URL(request.url).pathname;
		if (
			pathname === "/api/facebook/webhook" ||
			pathname === "/api/facebook/webhook/"
		)
			return handleWebhook(request, env);
		if (pathname === "/internal/enqueue" && request.method === "POST")
			return handleInternalEnqueue(request, env);
		return new Response("Not Found", { status: 404 });
	},
	async queue(batch, env) {
		for (const message of batch.messages) {
			await processQueueMessage(
				message as unknown as QueueMessage<MetaQueueMessage>,
				env,
			);
		}
	},
	async scheduled(controller, env) {
		await handleScheduled(controller, env);
	},
};

export default worker;
