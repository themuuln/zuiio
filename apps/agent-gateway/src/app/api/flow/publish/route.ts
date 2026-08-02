import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import type { FlowEdge, FlowNode, FlowNodeKind } from "@/flow-executor/types";
import { createServiceClient } from "@/lib/supabase";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/flow/publish
 *
 * Publishes a flow from Zatly to the flow_versions table.
 * Called by Zatly when the user clicks "Publish".
 *
 * Body: {
 *   automationId: string,      // Zatly's automation ID
 *   orgId: string,             // Organization ID
 *   productType: string,       // "zer" | "tolom" | "zatly"
 *   nodes: FlowNode[],         // The flow graph nodes
 *   edges: FlowEdge[],         // The flow graph edges
 *   channel?: string,          // Target channel (null = any)
 *   triggerKeywords?: string[], // Keyword triggers
 *   metadata?: { name?, description? }
 * }
 */
export async function POST(request: Request) {
	// Auth: either cron secret or internal API key
	const authHeader = request.headers.get("authorization");
	const apiKey = request.headers.get("x-api-key");
	if (
		CRON_SECRET &&
		authHeader !== `Bearer ${CRON_SECRET}` &&
		apiKey !== CRON_SECRET
	) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: {
		automationId: string;
		orgId: string;
		productType: string;
		nodes: FlowNode[];
		edges: FlowEdge[];
		channel?: string;
		triggerKeywords?: string[];
		metadata?: { name?: string; description?: string };
	};

	try {
		body = (await request.json()) as typeof body;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	// Validate required fields
	if (!body.orgId || !body.nodes || !body.edges) {
		return NextResponse.json(
			{ error: "Missing required fields: orgId, nodes, edges" },
			{ status: 400 },
		);
	}

	// Validate flow structure
	const validation = validateFlow(body.nodes, body.edges);
	if (!validation.ok) {
		return NextResponse.json(
			{ error: "Invalid flow", details: validation.errors },
			{ status: 400 },
		);
	}

	const sb = createServiceClient();

	try {
		// Get next version number for this org
		const { data: existing } = await sb
			.from("flow_versions")
			.select("version")
			.eq("organization_id", body.orgId)
			.order("version", { ascending: false })
			.limit(1);

		const nextVersion = (existing?.[0]?.version ?? 0) + 1;

		// Deactivate previous versions for this org + product_type + channel
		// (product_type scoping prevents cross-product collisions)
		await sb
			.from("flow_versions")
			.update({ is_active: false })
			.eq("organization_id", body.orgId)
			.eq("product_type", body.productType || "zatly")
			.eq("is_active", true)
			.or(`channel.is.null,channel.eq.${body.channel ?? ""}`);

		// Insert new version
		const { data: newVersion, error } = await sb
			.from("flow_versions")
			.insert({
				organization_id: body.orgId,
				product_type: body.productType || "zatly",
				nodes: body.nodes,
				edges: body.edges,
				channel: body.channel ?? null,
				trigger_keywords: body.triggerKeywords ?? [],
				is_active: true,
				version: nextVersion,
				metadata: {
					...body.metadata,
					automationId: body.automationId,
					publishedAt: new Date().toISOString(),
					version: nextVersion,
				},
			})
			.select("id")
			.single();

		if (error) {
			capture(error, { context: "agent-gateway: flow publish" });
			return NextResponse.json(
				{ error: "Failed to publish flow", details: error.message },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			flowVersionId: newVersion.id,
			version: nextVersion,
		});
	} catch (err) {
		capture(err, { context: "agent-gateway: flow publish" });
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_NODE_TYPES: FlowNodeKind[] = [
	"start",
	"sendMessage",
	"askQuestion",
	"condition",
	"setField",
	"delay",
	"action",
	"cardCarousel",
	"aiReply",
	"abTest",
];

function validateFlow(
	nodes: FlowNode[],
	edges: FlowEdge[],
): { ok: true } | { ok: false; errors: string[] } {
	const errors: string[] = [];

	if (nodes.length === 0) {
		errors.push("Flow must have at least one node");
	}

	// Must have exactly one start node
	const startNodes = nodes.filter((n) => n.type === "start");
	if (startNodes.length !== 1) {
		errors.push(
			`Flow must have exactly one start node (found ${startNodes.length})`,
		);
	}

	// All nodes must have valid types
	for (const node of nodes) {
		if (!VALID_NODE_TYPES.includes(node.type)) {
			errors.push(`Node ${node.id} has invalid type: ${node.type}`);
		}
		if (!node.id) {
			errors.push("All nodes must have an id");
		}
	}

	// All edges must reference existing nodes
	const nodeIds = new Set(nodes.map((n) => n.id));
	for (const edge of edges) {
		if (!nodeIds.has(edge.source)) {
			errors.push(
				`Edge ${edge.id} references unknown source node: ${edge.source}`,
			);
		}
		if (!nodeIds.has(edge.target)) {
			errors.push(
				`Edge ${edge.id} references unknown target node: ${edge.target}`,
			);
		}
	}

	// Start node must have an outgoing edge
	if (startNodes.length === 1) {
		const startId = startNodes[0]?.id;
		const hasOutgoing = edges.some((e) => e.source === startId);
		if (!hasOutgoing) {
			errors.push("Start node must have an outgoing edge");
		}
	}

	// Condition nodes must have both true and false branches
	const conditionNodes = nodes.filter((n) => n.type === "condition");
	for (const node of conditionNodes) {
		const outgoing = edges.filter((e) => e.source === node.id);
		const labels = outgoing.map((e) => e.label).filter(Boolean);
		if (!labels.includes("true") || !labels.includes("false")) {
			errors.push(
				`Condition node ${node.id} must have both "true" and "false" branch edges`,
			);
		}
	}

	if (errors.length > 0) {
		return { ok: false, errors };
	}

	return { ok: true };
}
