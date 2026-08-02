import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Flow Executor — A/B Analytics
 *
 * Aggregates conversation_runs by flow version + assignment variant.
 * `assignments` is a JSONB map (experiment_id → variant_id); supabase-js has
 * no groupBy, so we fetch the runs for the org and reduce in JS.
 */

/** A single experiment variant's run count for one flow version. */
export interface AbVariantCount {
	flowVersionId: string;
	experimentId: string;
	variantId: string;
	count: number;
}

/**
 * Aggregate A/B assignment counts for an org across all its flows.
 * Returns one row per (flow version, experiment node, variant), with the
 * number of conversation runs assigned to that variant.
 */
export async function getFlowAbResults(
	supabase: SupabaseClient,
	orgId: string,
): Promise<AbVariantCount[]> {
	const { data, error } = await supabase
		.from("conversation_runs")
		.select("flow_version_id, assignments")
		.eq("organization_id", orgId)
		.not("assignments", "is", null);

	if (error || !data) return [];

	const counts = new Map<string, number>();
	for (const run of data) {
		const assignments = (run.assignments ?? {}) as Record<string, string>;
		for (const [experimentId, variantId] of Object.entries(assignments)) {
			const key = `${run.flow_version_id}\u0000${experimentId}\u0000${variantId}`;
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
	}

	return [...counts.entries()].map(([key, count]) => {
		const [flowVersionId, experimentId, variantId] = key.split("\u0000");
		return { flowVersionId, experimentId, variantId, count };
	});
}
