import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";
import { isValidUUID } from "@/lib/validation";

type FlowPayload = {
	nodes: unknown[];
	edges: unknown[];
};

type AutomationFlowRow = {
	id: string;
	flow_json: FlowPayload | null;
};

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
		return NextResponse.json(
			{ error: "Invalid automation ID." },
			{ status: 400 },
		);
	}
	const url = new URL(`${context.baseUrl}/automations`);
	url.searchParams.set("select", "id,flow_json");
	url.searchParams.set("id", `eq.${id}`);
	url.searchParams.set("limit", "1");

	let response: Response;
	try {
		response = await fetch(url.toString(), {
			headers: context.headers,
			cache: "no-store",
		});
	} catch (err) {
		console.error("Network error fetching automation flow:", err);
		return NextResponse.json(
			{ error: "Failed to connect to database." },
			{ status: 502 },
		);
	}

	if (!response.ok) {
		const text = await response.text();
		return NextResponse.json(
			{ error: `Failed to load automation flow: ${text}` },
			{ status: 500 },
		);
	}

	const rows = (await response.json()) as AutomationFlowRow[];
	const row = rows[0];
	if (!row) {
		return NextResponse.json(
			{ error: "Automation not found." },
			{ status: 404 },
		);
	}

	return NextResponse.json({
		flow: row.flow_json ?? { nodes: [], edges: [] },
	});
}

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

	const body = (await request.json().catch(() => null)) as FlowPayload | null;
	if (!body || !Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
		return NextResponse.json(
			{ error: "Body must contain nodes[] and edges[] arrays." },
			{ status: 400 },
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
	url.searchParams.set("select", "id");

	let response: Response;
	try {
		response = await fetch(url.toString(), {
			method: "PATCH",
			headers: {
				...context.headers,
				Prefer: "return=representation",
			},
			body: JSON.stringify({
				flow_json: {
					nodes: body.nodes,
					edges: body.edges,
				},
			}),
			cache: "no-store",
		});
	} catch (err) {
		console.error("Network error saving automation flow:", err);
		return NextResponse.json(
			{ error: "Failed to connect to database." },
			{ status: 502 },
		);
	}

	if (!response.ok) {
		const text = await response.text();
		return NextResponse.json(
			{ error: `Failed to save automation flow: ${text}` },
			{ status: 500 },
		);
	}

	return NextResponse.json({ success: true });
}
