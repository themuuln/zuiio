import { NextResponse } from "next/server";
import { getEffectivePageAccessToken } from "@/lib/facebookConnection";

const GRAPH_API_VERSION = process.env.FB_GRAPH_API_VERSION || "v25.0";

type MenuAction = {
	type: "postback" | "web_url";
	title: string;
	payload?: string;
	url?: string;
};

type SetMenuBody = {
	call_to_actions?: MenuAction[];
	composer_input_disabled?: boolean;
};

async function graphRequest(
	method: "GET" | "POST" | "DELETE",
	pageAccessToken: string,
	body?: unknown,
) {
	const fieldsParam = method === "GET" ? "fields=persistent_menu&" : "";
	const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messenger_profile?${fieldsParam}access_token=${pageAccessToken}`;

	// For POST, include access_token in body to avoid it appearing in logs
	const postBody =
		method === "POST"
			? { ...(body as Record<string, unknown>), access_token: pageAccessToken }
			: body;

	const response = await fetch(url, {
		method,
		headers: { "Content-Type": "application/json" },
		body: postBody ? JSON.stringify(postBody) : undefined,
	});

	let json: unknown = null;
	try {
		json = await response.json();
	} catch {
		// Ignore non-JSON bodies.
	}

	if (!response.ok) {
		return {
			ok: false,
			status: response.status,
			json,
		};
	}

	return {
		ok: true,
		status: response.status,
		json,
	};
}

export async function GET() {
	const pageAccessToken = await getEffectivePageAccessToken();
	if (!pageAccessToken) {
		return NextResponse.json(
			{
				error:
					"Missing FB_PAGE_ACCESS_TOKEN or saved Facebook page connection.",
			},
			{ status: 400 },
		);
	}

	const result = await graphRequest("GET", pageAccessToken);
	if (!result.ok) {
		return NextResponse.json(
			{ error: "Failed to fetch persistent menu.", details: result.json },
			{ status: result.status },
		);
	}

	return NextResponse.json(result.json);
}

export async function POST(request: Request) {
	const pageAccessToken = await getEffectivePageAccessToken();
	if (!pageAccessToken) {
		return NextResponse.json(
			{
				error:
					"Missing FB_PAGE_ACCESS_TOKEN or saved Facebook page connection.",
			},
			{ status: 400 },
		);
	}

	let body: SetMenuBody;
	try {
		body = (await request.json()) as SetMenuBody;
	} catch {
		return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
	}

	if (
		!Array.isArray(body.call_to_actions) ||
		body.call_to_actions.length === 0
	) {
		return NextResponse.json(
			{ error: "call_to_actions is required and must be a non-empty array." },
			{ status: 400 },
		);
	}

	const payload = {
		persistent_menu: [
			{
				locale: "default",
				composer_input_disabled: Boolean(body.composer_input_disabled),
				call_to_actions: body.call_to_actions,
			},
		],
	};

	const result = await graphRequest("POST", pageAccessToken, payload);
	if (!result.ok) {
		return NextResponse.json(
			{ error: "Failed to set persistent menu.", details: result.json },
			{ status: result.status },
		);
	}

	return NextResponse.json({ success: true, data: result.json });
}

export async function DELETE() {
	const pageAccessToken = await getEffectivePageAccessToken();
	if (!pageAccessToken) {
		return NextResponse.json(
			{
				error:
					"Missing FB_PAGE_ACCESS_TOKEN or saved Facebook page connection.",
			},
			{ status: 400 },
		);
	}

	const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messenger_profile?fields=persistent_menu&access_token=${pageAccessToken}`;
	const response = await fetch(url, { method: "DELETE" });
	let json: unknown = null;
	try {
		json = await response.json();
	} catch {
		// Ignore non-JSON bodies.
	}

	if (!response.ok) {
		return NextResponse.json(
			{ error: "Failed to delete persistent menu.", details: json },
			{ status: response.status },
		);
	}
	return NextResponse.json({ success: true, data: json });
}
