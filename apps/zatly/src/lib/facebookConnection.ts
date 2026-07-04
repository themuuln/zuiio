import { getSupabaseRestContext } from "@/lib/supabaseAdmin";

export type FacebookConnection = {
	pageId: string;
	pageName: string;
	pageAccessToken: string;
	connectedAt: string;
};

type ConnectionRow = {
	page_id: string;
	page_name: string;
	page_access_token: string;
	connected_at: string;
};

/**
 * Retrieve the stored Facebook page connection from Supabase.
 * Returns null if no connection exists.
 */
export async function getFacebookConnection(): Promise<FacebookConnection | null> {
	const ctx = getSupabaseRestContext();
	if (!ctx) return null;

	const url = new URL(`${ctx.baseUrl}/facebook_connections`);
	url.searchParams.set(
		"select",
		"page_id,page_name,page_access_token,connected_at",
	);
	url.searchParams.set("order", "connected_at.desc");
	url.searchParams.set("limit", "1");

	try {
		const res = await fetch(url.toString(), {
			headers: ctx.headers,
			cache: "no-store",
		});
		if (!res.ok) return null;

		const rows = (await res.json()) as ConnectionRow[];
		const row = rows[0];
		if (!row) return null;

		return {
			pageId: row.page_id,
			pageName: row.page_name,
			pageAccessToken: row.page_access_token,
			connectedAt: row.connected_at,
		};
	} catch {
		return null;
	}
}

/**
 * Save (upsert) the Facebook page connection.
 * Uses the singleton pattern — always overwrites the single row.
 */
export async function saveFacebookConnection(
	connection: FacebookConnection,
): Promise<void> {
	const ctx = getSupabaseRestContext();
	if (!ctx) throw new Error("Supabase not configured");

	// Delete existing connection(s) then insert the new one
	await fetch(
		`${ctx.baseUrl}/facebook_connections?id=neq.00000000-0000-0000-0000-000000000000`,
		{
			method: "DELETE",
			headers: ctx.headers,
			cache: "no-store",
		},
	);

	const res = await fetch(`${ctx.baseUrl}/facebook_connections`, {
		method: "POST",
		headers: {
			...ctx.headers,
			Prefer: "return=representation",
		},
		body: JSON.stringify({
			page_id: connection.pageId,
			page_name: connection.pageName,
			page_access_token: connection.pageAccessToken,
			connected_at: connection.connectedAt,
		}),
		cache: "no-store",
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to save Facebook connection: ${text}`);
	}
}

/**
 * Remove the stored Facebook page connection.
 */
export async function clearFacebookConnection(): Promise<void> {
	const ctx = getSupabaseRestContext();
	if (!ctx) return;

	await fetch(
		`${ctx.baseUrl}/facebook_connections?id=neq.00000000-0000-0000-0000-000000000000`,
		{
			method: "DELETE",
			headers: ctx.headers,
			cache: "no-store",
		},
	);
}

/**
 * Get the effective page access token — prefers the env var, falls back to stored connection.
 */
export async function getEffectivePageAccessToken(): Promise<string | null> {
	if (process.env.FB_PAGE_ACCESS_TOKEN) {
		return process.env.FB_PAGE_ACCESS_TOKEN;
	}

	const saved = await getFacebookConnection();
	return saved?.pageAccessToken ?? null;
}
