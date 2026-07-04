import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";
import { isValidUUID, cleanString } from "@/lib/validation";
import type { Automation, AutomationStatus } from "@/types/automation";

type AutomationRow = {
	id: string;
	name: string;
	status: AutomationStatus;
	runs: number;
	ctr: number;
	trigger: "keyword" | "default" | "button" | "ref";
	trigger_state: "active" | "inactive";
	keywords: string[] | null;
	folder: string;
	updated_at: string;
};

function mapAutomation(row: AutomationRow): Automation {
	return {
		id: row.id,
		name: row.name,
		status: row.status,
		runs: row.runs,
		ctr: Number(row.ctr ?? 0),
		modifiedAt: row.updated_at,
		trigger: row.trigger,
		triggerState: row.trigger_state,
		keywords: row.keywords ?? [],
		folder: row.folder,
	};
}

type PatchBody = {
	name?: string;
	folder?: string;
	status?: AutomationStatus;
	trigger?: "keyword" | "default" | "button" | "ref";
	triggerState?: "active" | "inactive";
	keywords?: string[];
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
	const name = cleanString(body.name, 200);
	const folder = cleanString(body.folder, 100);
	if (name) {
		patch.name = name;
	}
	if (folder) {
		patch.folder = folder;
	}
	if (body.status && ["live", "draft", "off"].includes(body.status)) {
		patch.status = body.status;
	}
	if (
		body.trigger &&
		["keyword", "default", "button", "ref"].includes(body.trigger)
	) {
		patch.trigger = body.trigger;
	}
	if (body.triggerState && ["active", "inactive"].includes(body.triggerState)) {
		patch.trigger_state = body.triggerState;
	}
	if (Array.isArray(body.keywords)) {
		patch.keywords = body.keywords.map((v) => v.trim()).filter(Boolean);
	}

	if (Object.keys(patch).length === 0) {
		return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
	}

	const { id } = await params;
	if (!isValidUUID(id)) {
		return NextResponse.json(
			{ error: "Invalid automation ID." },
			{ status: 400 },
		);
	}
	const url = new URL(`${context.baseUrl}/automations`);
	url.searchParams.set("id", `eq.${id}`);
	url.searchParams.set(
		"select",
		"id,name,status,runs,ctr,trigger,trigger_state,keywords,folder,updated_at",
	);

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
		console.error("Network error updating automation:", err);
		return NextResponse.json(
			{ error: "Failed to connect to database." },
			{ status: 502 },
		);
	}

	if (!response.ok) {
		const text = await response.text();
		return NextResponse.json(
			{ error: `Failed to update automation: ${text}` },
			{ status: 500 },
		);
	}

	const rows = (await response.json()) as AutomationRow[];
	const row = rows[0];
	if (!row) {
		return NextResponse.json(
			{ error: "Automation not found." },
			{ status: 404 },
		);
	}

	return NextResponse.json({ automation: mapAutomation(row) });
}

export async function DELETE(
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
		return NextResponse.json(
			{ error: "Invalid automation ID." },
			{ status: 400 },
		);
	}
	const url = new URL(`${context.baseUrl}/automations`);
	url.searchParams.set("id", `eq.${id}`);

	let response: Response;
	try {
		response = await fetch(url.toString(), {
			method: "DELETE",
			headers: context.headers,
			cache: "no-store",
		});
	} catch (err) {
		console.error("Network error deleting automation:", err);
		return NextResponse.json(
			{ error: "Failed to connect to database." },
			{ status: 502 },
		);
	}

	if (!response.ok) {
		const text = await response.text();
		return NextResponse.json(
			{ error: `Failed to delete automation: ${text}` },
			{ status: 500 },
		);
	}

	return NextResponse.json({ success: true });
}
