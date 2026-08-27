import type { SupabaseClient } from "@supabase/supabase-js";

const ZER_APP_URL = "ZER_APP_URL";
const ZER_ORG_URLS = "ZER_ORG_URLS";

function normalizeHost(value: string): string | null {
	const trimmed = value
		.trim()
		.replace(/^https?:\/\//i, "")
		.replace(/\/+$/, "");
	if (!trimmed) return null;
	// Basic host validation — no spaces, no path
	if (trimmed.includes(" ") || trimmed.includes("/")) return null;
	return trimmed;
}

/**
 * Resolve the Zer base URL for a given organization.
 *
 * Priority:
 * 1. Verified custom_domain from organization_public_profiles (per-org storefront domain)
 * 2. JSON map in ZER_ORG_URLS env ({"<orgId>": "https://bujin.mn"})
 * 3. Global ZER_APP_URL fallback
 * 4. null — caller should fail-closed (QPay disabled)
 *
 * Domain is returned as `https://<host>` without trailing slash.
 */
export async function resolveZerBaseUrl(
	orgId: string,
	supabase: SupabaseClient,
): Promise<string | null> {
	// 1. Per-org verified custom domain — the org's storefront domain (e.g. bujin.mn)
	// This lives in the Zer Supabase project, which the gateway shares.
	try {
		const { data } = await supabase
			.from("organization_public_profiles")
			.select("custom_domain, domain_verified")
			.eq("organization_id", orgId)
			.maybeSingle();

		if (data?.domain_verified && typeof data.custom_domain === "string") {
			const host = normalizeHost(data.custom_domain);
			if (host) return `https://${host}`;
		}
	} catch {
		// Ignore — fallback to env
	}

	// 2. Explicit per-org override map (useful for preview / unverified domains)
	const overridesRaw = process.env[ZER_ORG_URLS]?.trim();
	if (overridesRaw) {
		try {
			const map = JSON.parse(overridesRaw) as Record<string, unknown>;
			const raw = map[orgId];
			if (typeof raw === "string" && raw.trim()) {
				const cleaned = raw.trim().replace(/\/+$/, "");
				// Allow full URL or bare host
				if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
					return cleaned;
				}
				const host = normalizeHost(cleaned);
				if (host) return `https://${host}`;
			}
		} catch {
			// Invalid JSON — ignore, fall through
		}
	}

	// 3. Global fallback
	const fallback = process.env[ZER_APP_URL]?.trim().replace(/\/+$/, "");
	if (fallback) return fallback;

	return null;
}
