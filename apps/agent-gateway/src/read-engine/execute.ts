import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompiledQuery, QueryResult, ColumnMeta } from "./types";

/**
 * Executes a compiled PostgREST query via the Supabase client.
 *
 * The compiled query's `params` map (select, filters, order, limit, offset)
 * is applied to the Supabase query builder. The tenant filter is always
 * present in params (injected at compile time), so org isolation is enforced
 * even though the LLM never supplied it.
 */
export async function executeCompiledQuery(
	compiled: CompiledQuery,
	supabase: SupabaseClient,
): Promise<QueryResult> {
	const start = performance.now();
	const dataset = compiled.sourceQuery.dataset;
	const params = compiled.params;

	// Build base select
	let query = supabase.from(dataset).select(params.select ?? "*", {
		count: compiled.sourceQuery.includeCount ? "exact" : undefined,
	});

	// Apply filters (everything except "select", "order", "limit", "offset", "request.prefer")
	for (const [field, raw] of Object.entries(params)) {
		if (
			field === "select" ||
			field === "order" ||
			field === "limit" ||
			field === "offset" ||
			field === "request.prefer"
		) {
			continue;
		}

		const dotIdx = raw.indexOf(".");
		if (dotIdx === -1) continue;
		const op = raw.slice(0, dotIdx);
		const val = raw.slice(dotIdx + 1);

		// @ts-expect-error - dynamic operator application
		query = query[op](field, val);
	}

	// Order: "field.asc" or "field.desc" joined by ","
	if (params.order) {
		const orders = params.order.split(", ");
		for (const o of orders) {
			const [field, dir] = o.split(".");
			query = query.order(field, { ascending: dir !== "desc" });
		}
	}

	// Limit / offset
	if (params.limit !== undefined) {
		const limit = Number(params.limit);
		const offset = params.offset !== undefined ? Number(params.offset) : 0;
		query = query.range(offset, offset + limit - 1);
	}

	const { data, error, count } = await query;

	const executionTimeMs = performance.now() - start;

	if (error) {
		throw new Error(
			`Асуулга амжилтгүй боллоо (${dataset}): ${error.message}`,
		);
	}

	const rows = (data as unknown as Record<string, unknown>[] | null) ?? [];
	const columns: ColumnMeta[] = [{ name: dataset, displayName: dataset, type: "string" }];

	return {
		queryRef: compiled.sourceQuery.alias ?? dataset,
		columns,
		rows,
		rowCount: rows.length,
		totalCount: count ?? undefined,
		executionTimeMs,
	};
}
