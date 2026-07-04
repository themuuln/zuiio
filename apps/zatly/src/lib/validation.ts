/**
 * Shared validation helpers for API routes.
 */

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validate that a string is a valid UUID. */
export function isValidUUID(value: string): boolean {
	return UUID_RE.test(value);
}

/** Trim and enforce a max length. Returns null if the result is empty. */
export function cleanString(value: unknown, maxLength = 500): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (trimmed.length === 0) return null;
	return trimmed.slice(0, maxLength);
}

/** Validate that a value is one of the allowed options. */
export function isOneOf<T extends string>(
	value: unknown,
	allowed: readonly T[],
): value is T {
	return (
		typeof value === "string" && (allowed as readonly string[]).includes(value)
	);
}

/** Sanitize a search query for use with PostgREST ilike filters.
 *  Strips characters that could alter the filter pattern. */
export function sanitizeSearchQuery(query: string): string {
	return query
		.replace(/[%,*_()|?+]/g, " ") // Wildcard / regex chars
		.replace(/,/g, " ") // PostgREST OR delimiter
		.replace(/\./g, " ") // PostgREST NOT delimiter
		.trim()
		.slice(0, 200); // Cap search length
}

/** Parse and validate pagination params. */
export function parsePagination(searchParams: URLSearchParams) {
	const limit = Math.min(
		Math.max(Number(searchParams.get("limit") ?? "50"), 1),
		200,
	);
	const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);
	return { limit, offset };
}
