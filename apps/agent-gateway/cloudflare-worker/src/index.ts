/**
 * Cloudflare Worker — Telegram Webhook Proxy
 *
 * Receives Telegram webhooks, stores them in Supabase,
 * and forwards to your MacBook. Zero message loss.
 */

import { type CodexEnv, handleCodexRequest, type KvNamespace } from "./codex";

interface Env {
	SUPABASE_URL: string;
	SUPABASE_SERVICE_ROLE_KEY: string;
	MACBOOK_TUNNEL_URL: string;
	CODEX_KV?: KvNamespace;
	CODEX_REFRESH_TOKEN?: string;
	CODEX_ACCOUNT_ID?: string;
	CODEX_CLIENT_ID?: string;
	CODEX_BASE_URL?: string;
	CODEX_PROXY_API_KEY?: string;
}

function getCodexEnv(env: Env): CodexEnv | null {
	if (
		!env.CODEX_KV ||
		!env.CODEX_REFRESH_TOKEN ||
		!env.CODEX_ACCOUNT_ID ||
		!env.CODEX_CLIENT_ID ||
		!env.CODEX_PROXY_API_KEY
	) {
		return null;
	}
	return {
		CODEX_KV: env.CODEX_KV,
		CODEX_REFRESH_TOKEN: env.CODEX_REFRESH_TOKEN,
		CODEX_ACCOUNT_ID: env.CODEX_ACCOUNT_ID,
		CODEX_CLIENT_ID: env.CODEX_CLIENT_ID,
		CODEX_BASE_URL: env.CODEX_BASE_URL,
		CODEX_PROXY_API_KEY: env.CODEX_PROXY_API_KEY,
	};
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname.startsWith("/codex/")) {
			const codexEnv = getCodexEnv(env);
			if (!codexEnv) {
				return new Response("Codex proxy is not configured", { status: 503 });
			}
			return handleCodexRequest(request, codexEnv);
		}

		// Health check
		if (url.pathname === "/health") {
			return new Response(JSON.stringify({ status: "ok" }), {
				headers: { "Content-Type": "application/json" },
			});
		}

		// Telegram webhook
		if (url.pathname === "/webhook" && request.method === "POST") {
			return handleWebhook(request, env);
		}

		return new Response("Not found", { status: 404 });
	},
};

async function handleWebhook(request: Request, env: Env): Promise<Response> {
	const rawBody = await request.text();

	try {
		// Store in Supabase first (fast, ~50ms)
		await storeInSupabase(env, rawBody);

		// Forward to MacBook (may fail if rebooting)
		try {
			const macbookResponse = await fetch(env.MACBOOK_TUNNEL_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: rawBody,
				signal: AbortSignal.timeout(5000), // 5s timeout
			});

			// If MacBook responded, mark as processed
			if (macbookResponse.ok) {
				await markAsProcessed(env, rawBody);
				return new Response(JSON.stringify({ ok: true, forwarded: true }), {
					headers: { "Content-Type": "application/json" },
				});
			}
		} catch {
			// MacBook is down — message is already stored in Supabase
			// It will be processed when MacBook comes back
		}

		// MacBook didn't respond — message stored, will be drained later
		return new Response(JSON.stringify({ ok: true, queued: true }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: String(err) }), {
			status: 500,
		});
	}
}

async function storeInSupabase(env: Env, rawBody: string): Promise<void> {
	const update = JSON.parse(rawBody);
	const updateId = update.update_id;

	await fetch(`${env.SUPABASE_URL}/rest/v1/pending_updates`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			apikey: env.SUPABASE_SERVICE_ROLE_KEY,
			Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
			Prefer: "return=minimal",
		},
		body: JSON.stringify({
			update_id: updateId,
			raw_json: update,
			processed: false,
		}),
	});
}

async function markAsProcessed(env: Env, rawBody: string): Promise<void> {
	const update = JSON.parse(rawBody);
	const updateId = update.update_id;

	await fetch(
		`${env.SUPABASE_URL}/rest/v1/pending_updates?update_id=eq.${updateId}`,
		{
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				apikey: env.SUPABASE_SERVICE_ROLE_KEY,
				Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
				Prefer: "return=minimal",
			},
			body: JSON.stringify({
				processed: true,
				processed_at: new Date().toISOString(),
			}),
		},
	);
}
