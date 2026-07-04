import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";
import { isValidUUID } from "@/lib/validation";
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

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const context = getSupabaseRestContext();
	if (!context) {
		return NextResponse.json(
			{
				error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
			},
			{ status: 500 },
		);
	}

	const { id } = await params;
	if (!isValidUUID(id)) {
		return NextResponse.json({ error: "Invalid contact ID." }, { status: 400 });
	}
	const url = new URL(`${context.baseUrl}/contacts`);
	url.searchParams.set(
		"select",
		"id,first_name,last_name,full_name,gender,language,status,subscribed_at,contact_time,avatar_url,tags,subscription_lists,opted_in_through,paused_automations,psid,created_at,updated_at",
	);
	url.searchParams.set("id", `eq.${id}`);
	url.searchParams.set("limit", "1");

	let response: Response;
	try {
		response = await fetch(url.toString(), {
			headers: context.headers,
			cache: "no-store",
		});
	} catch (err) {
		console.error("Network error fetching contact:", err);
		return NextResponse.json(
			{ error: "Failed to connect to database." },
			{ status: 502 },
		);
	}

	if (!response.ok) {
		const text = await response.text();
		return NextResponse.json(
			{ error: `Failed to load contact: ${text}` },
			{ status: 500 },
		);
	}

	const rows = (await response.json()) as ContactRow[];
	const row = rows[0];
	if (!row) {
		return NextResponse.json({ error: "Contact not found." }, { status: 404 });
	}

	return NextResponse.json({ contact: mapContact(row) });
}

type PatchBody = {
	tags?: string[];
	pausedAutomations?: boolean;
	status?: ContactStatus;
};

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const context = getSupabaseRestContext();
	if (!context) {
		return NextResponse.json(
			{
				error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
			},
			{ status: 500 },
		);
	}

	const body = (await request.json().catch(() => null)) as PatchBody | null;
	if (!body) {
		return NextResponse.json(
			{ error: "Invalid request body." },
			{ status: 400 },
		);
	}

	const patch: Record<string, unknown> = {};
	if (Array.isArray(body.tags)) {
		patch.tags = body.tags.filter(Boolean);
	}
	if (typeof body.pausedAutomations === "boolean") {
		patch.paused_automations = body.pausedAutomations;
	}
	if (
		body.status &&
		(body.status === "subscribed" || body.status === "unsubscribed")
	) {
		patch.status = body.status;
	}

	if (Object.keys(patch).length === 0) {
		return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
	}

	const { id } = await params;
	if (!isValidUUID(id)) {
		return NextResponse.json({ error: "Invalid contact ID." }, { status: 400 });
	}
	const url = new URL(`${context.baseUrl}/contacts`);
	url.searchParams.set("id", `eq.${id}`);
	url.searchParams.set("select", "*");

	let response: Response;
	try {
		response = await fetch(url.toString(), {
			method: "PATCH",
			headers: {
				...context.headers,
				Prefer: "return=representation",
			},
			body: JSON.stringify(patch),
			cache: "no-store",
		});
	} catch (err) {
		console.error("Network error updating contact:", err);
		return NextResponse.json(
			{ error: "Failed to connect to database." },
			{ status: 502 },
		);
	}

	if (!response.ok) {
		const text = await response.text();
		return NextResponse.json(
			{ error: `Failed to update contact: ${text}` },
			{ status: 500 },
		);
	}

	const rows = (await response.json()) as ContactRow[];
	const row = rows[0];
	if (!row) {
		return NextResponse.json({ error: "Contact not found." }, { status: 404 });
	}

	return NextResponse.json({ contact: mapContact(row) });
}
