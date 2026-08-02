import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/flow/activate
 *
 * Activates a flow version and deactivates all other versions in the same
 * org + product_type. Body: { orgId: string, flowVersionId: string }
 * product_type is derived from the target version to prevent cross-product
 * collisions.
 *
 * Auth: same as publish (cron secret / internal API key).
 */
export async function POST(request: Request) {
	const authHeader = request.headers.get("authorization");
	const apiKey = request.headers.get("x-api-key");
	if (
		CRON_SECRET &&
		authHeader !== `Bearer ${CRON_SECRET}` &&
		apiKey !== CRON_SECRET
	) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: { orgId: string; flowVersionId: string };

	try {
		body = (await request.json()) as typeof body;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	if (!body.orgId || !body.flowVersionId) {
		return NextResponse.json(
			{ error: "Missing required fields: orgId, flowVersionId" },
			{ status: 400 },
		);
	}

	const sb = createServiceClient();

	try {
		// Load the target version and derive its product_type. Scoping the
		// lookup by org prevents activating a version from another org.
		const { data: target } = await sb
			.from("flow_versions")
			.select("id, organization_id, product_type")
			.eq("id", body.flowVersionId)
			.eq("organization_id", body.orgId)
			.maybeSingle();

		if (!target) {
			return NextResponse.json(
				{ error: "Flow version not found" },
				{ status: 404 },
			);
		}

		// Deactivate all other versions in the same org + product_type
		const { error: deactivateError } = await sb
			.from("flow_versions")
			.update({ is_active: false })
			.eq("organization_id", body.orgId)
			.eq("product_type", target.product_type)
			.eq("is_active", true);

		if (deactivateError) {
			capture(deactivateError, { context: "agent-gateway: flow activate" });
			return NextResponse.json(
				{
					error: "Failed to deactivate other versions",
					details: deactivateError.message,
				},
				{ status: 500 },
			);
		}

		// Activate the target version
		const { error: activateError } = await sb
			.from("flow_versions")
			.update({ is_active: true })
			.eq("id", body.flowVersionId);

		if (activateError) {
			capture(activateError, { context: "agent-gateway: flow activate" });
			return NextResponse.json(
				{ error: "Failed to activate version", details: activateError.message },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			flowVersionId: body.flowVersionId,
			productType: target.product_type,
		});
	} catch (err) {
		capture(err, { context: "agent-gateway: flow activate" });
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
