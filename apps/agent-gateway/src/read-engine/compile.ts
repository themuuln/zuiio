import type {
	ProductCatalog,
	ReadPlanQuery,
	CompiledQuery,
	MeasureExpr,
	Filter,
	Sort,
	FieldType,
} from "./types";

export function compileQuery(
	query: ReadPlanQuery,
	catalog: ProductCatalog,
	tenantId: string,
): CompiledQuery {
	const dataset = catalog.datasets[query.dataset];
	const tenantColumn = catalog.tenant.column;

	const params: Record<string, string> = {};

	// ─── SELECT ──────────────────────────────────────────────────────────────
	const selectParts: string[] = [];
	const hasMeasures = (query.measures?.length ?? 0) > 0;
	const hasDimensions = (query.dimensions?.length ?? 0) > 0;

	if (hasMeasures || hasDimensions) {
		const fields: string[] = [];

		for (const dim of query.dimensions ?? []) {
			fields.push(dim);
		}

		for (const m of query.measures ?? []) {
			const agg = m.op;
			fields.push(`${m.field}.${agg}().${m.alias}`);
		}

		selectParts.push(fields.join(", "));
	} else if (query.embeds && query.embeds.length > 0) {
		// Detail mode: base fields + nested embeds
		selectParts.push("*");
	} else {
		selectParts.push("*");
	}

	// Embeds → nested select
	for (const embed of query.embeds ?? []) {
		const relation = dataset?.relations?.[embed];
		if (relation) {
			const targetFields =
				relation.fields && relation.fields.length > 0
					? relation.fields.join(", ")
					: "*";
			selectParts.push(`${embed}:${relation.dataset}(${targetFields})`);
		}
	}

	params.select = selectParts.join(", ");

	// ─── FILTERS ───────────────────────────────────────────────────────────────
	const filters: Filter[] = query.filters ?? [];
	for (const f of filters) {
		applyFilterParam(params, f);
	}

	// ALWAYS inject tenant filter
	applyFilterParam(params, {
		field: tenantColumn,
		op: "eq",
		value: tenantId,
	});

	// ─── ORDER ───────────────────────────────────────────────────────────────
	if (query.sort && query.sort.length > 0) {
		const orderParts = query.sort.map((s: Sort) => {
			return s.order === "desc" ? `${s.field}.desc` : `${s.field}.asc`;
		});
		params.order = orderParts.join(", ");
	}

	// ─── LIMIT / OFFSET ─────────────────────────────────────────────────────
	if (query.limit !== undefined) {
		const offset = query.offset ?? 0;
		params.limit = String(query.limit);
		params.offset = String(offset);
	}

	// ─── COUNT ──────────────────────────────────────────────────────────────
	if (query.includeCount) {
		params["request.prefer"] = "count=exact";
	}

	const description = buildDescription(query, hasMeasures, tenantColumn, tenantId);

	return {
		method: "GET",
		path: `/rest/v1/${dataset?.source ?? query.dataset}`,
		params,
		headers: {
			Authorization: "Bearer $SUPABASE_ANON_KEY",
			apikey: "$SUPABASE_ANON_KEY",
		},
		description,
		sourceQuery: query,
		tenantId,
	};
}

function applyFilterParam(params: Record<string, string>, f: Filter): void {
	const key = f.field;
	let value: string;

	switch (f.op) {
		case "in":
		case "not_in": {
			const list = (f.values ?? []).join(",");
			value = `${f.op}.(${list})`;
			break;
		}
		case "is": {
			value = `is.${f.value}`;
			break;
		}
		default: {
			value = `${f.op}.${f.value}`;
		}
	}

	params[key] = value;
}

function buildDescription(
	query: ReadPlanQuery,
	hasMeasures: boolean,
	tenantColumn: string,
	tenantId: string,
): string {
	const parts: string[] = [];
	parts.push(`GET /rest/v1/${query.dataset}`);

	if (hasMeasures) {
		parts.push(
			`aggregate ${query.measures?.map((m: MeasureExpr) => `${m.op}(${m.field}) as ${m.alias}`).join(", ")}`,
		);
	} else {
		parts.push("detail rows");
	}

	if (query.dimensions && query.dimensions.length > 0) {
		parts.push(`group by ${query.dimensions.join(", ")}`);
	}

	parts.push(`tenant filter: ${tenantColumn}=${tenantId}`);

	return parts.join(" | ");
}
