import "server-only";

/**
 * Security hardening checks for the agent gateway.
 *
 * Run at startup to verify that the environment is correctly configured
 * for production use.
 */

/**
 * Verify that all required production env vars are set.
 * Returns a list of warnings (empty = all good).
 */
export function securityAudit(): string[] {
	const warnings: string[] = [];

	// API keys must be real, not placeholders
	const openCodeKey = process.env.OPENCODE_API_KEY ?? "";
	const openaiKey = process.env.OPENAI_API_KEY ?? "";
	const groqKey = process.env.GROQ_API_KEY ?? "";

	if (
		!openCodeKey ||
		openCodeKey === "placeholder" ||
		openCodeKey.startsWith("sk-...")
	) {
		warnings.push(
			"OPENCODE_API_KEY is missing or still a placeholder — agent LLM calls will fail",
		);
	}
	if (
		!openaiKey ||
		openaiKey === "placeholder" ||
		openaiKey.startsWith("sk-...")
	) {
		warnings.push(
		"OPENAI_API_KEY not set — fallback provider unavailable (optional, OpenCodeGo will be used directly)",
		);
	}
	if (!groqKey || groqKey === "placeholder") {
		warnings.push("GROQ_API_KEY is missing — voice STT will not work");
	}

	// Token signing secret must be strong
	const tokenSecret = process.env.TOKEN_SIGNING_SECRET ?? "";
	if (!tokenSecret || tokenSecret.length < 16) {
		warnings.push(
			"TOKEN_SIGNING_SECRET is too short (<16 chars) — HMAC tokens are weak",
		);
	}
	if (tokenSecret === "zuiio-gateway-dev-secret-2026") {
		warnings.push(
			"TOKEN_SIGNING_SECRET is the dev default — change for production",
		);
	}

	// Webhook secret should not be default
	const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
	if (!webhookSecret || webhookSecret === "dev-secret") {
		warnings.push(
			"TELEGRAM_WEBHOOK_SECRET is the dev default — change for production",
		);
	}

	// Supabase should not be a placeholder
	const supabaseUrl = process.env.SUPABASE_URL ?? "";
	if (supabaseUrl.includes("your-project")) {
		warnings.push("SUPABASE_URL is still a placeholder");
	}

	return warnings;
}

/**
 * Validate that the session compound key provides proper isolation.
 * No-op at runtime — session.ts already uses (orgId, chatId, userId).
 * This is a documentation checkpoint.
 */
export function verifySessionIsolation(): {
	isolation: "compound_key";
	detail: string;
} {
	return {
		isolation: "compound_key",
		detail:
			"Sessions are keyed by (organization_id, telegram_chat_id, telegram_user_id). " +
			"A user in org A cannot access sessions from org B. " +
			"The gateway resolves org from (chatId, userId) or botKey before every request.",
	};
}

/**
 * Verify that the confirmation gate prevents unauthorized writes.
 * No-op at runtime — confirmation.ts already requires callback verification.
 */
export function verifyConfirmationGate(): {
	mechanism: "inline_keyboard_nonce";
	detail: string;
} {
	return {
		mechanism: "inline_keyboard_nonce",
		detail:
			"Write tools require explicit confirmation via inline keyboard. " +
			"The nonce is a crypto.randomUUID() that expires after 5 minutes. " +
			"Only the original chatId can confirm — cross-user confirmation is rejected.",
	};
}
