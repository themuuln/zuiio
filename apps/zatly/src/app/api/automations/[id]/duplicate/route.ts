import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";
import { isValidUUID } from "@/lib/validation";
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
	flow_json: unknown;
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

export async function POST(
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
	const sourceUrl = new URL(`${context.baseUrl}/automations`);
	sourceUrl.searchParams.set(
		"select",
		"id,name,status,runs,ctr,trigger,trigger_state,keywords,folder,updated_at,flow_json",
	);
	sourceUrl.searchParams.set("id", `eq.${id}`);
	sourceUrl.searchParams.set("limit", "1");

	let sourceResponse: Response;
	try {
		sourceResponse = await fetch(sourceUrl.toString(), {
			headers: context.headers,
			cache: "no-store",
		});
	} catch (err) {
		console.error("Network error loading source automation:", err);
		return NextResponse.json(
			{ error: "Failed to connect to database." },
			{ status: 502 },
		);
	}
	if (!sourceResponse.ok) {
		const text = await sourceResponse.text();
		return NextResponse.json(
			{ error: `Failed to load source automation: ${text}` },
			{ status: 500 },
		);
	}

	const rows = (await sourceResponse.json()) as AutomationRow[];
	const source = rows[0];
	if (!source) {
		return NextResponse.json(
			{ error: "Automation not found." },
			{ status: 404 },
		);
	}

	const createUrl = new URL(`${context.baseUrl}/automations`);
	createUrl.searchParams.set(
		"select",
		"id,name,status,runs,ctr,trigger,trigger_state,keywords,folder,updated_at",
	);

	let createResponse: Response;
	try {
		createResponse = await fetch(createUrl.toString(), {
			method: "POST",
			headers: {
				...context.headers,
				Prefer: "return=representation",
			},
			body: JSON.stringify({
				name: `${source.name} (Copy)`,
				status: "draft",
				runs: 0,
				ctr: 0,
				trigger: source.trigger,
				trigger_state: source.trigger_state,
				keywords: source.keywords ?? [],
				folder: source.folder,
				flow_json: source.flow_json ?? { nodes: [], edges: [] },
			}),
			cache: "no-store",
		});
	} catch (err) {
		console.error("Network error duplicating automation:", err);
		return NextResponse.json(
			{ error: "Failed to connect to database." },
			{ status: 502 },
		);
	}

	if (!createResponse.ok) {
		const text = await createResponse.text();
		return NextResponse.json(
			{ error: `Failed to duplicate automation: ${text}` },
			{ status: 500 },
		);
	}

	const createdRows = (await createResponse.json()) as AutomationRow[];
	const created = createdRows[0];
	return NextResponse.json({ automation: mapAutomation(created) });
}
