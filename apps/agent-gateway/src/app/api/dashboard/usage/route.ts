import "server-only";

import { NextResponse } from "next/server";
import {
	createServiceClient,
	getSupabaseForProduct,
	type ServiceClient,
} from "@/lib/supabase";
import { getUsageStats } from "@/state/usage";

/**
 * GET /api/dashboard/usage?orgId=<id>&days=7
 * Returns usage statistics for a given organization.
 *
 * The org's product type is resolved from the gateway DB (channel
 * connections / telegram links). Tolom orgs keep their tool audit log in the
 * Tolom project while gateway state (spend/sessions/handoffs) lives in the
 * gateway project — both are queried.
 */
export async function GET(request: Request) {
	const url = new URL(request.url);
	const orgId = url.searchParams.get("orgId");
	const days = parseInt(url.searchParams.get("days") ?? "7", 10);

	if (!orgId) {
		return NextResponse.json(
			{ error: "orgId parameter is required" },
			{ status: 400 },
		);
	}

	const sb = createServiceClient();

	// Resolve the org's product type (best effort — falls back to the
	// gateway/Zer project as the audit source).
	let auditSb: ServiceClient | undefined;
	try {
		const [connection, link] = await Promise.all([
			sb
				.from("channel_connections")
				.select("product_type")
				.eq("organization_id", orgId)
				.limit(1)
				.maybeSingle(),
			sb
				.from("telegram_links")
				.select("product_type")
				.eq("organization_id", orgId)
				.limit(1)
				.maybeSingle(),
		]);
		const productType =
			connection.data?.product_type ?? link.data?.product_type;
		if (productType === "tolom") {
			auditSb = getSupabaseForProduct("tolom");
		}
	} catch {
		// Fall back to the gateway project for the audit source
	}

	const stats = await getUsageStats(sb, orgId, days, 0.14, auditSb);

	return NextResponse.json(stats);
}
