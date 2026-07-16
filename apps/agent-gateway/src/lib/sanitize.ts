/**
 * Sanitize a string for inclusion in an LLM prompt.
 * Strips Telegram metadata that could contain prompt injections.
 */
export function sanitizeUserInput(input: string): string {
	return input
		.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") // Strip control chars
		.trim()
		.slice(0, 2000); // Cap length
}

/**
 * Sanitize a Telegram user's name to prevent prompt injection.
 */
export function sanitizeDisplayName(name: string): string {
	// Strip anything that looks like system prompt instructions
	return name
		.replace(/["\\{}[\]()<>]/g, "")
		.trim()
		.slice(0, 100);
}

/**
 * Sanitize a database error message before returning it to the LLM.
 * Never expose schema, column names, or table names.
 */
export function sanitizeDbError(_rawError: unknown): string {
	// Always return generic message — no raw error text
	return "Би тэр өгөгдлийг олж чадсангүй. Өөр үг хэллэгээр асууна уу.";
}

/**
 * Truncate a tool result to prevent context window overflow.
 */
export function truncateResult(
	result: string,
	maxTokens: number = 2048,
): string {
	// Rough estimate: 1 token ≈ 4 chars
	const maxChars = maxTokens * 4;
	if (result.length <= maxChars) return result;
	return (
		result.slice(0, maxChars) +
		"\n\n... (үр дүн хэтэрхий урт байсан тул таслав)"
	);
}

/**
 * Sanitize an error message before showing it to users.
 * Strips file paths, stack traces, and internal details.
 */
export function sanitizeErrorMessage(err: unknown): string {
	if (!(err instanceof Error)) {
		return "Алдаа гарлаа. Дахин оролдоно уу.";
	}
	const msg = err.message;
	// Strip anything that looks like a file path, stack trace, or internal detail
	const sanitized = msg
		.replace(/\/[\w/.-]+\.\w+:\d+/g, "[internal]") // file paths with line numbers
		.replace(/at\s+[\w.]+\s+\([^)]+\)/g, "") // stack traces
		.replace(/node_modules[/\\][^\s:]+/g, "[internal]") // node_modules paths
		.replace(/(?:password|secret|token|key)[=:]\s*\S+/gi, "[redacted]") // secrets
		.trim();
	// If nothing useful remains, return generic message
	if (!sanitized || sanitized.length < 3) {
		return "Алдаа гарлаа. Дахин оролдоно уу.";
	}
	// Cap length
	return sanitized.slice(0, 200);
}
