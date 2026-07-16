/**
 * Type-safe environment variable access.
 * Returns the value or throws if required and missing.
 */
export function env(
	name: string,
	options?: { required?: boolean },
): string | undefined {
	const value = process.env[name];
	if (options?.required && !value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export function envOrThrow(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

/** OpenCodeGo (OpenAI-compatible) configuration. */
export function openCodeGoConfig() {
	const apiKey = envOrThrow("OPENCODE_API_KEY");
	return {
		apiKey,
		baseUrl: env("OPENCODE_BASE_URL") ?? "https://opencode.ai/zen/go/v1",
		model: env("OPENCODE_MODEL") ?? "deepseek-v4-flash",
	};
}

/** OpenAI fallback configuration. Returns null if no API key set. */
export function openAiConfig() {
	const apiKey = env("OPENAI_API_KEY");
	if (!apiKey) return null;
	return {
		apiKey,
		baseUrl: env("OPENAI_BASE_URL") ?? "https://api.openai.com/v1",
		model: env("OPENAI_FALLBACK_MODEL") ?? "gpt-4o-mini",
	};
}

/** Upstash Redis configuration. Returns null if not configured. */
export function redisConfig() {
	const url = env("UPSTASH_REDIS_REST_URL");
	const token = env("UPSTASH_REDIS_REST_TOKEN");
	if (!url || !token) return null;
	return { url, token };
}

/**
 * Validate all required environment variables at startup.
 * Call once during initialization to fail fast on misconfiguration.
 */
export function validateConfig(): void {
	const required = [
		"SUPABASE_URL",
		"SUPABASE_SERVICE_ROLE_KEY",
		"OPENCODE_API_KEY",
		"TELEGRAM_BOT_TOKEN",
		"TELEGRAM_WEBHOOK_SECRET",
	];
	const missing = required.filter((name) => !process.env[name]);
	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(", ")}`,
		);
	}
	// Warn on optional but recommended
	const recommended = ["OPENAI_API_KEY", "SENTRY_DSN"];
	for (const name of recommended) {
		if (!process.env[name]) {
			console.warn(`[agent-gateway] Optional env var not set: ${name}`);
		}
	}
}
