import { env } from "@/lib/env";

const _enabled = env("DEBUG") === "true" || env("DEBUG") === "1";

/**
 * Structured debug logger. Only outputs when DEBUG=true is set.
 * Usage:  debug("agent", "handling message", { chatId, userId })
 */
export function debug(
	component: string,
	message: string,
	data?: Record<string, unknown>,
): void {
	if (!_enabled) return;
	const ts = new Date().toISOString();
	const extra = data
		? ` ${Object.entries(data)
				.map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
				.join(" ")}`
		: "";
	console.log(`[DEBUG:${ts}] [${component}] ${message}${extra}`);
}
