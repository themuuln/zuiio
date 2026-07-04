import { NextResponse } from "next/server";
import crypto from "crypto";
import { getEffectivePageAccessToken } from "@/lib/facebookConnection";

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
const APP_SECRET = process.env.FB_APP_SECRET;
const GRAPH_API_VERSION = process.env.FB_GRAPH_API_VERSION || "v25.0";

/**
 * Handles GET requests to verify the webhook.
 * Called by Facebook when you set up your webhook URL.
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const mode = searchParams.get("hub.mode");
	const token = searchParams.get("hub.verify_token");
	const challenge = searchParams.get("hub.challenge");

	if (mode === "subscribe" && token && VERIFY_TOKEN && token === VERIFY_TOKEN) {
		return new NextResponse(challenge, { status: 200 });
	}

	return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * Handles POST requests from Facebook when a user sends a message.
 * Signature verification is REQUIRED — requests without a valid
 * HMAC-SHA256 signature are rejected.
 */
export async function POST(request: Request) {
	try {
		const bodyText = await request.text();

		// --- SIGNATURE VERIFICATION (required) ---
		if (!APP_SECRET) {
			console.error(
				"FB_APP_SECRET is not set. Webhook cannot verify signatures. Rejecting request.",
			);
			return NextResponse.json(
				{ error: "Server misconfiguration" },
				{ status: 500 },
			);
		}

		const signature = request.headers.get("x-hub-signature-256");
		if (!signature) {
			return NextResponse.json({ error: "Missing signature" }, { status: 401 });
		}

		const expectedSignature = `sha256=${crypto
			.createHmac("sha256", APP_SECRET)
			.update(bodyText)
			.digest("hex")}`;

		if (signature !== expectedSignature) {
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}
		// -------------------------------------------

		const body = JSON.parse(bodyText);

		if (body.object !== "page") {
			return NextResponse.json({ error: "Not Found" }, { status: 404 });
		}

		for (const entry of body.entry) {
			const webhookEvent = entry.messaging?.[0];
			if (!webhookEvent) continue;

			const senderPsid = webhookEvent.sender?.id;
			if (senderPsid && webhookEvent.message?.text) {
				await sendTextMessage(senderPsid, `Echo: ${webhookEvent.message.text}`);
			}
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("Error handling webhook:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

async function sendTextMessage(senderPsid: string, text: string) {
	const pageAccessToken = await getEffectivePageAccessToken();
	if (!pageAccessToken) {
		console.warn("Missing FB_PAGE_ACCESS_TOKEN. Cannot send reply.");
		return;
	}

	const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages`;

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				recipient: { id: senderPsid },
				message: { text },
				access_token: pageAccessToken,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error("Unable to send message:", errorData);
		}
	} catch (error) {
		console.error("Error sending message:", error);
	}
}
