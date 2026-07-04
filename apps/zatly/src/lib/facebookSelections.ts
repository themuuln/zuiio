import crypto from "crypto";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";

type PendingPage = {
	id: string;
	name: string;
	accessToken: string;
};

type SelectionRow = {
	id: string;
	pages: Array<{ id: string; name: string; accessToken: string }>;
	created_at: string;
};

const EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Create a pending page selection from an OAuth callback.
 * Returns a selection ID used to retrieve or consume the pages.
 */
export async function createPendingSelection(
	pages: Array<{ id: string; name: string; access_token: string }>,
): Promise<string> {
	const ctx = getSupabaseRestContext();
	if (!ctx) throw new Error("Supabase not configured");

	// Clean up expired selections
	await cleanupExpiredSelections(ctx);

	const selectionId = crypto.randomBytes(24).toString("hex");
	const mappedPages: PendingPage[] = pages.map((page) => ({
		id: page.id,
		name: page.name,
		accessToken: page.access_token,
	}));

	const res = await fetch(`${ctx.baseUrl}/facebook_pending_selections`, {
		method: "POST",
		headers: {
			...ctx.headers,
			Prefer: "return=representation",
		},
		body: JSON.stringify({
			id: selectionId,
			pages: mappedPages,
		}),
		cache: "no-store",
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to create pending selection: ${text}`);
	}

	return selectionId;
}

/**
 * Get the list of pending pages for a selection ID.
 * Returns null if the selection has expired or doesn't exist.
 */
export async function getPendingSelectionPages(
	selectionId: string,
): Promise<Array<{ id: string; name: string }> | null> {
	const ctx = getSupabaseRestContext();
	if (!ctx) return null;

	const url = new URL(`${ctx.baseUrl}/facebook_pending_selections`);
	url.searchParams.set("select", "id,pages,created_at");
	url.searchParams.set("id", `eq.${selectionId}`);
	url.searchParams.set("limit", "1");

	try {
		const res = await fetch(url.toString(), {
			headers: ctx.headers,
			cache: "no-store",
		});
		if (!res.ok) return null;

		const rows = (await res.json()) as SelectionRow[];
		const row = rows[0];
		if (!row) return null;

		// Check expiration
		const createdAt = new Date(row.created_at).getTime();
		if (Date.now() - createdAt > EXPIRATION_MS) {
			// Expired — delete it
			await fetch(
				`${ctx.baseUrl}/facebook_pending_selections?id=eq.${selectionId}`,
				{
					method: "DELETE",
					headers: ctx.headers,
					cache: "no-store",
				},
			);
			return null;
		}

		return row.pages.map((page) => ({ id: page.id, name: page.name }));
	} catch {
		return null;
	}
}

/**
 * Consume a pending selection — returns the matched page and deletes the selection.
 * Returns null if the selection or page doesn't exist.
 */
export async function consumePendingSelection(
	selectionId: string,
	pageId: string,
): Promise<{ id: string; name: string; accessToken: string } | null> {
	const ctx = getSupabaseRestContext();
	if (!ctx) return null;

	// Fetch the selection
	const url = new URL(`${ctx.baseUrl}/facebook_pending_selections`);
	url.searchParams.set("select", "id,pages,created_at");
	url.searchParams.set("id", `eq.${selectionId}`);
	url.searchParams.set("limit", "1");

	try {
		const res = await fetch(url.toString(), {
			headers: ctx.headers,
			cache: "no-store",
		});
		if (!res.ok) return null;

		const rows = (await res.json()) as SelectionRow[];
		const row = rows[0];
		if (!row) return null;

		// Check expiration
		const createdAt = new Date(row.created_at).getTime();
		if (Date.now() - createdAt > EXPIRATION_MS) {
			await fetch(
				`${ctx.baseUrl}/facebook_pending_selections?id=eq.${selectionId}`,
				{
					method: "DELETE",
					headers: ctx.headers,
					cache: "no-store",
				},
			);
			return null;
		}

		// Find the matching page
		const matchedPage = row.pages.find((page) => page.id === pageId);

		// Always delete the selection after consumption attempt
		await fetch(
			`${ctx.baseUrl}/facebook_pending_selections?id=eq.${selectionId}`,
			{
				method: "DELETE",
				headers: ctx.headers,
				cache: "no-store",
			},
		);

		if (!matchedPage) return null;

		return {
			id: matchedPage.id,
			name: matchedPage.name,
			accessToken: matchedPage.accessToken,
		};
	} catch {
		return null;
	}
}

/**
 * Delete expired pending selections from Supabase.
 */
async function cleanupExpiredSelections(ctx: {
	baseUrl: string;
	headers: Record<string, string>;
}) {
	const cutoff = new Date(Date.now() - EXPIRATION_MS).toISOString();

	await fetch(
		`${ctx.baseUrl}/facebook_pending_selections?created_at=lt.${encodeURIComponent(cutoff)}`,
		{
			method: "DELETE",
			headers: ctx.headers,
			cache: "no-store",
		},
	);
}
