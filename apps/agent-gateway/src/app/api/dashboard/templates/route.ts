import "server-only";

import { NextResponse } from "next/server";
import { FLOW_TEMPLATES, getFlowTemplate } from "@/flow-templates";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
	return NextResponse.json({
		templates: FLOW_TEMPLATES.map(({ id, name, description, productType }) => ({
			id,
			name,
			description,
			productType,
		})),
	});
}

export async function POST(request: Request) {
	let body: { organizationId?: string; orgId?: string; templateId?: string };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}
	const organizationId = body.organizationId ?? body.orgId;
	if (!organizationId || !body.templateId)
		return NextResponse.json(
			{ error: "organizationId and templateId are required" },
			{ status: 400 },
		);
	const template = getFlowTemplate(body.templateId);
	if (!template)
		return NextResponse.json({ error: "Template not found" }, { status: 404 });
	const sb = createServiceClient();
	try {
		const { data: existing } = await sb
			.from("flow_versions")
			.select("version")
			.eq("organization_id", organizationId)
			.order("version", { ascending: false })
			.limit(1);
		const version = (existing?.[0]?.version ?? 0) + 1;
		await sb
			.from("flow_versions")
			.update({ is_active: false })
			.eq("organization_id", organizationId)
			.eq("product_type", template.productType)
			.eq("is_active", true);
		const { data, error } = await sb
			.from("flow_versions")
			.insert({
				organization_id: organizationId,
				product_type: template.productType,
				nodes: template.flow.nodes,
				edges: template.flow.edges,
				channel: null,
				trigger_keywords: template.flow.triggerKeywords ?? [],
				is_active: true,
				version,
				metadata: {
					...template.flow.metadata,
					templateId: template.id,
					version,
					publishedAt: new Date().toISOString(),
				},
			})
			.select("id, organization_id, product_type, version, is_active, metadata")
			.single();
		if (error || !data)
			return NextResponse.json(
				{ error: "Failed to instantiate template" },
				{ status: 500 },
			);
		return NextResponse.json({ flow: data }, { status: 201 });
	} catch {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
