import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getRedis } from "@/lib/redis";

interface FacebookPage {
	id: string;
	name: string;
	access_token: string;
}

interface FacebookSelectSession {
	pages: FacebookPage[];
	userToken: string;
	orgId: string;
	productType: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
	const sid = new URL(request.url).searchParams.get("sid");
	if (!sid || !/^[0-9a-f-]{36}$/i.test(sid)) {
		return NextResponse.json(
			{ error: "Invalid OAuth session" },
			{ status: 400 },
		);
	}

	const redis = getRedis();
	if (!redis) {
		return NextResponse.json(
			{ error: "OAuth session unavailable" },
			{ status: 503 },
		);
	}

	const session = await redis.get<FacebookSelectSession>(`fb:select:${sid}`);
	if (!session) {
		return NextResponse.json(
			{ error: "OAuth session expired" },
			{ status: 410 },
		);
	}

	return NextResponse.json({
		pages: session.pages.map(({ id, name }) => ({ id, name })),
		orgId: session.orgId,
		productType: session.productType,
	});
}
