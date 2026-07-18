import type {
	ProductCatalog,
	ReadPlan,
	ReadPlanQuery,
	ReadPlanValidationError,
	ValidationErrorCode,
} from "./types";

export interface ValidationResult {
	valid: boolean;
	errors: ReadPlanValidationError[];
}

const MAX_QUERIES = 10;

const VALID_FILTER_OPS: ReadPlanQuery["filters"] extends Array<infer F>
	? F extends { op: infer O }
		? O
		: never
	: never = [
	"eq",
	"neq",
	"gt",
	"gte",
	"lt",
	"lte",
	"like",
	"ilike",
	"in",
	"not_in",
	"is",
	"fts",
	"plfts",
	"match",
	"imatch",
] as never;

export function validateReadPlan(
	plan: ReadPlan,
	catalog: ProductCatalog,
	_tenantId: string,
): ValidationResult {
	const errors: ReadPlanValidationError[] = [];

	if (!plan.queries || plan.queries.length === 0) {
		errors.push({
			code: "EMPTY_PLAN",
			message: "Унших төлөвлөгөө хоосон байна (queries хоосон)",
		});
		return { valid: false, errors };
	}

	if (plan.queries.length > MAX_QUERIES) {
		errors.push({
			code: "TOO_MANY_QUERIES",
			message: `Унших төлөвлөгөөнд ${plan.queries.length} асуулга байна, хамгийн их ${MAX_QUERIES} байна`,
		});
		return { valid: false, errors };
	}

	plan.queries.forEach((query, queryIndex) => {
		validateQuery(query, queryIndex, catalog, errors);
	});

	return { valid: errors.length === 0, errors };
}

function validateQuery(
	query: ReadPlanQuery,
	queryIndex: number,
	catalog: ProductCatalog,
	errors: ReadPlanValidationError[],
): void {
	const dataset = catalog.datasets[query.dataset];
	if (!dataset) {
		errors.push({
			code: "DATASET_NOT_FOUND",
			message: `"${query.dataset}" өгөгдлийн багц олдсонгүй (catalog: ${catalog.id})`,
			queryIndex,
		});
		return;
	}

	const tenantColumn = catalog.tenant.column;

	// Measures and embeds are mutually exclusive (aggregate vs detail mode)
	if (
		query.measures &&
		query.measures.length > 0 &&
		query.embeds &&
		query.embeds.length > 0
	) {
		errors.push({
			code: "MUTUAL_EXCLUSIVE_MODES",
			message:
				"measures болон embeds нэгэн зэрэг ашиглагдахгүй (aggregate болон detail горим хоёулаа)",
			queryIndex,
		});
	}

	// Dimensions must be declared dimensions
	for (const dim of query.dimensions ?? []) {
		const field = dataset.fields[dim];
		if (!field) {
			errors.push({
				code: "FIELD_NOT_FOUND",
				message: `"${dim}" талбар олдсонгүй`,
				queryIndex,
				field: dim,
			});
			continue;
		}
		if (!field.dimension) {
			errors.push({
				code: "FIELD_NOT_DIMENSION",
				message: `"${dim}" талбар dimension биш`,
				queryIndex,
				field: dim,
			});
		}
	}

	// Measures must be aggregatable with allowed ops
	for (const m of query.measures ?? []) {
		const field = dataset.fields[m.field];
		if (!field) {
			errors.push({
				code: "FIELD_NOT_FOUND",
				message: `"${m.field}" талбар олдсонгүй`,
				queryIndex,
				field: m.field,
			});
			continue;
		}
		if (!field.measures || field.measures.length === 0) {
			errors.push({
				code: "FIELD_NOT_AGGREGATABLE",
				message: `"${m.field}" талбар нэгтгэгдэх боломжгүй`,
				queryIndex,
				field: m.field,
			});
		} else if (!field.measures.includes(m.op)) {
			errors.push({
				code: "INVALID_AGGREGATE_OP",
				message: `"${m.op}" үйлдэл "${m.field}" талбарт зөвшөөрөгдөхгүй`,
				queryIndex,
				field: m.field,
			});
		}
	}

	// Filters
	for (const f of query.filters ?? []) {
		if (f.field === tenantColumn) {
			errors.push({
				code: "TENANT_COLUMN_LEAKED",
				message: `Tenant талбар "${tenantColumn}" filter-т орж болохгүй (engine автоматаар нэмнэ)`,
				queryIndex,
				field: f.field,
			});
			continue;
		}
		const field = dataset.fields[f.field];
		if (!field) {
			errors.push({
				code: "FIELD_NOT_FOUND",
				message: `"${f.field}" талбар олдсонгүй`,
				queryIndex,
				field: f.field,
			});
			continue;
		}
		if (!(VALID_FILTER_OPS as readonly string[]).includes(f.op)) {
			errors.push({
				code: "INVALID_FILTER_OP",
				message: `"${f.op}" filter үйлдэл буруу`,
				queryIndex,
				field: f.field,
			});
		}
	}

	// Embeds must be valid relations
	for (const embed of query.embeds ?? []) {
		if (!dataset.relations || !dataset.relations[embed]) {
			errors.push({
				code: "EMBED_RELATION_NOT_FOUND",
				message: `"${embed}" холбоо "${query.dataset}" өгөгдлийн багц дээр олдсонгүй`,
				queryIndex,
				field: embed,
			});
		}
	}

	// Sort fields must exist
	for (const s of query.sort ?? []) {
		if (s.field !== "count" && !dataset.fields[s.field]) {
			const isMeasureAlias = (query.measures ?? []).some(
				(m) => m.alias === s.field,
			);
			if (!isMeasureAlias) {
				errors.push({
					code: "SORT_FIELD_NOT_FOUND",
					message: `"${s.field}" эрэмбэлэх талбар олдсонгүй`,
					queryIndex,
					field: s.field,
				});
			}
		}
	}
}
