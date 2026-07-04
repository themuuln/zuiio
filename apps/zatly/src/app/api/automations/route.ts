import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";
import { sanitizeSearchQuery, cleanString } from "@/lib/validation";
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

export async function GET(request: NextRequest) {
	const context = getSupabaseRestContext();
	if (!context) {
		return NextResponse.json(
			{
				error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
			},
			{ status: 500 },
		);
	}

	const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
	const trigger = request.nextUrl.searchParams.get("trigger")?.trim() ?? "";
	const triggerState =
		request.nextUrl.searchParams.get("triggerState")?.trim() ?? "";

	const url = new URL(`${context.baseUrl}/automations`);
	url.searchParams.set(
		"select",
		"id,name,status,runs,ctr,trigger,trigger_state,keywords,folder,updated_at",
	);
	url.searchParams.set("order", "updated_at.desc");
	url.searchParams.set("limit", "100");

	if (trigger && trigger !== "any") {
		url.searchParams.set("trigger", `eq.${trigger}`);
	}
	if (triggerState && triggerState !== "any") {
		url.searchParams.set("trigger_state", `eq.${triggerState}`);
	}
	if (query.length > 0) {
		const sanitized = sanitizeSearchQuery(query);
		if (sanitized.length > 0) {
			url.searchParams.set(
				"or",
				`(name.ilike.*${sanitized}*,folder.ilike.*${sanitized}*)`,
			);
		}
	}

	let response: Response;
	try {
		response = await fetch(url.toString(), {
			headers: context.headers,
			cache: "no-store",
		});
	} catch (err) {
		console.error("Network error fetching automations:", err);
		return NextResponse.json(
			{ error: "Failed to connect to database." },
			{ status: 502 },
		);
	}

	if (!response.ok) {
		const text = await response.text();
		return NextResponse.json(
			{ error: `Failed to load automations: ${text}` },
			{ status: 500 },
		);
	}

	const rows = (await response.json()) as AutomationRow[];
	return NextResponse.json({ automations: rows.map(mapAutomation) });
}

type CreateBody = {
	name?: string;
	folder?: string;
};

export async function POST(request: NextRequest) {
	const context = getSupabaseRestContext();
	if (!context) {
		return NextResponse.json(
			{
				error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
			},
			{ status: 500 },
		);
	}

	const body = (await request.json().catch(() => null)) as CreateBody | null;
	const name = cleanString(body?.name, 200);
	const folder = cleanString(body?.folder, 100) || "General";

	if (!name) {
		return NextResponse.json(
			{ error: "Automation name is required (max 200 chars)." },
			{ status: 400 },
		);
	}

	const url = new URL(`${context.baseUrl}/automations`);
	url.searchParams.set(
		"select",
		"id,name,status,runs,ctr,trigger,trigger_state,keywords,folder,updated_at",
	);

	let response: Response;
	try {
		response = await fetch(url.toString(), {
			method: "POST",
			headers: {
				...context.headers,
				Prefer: "return=representation",
			},
			body: JSON.stringify({
				name,
				folder,
				status: "draft",
				trigger: "default",
				trigger_state: "active",
				keywords: [],
				flow_json: {
					nodes: [
						{
							id: "start-1",
							type: "start",
							position: { x: 250, y: 50 },
							data: { label: "Start", trigger: "default" },
							deletable: false,
						},
					],
					edges: [],
				},
			}),
			cache: "no-store",
		});
	} catch (err) {
		console.error("Network error creating automation:", err);
		return NextResponse.json(
			{ error: "Failed to connect to database." },
			{ status: 502 },
		);
	}

	if (!response.ok) {
		const text = await response.text();
		return NextResponse.json(
			{ error: `Failed to create automation: ${text}` },
			{ status: 500 },
		);
	}

	const rows = (await response.json()) as AutomationRow[];
	const row = rows[0];
	return NextResponse.json({ automation: mapAutomation(row) });
}
