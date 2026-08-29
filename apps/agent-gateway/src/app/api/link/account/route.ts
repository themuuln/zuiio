import { capture } from "@zuiio/capture";
import { type NextRequest, NextResponse } from "next/server";
import { isGatewayApiKeyValid } from "@/lib/api-auth";
import { createCompactToken } from "@/lib/tokens";

export async function GET(request: NextRequest): Promise<NextResponse> {
	if (!isGatewayApiKeyValid(request)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	try {
		const params = request.nextUrl.searchParams;
		const orgId = params.get("orgId");
		const userId = params.get("userId");
		const productType = params.get("productType");
		const pageId = params.get("page") ?? params.get("pageId");
		if (
			!orgId ||
			!userId ||
			!pageId ||
			!["zer", "tolom"].includes(productType ?? "")
		) {
			return NextResponse.json(
				{ error: "orgId, userId, productType, and page are required" },
				{ status: 400 },
			);
		}
		const token = createCompactToken(
			orgId,
			userId,
			productType as "zer" | "tolom",
		);
		return NextResponse.json({
			token: `link_${token}`,
			linkingUrl: `https://m.me/${encodeURIComponent(pageId)}?ref=link_${token}`,
			expiresInMinutes: 15,
		});
	} catch (error) {
		capture(error, { context: "agent-gateway: account link generation" });
		return NextResponse.json(
			{ error: "Link generation failed" },
			{ status: 500 },
		);
	}
}
