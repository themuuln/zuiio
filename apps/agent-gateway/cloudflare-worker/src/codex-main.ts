import { type CodexEnv, handleCodexRequest, type KvNamespace } from "./codex";

interface Env {
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
		!env.CODEX_CLIENT_ID
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
		if (!url.pathname.startsWith("/codex/")) {
			return new Response("Not found", { status: 404 });
		}
		const codexEnv = getCodexEnv(env);
		if (!codexEnv) {
			return new Response("Codex proxy is not configured", { status: 503 });
		}
		return handleCodexRequest(request, codexEnv);
	},
};
