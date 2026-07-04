import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";
import { sanitizeSearchQuery, parsePagination } from "@/lib/validation";
import type { Contact, ContactGender, ContactStatus } from "@/types/contact";

type ContactRow = {
	id: string;
	first_name: string;
	last_name: string;
	full_name: string;
	gender: ContactGender;
	language: string;
	status: ContactStatus;
	subscribed_at: string;
	contact_time: string;
	avatar_url: string;
	tags: string[] | null;
	subscription_lists: string[] | null;
	opted_in_through: string;
	paused_automations: boolean;
	psid: string;
	created_at: string;
	updated_at: string;
};

function mapContact(row: ContactRow): Contact {
	return {
		id: row.id,
		firstName: row.first_name,
		lastName: row.last_name,
		fullName: row.full_name,
		gender: row.gender,
		language: row.language,
		status: row.status,
		subscribedAt: row.subscribed_at,
		contactTime: row.contact_time,
		avatarUrl: row.avatar_url,
		tags: row.tags ?? [],
		subscriptionLists: row.subscription_lists ?? [],
		optedInThrough: row.opted_in_through,
		pausedAutomations: row.paused_automations,
		psid: row.psid,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function getError(message: string) {
	return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: NextRequest) {
	const context = getSupabaseRestContext();
	if (!context) {
		return getError(
			"Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
		);
	}

	const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
	const status = request.nextUrl.searchParams.get("status")?.trim() ?? "";
	const gender = request.nextUrl.searchParams.get("gender")?.trim() ?? "";
	const { limit, offset } = parsePagination(request.nextUrl.searchParams);

	const url = new URL(`${context.baseUrl}/contacts`);
	url.searchParams.set(
		"select",
		"id,first_name,last_name,full_name,gender,language,status,subscribed_at,contact_time,avatar_url,tags,subscription_lists,opted_in_through,paused_automations,psid,created_at,updated_at",
	);
	url.searchParams.set("order", "subscribed_at.desc");
	url.searchParams.set("limit", String(limit));
	url.searchParams.set("offset", String(offset));

	if (status && status !== "all") {
		url.searchParams.set("status", `eq.${status}`);
	}

	if (gender && gender !== "all") {
		url.searchParams.set("gender", `eq.${gender}`);
	}

	if (query.length > 0) {
		const sanitized = sanitizeSearchQuery(query);
		if (sanitized.length > 0) {
			url.searchParams.set(
				"or",
				`(full_name.ilike.*${sanitized}*,first_name.ilike.*${sanitized}*,last_name.ilike.*${sanitized}*,psid.ilike.*${sanitized}*)`,
			);
		}
	}

	let response: Response;
	try {
		response = await fetch(url.toString(), {
			headers: {
				...context.headers,
				Prefer: "count=exact",
			},
			cache: "no-store",
		});
	} catch (err) {
		console.error("Network error fetching contacts:", err);
		return NextResponse.json(
			{ error: "Failed to connect to database." },
			{ status: 502 },
		);
	}

	if (!response.ok) {
		const text = await response.text();
		return NextResponse.json(
			{ error: `Failed to load contacts: ${text}` },
			{ status: 500 },
		);
	}

	const rows = (await response.json()) as ContactRow[];
	const range = response.headers.get("content-range");
	const total = range?.split("/")[1]
		? Number(range.split("/")[1])
		: rows.length;

	return NextResponse.json({
		contacts: rows.map(mapContact),
		total: Number.isFinite(total) ? total : rows.length,
	});
}
