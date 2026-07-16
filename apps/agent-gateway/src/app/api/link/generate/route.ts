import { capture } from "@zuiio/capture";
import { type NextRequest, NextResponse } from "next/server";
import { createCompactToken } from "@/lib/tokens";

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			orgId: string;
			userId: string;
			productType: string;
		};

		if (!body.orgId || !body.userId || !body.productType) {
			return NextResponse.json(
				{ error: "orgId, userId, and productType are required" },
				{ status: 400 },
			);
		}

		if (!["tolom", "zer"].includes(body.productType)) {
			return NextResponse.json(
				{ error: "productType must be 'tolom' or 'zer'" },
				{ status: 400 },
			);
		}

		const token = createCompactToken(body.orgId, body.userId, body.productType);
		const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "zuiio_bot";
		const telegramUrl = `https://t.me/${botUsername}?start=${token}`;

		return NextResponse.json({
			token,
			telegramUrl,
			expiresInMinutes: 15,
		});
	} catch (err) {
		capture(err, { context: "agent-gateway: compact token route" });
		return NextResponse.json(
			{ error: "Token generation failed" },
			{ status: 500 },
		);
	}
}
