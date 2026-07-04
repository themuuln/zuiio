import { NextResponse } from "next/server";

type PublishBody = {
	nodes?: unknown[];
	edges?: unknown[];
};

function resolveProjectRef(): string | null {
	const explicit = process.env.SUPABASE_PROJECT_REF;
	if (explicit && explicit.trim().length > 0) {
		return explicit.trim();
	}

	const fromUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	if (!fromUrl) {
		return null;
	}

	try {
		const host = new URL(fromUrl).hostname;
		const projectRef = host.split(".")[0];
		return projectRef || null;
	} catch {
		return null;
	}
}

export async function POST(request: Request) {
	const managementToken = process.env.SUPABASE_MANAGEMENT_ACCESS_TOKEN;
	const projectRef = resolveProjectRef();

	if (!managementToken) {
		return NextResponse.json(
			{ error: "Missing SUPABASE_MANAGEMENT_ACCESS_TOKEN in server env." },
			{ status: 500 },
		);
	}

	if (!projectRef) {
		return NextResponse.json(
			{ error: "Missing SUPABASE_PROJECT_REF (or NEXT_PUBLIC_SUPABASE_URL)." },
			{ status: 500 },
		);
	}

	let body: PublishBody;
	try {
		body = (await request.json()) as PublishBody;
	} catch {
		return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
	}

	if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
		return NextResponse.json(
			{ error: "Body must contain nodes[] and edges[] arrays." },
			{ status: 400 },
		);
	}

	const flowJson = JSON.stringify({
		nodes: body.nodes,
		edges: body.edges,
	});

	let response: Response;
	try {
		response = await fetch(
			`https://api.supabase.com/v1/projects/${projectRef}/secrets`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${managementToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify([
					{
						name: "FB_BOT_FLOW_JSON",
						value: flowJson,
					},
				]),
				cache: "no-store",
			},
		);
	} catch (err) {
		console.error("Network error publishing flow:", err);
		return NextResponse.json(
			{ error: "Failed to reach Supabase Management API." },
			{ status: 502 },
		);
	}

	if (!response.ok) {
		const errorText = await response.text();
		return NextResponse.json(
			{
				error: `Failed to publish flow to Supabase (${response.status}).`,
				details: errorText,
			},
			{ status: 500 },
		);
	}

	return NextResponse.json({ success: true });
}
