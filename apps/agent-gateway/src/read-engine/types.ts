/**
 * Read Engine type definitions.
 *
 * The Read Engine replaces 10+ hardcoded data tools with ONE dynamic `readData` tool.
 * The LLM emits a ReadPlan → the engine validates it against a ProductCatalog →
 * compiles to PostgREST queries → executes in parallel → reduces/derives results.
 *
 * Two JSON schemas validate the data contracts:
 * - catalog-schema.json  → validates ProductCatalog instances
 * - read-plan-schema.json → validates LLM-emitted ReadPlan instances
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Product Catalog ────────────────────────────────────────────────────────

/**
 * Declarative data model for a product (Tolom, Zer, etc.).
 * Each product provides one catalog JSON file. The Read Engine uses it to:
 * 1. Validate LLM read plans (dataset/field existence, allowed ops)
 * 2. Compile to PostgREST (select syntax, embed syntax, filter operators)
 * 3. Inject tenant isolation (organization_id from JWT)
 * 4. Format results (Mongolian display names, currency formatting)
 */
export interface ProductCatalog {
	/** Unique product identifier. Routes read plans to the correct catalog. */
	id: string;
	/** Product name in Mongolian. Example: "Толом". */
	name: string;
	/** One-line description in Mongolian. Helps the LLM understand the domain. */
	description: string;
	/** Catalog schema version (semver). Used to detect stale catalogs. */
	version?: string;
	/** Tenant isolation config. Engine injects this filter at compile time. */
	tenant: TenantConfig;
	/** Dataset definitions keyed by ID (PostgREST table/view name). */
	datasets: Record<string, Dataset>;
	/** Business-level derived metrics keyed by ID. Optional query templates. */
	metrics?: Record<string, Metric>;
}

/** Tenant isolation configuration. */
export interface TenantConfig {
	/** Column holding the org/tenant ID. Always injected by the engine. */
	column: string;
	/** Where the tenant ID comes from: "jwt" (runtime) or "config" (test). */
	source: "jwt" | "config";
}

// ─── Dataset ────────────────────────────────────────────────────────────────

/**
 * A queryable dataset (PostgREST table or view).
 * Describes all columns, which are dimensions/measures, and FK relations.
 */
export interface Dataset {
	/** PostgREST table/view name. Maps to GET /rest/v1/{source}. */
	source: string;
	/** Dataset name in Mongolian. Example: "Ажлын захиалга". */
	displayName: string;
	/** Column definitions keyed by name. Every column should be listed. */
	fields: Record<string, Field>;
	/** FK relations for PostgREST resource embedding. Keyed by alias. */
	relations?: Record<string, Relation>;
}

/** Column definition within a dataset. */
export interface Field {
	/** Postgres-compatible type. Determines which PostgREST filter operators apply. */
	type: FieldType;
	/** Primary key column. Used for count(*). */
	pk?: boolean;
	/** Can be used as a GROUP BY dimension in aggregate queries. */
	dimension?: boolean;
	/** Is a time/timestamp field. Suitable for temporal filters and sorting. */
	time?: boolean;
	/** Allowed aggregate operations. Empty/absent = not aggregatable. */
	measures?: AggregateOp[];
	/** Field name in Mongolian for LLM context and formatting. */
	displayName?: string;
	/** Display format hint for result formatting. */
	format?: FieldFormat;
	/** Whether the column can be NULL. Default: true. */
	nullable?: boolean;
	/** Allowed enum values with Mongolian labels. Constrains LLM filter values. */
	enumValues?: EnumValue[];
}

/** Postgres-compatible field types. */
export type FieldType =
	| "uuid"
	| "string"
	| "number"
	| "text"
	| "timestamp"
	| "boolean";

/** Display format for result rendering. */
export type FieldFormat =
	| "currency"
	| "percentage"
	| "duration"
	| "phone"
	| "email"
	| "date"
	| "datetime";

/** Enum value with display label. */
export interface EnumValue {
	/** The actual database value. */
	value: string;
	/** Mongolian display label. */
	label: string;
}

/** Allowed aggregate operations. Maps to PostgREST aggregate functions. */
export type AggregateOp = "sum" | "avg" | "count" | "min" | "max";

// ─── Relations ──────────────────────────────────────────────────────────────

/**
 * FK relationship for PostgREST resource embedding.
 * PostgREST only supports joins via foreign keys — no arbitrary JOINs.
 * The alias is used in select: ?select=*,<alias>:<target>(<fields>).
 */
export interface Relation {
	/** Target dataset ID (must exist in the same catalog). */
	dataset: string;
	/** FK column on the SOURCE dataset referencing the target's PK. */
	join: string;
	/** Relation name in Mongolian. Example: "Харилцагч". */
	displayName?: string;
	/** Cardinality. "one-to-one" = FK on this table. "one-to-many" = FK on target. */
	type?: "one-to-one" | "one-to-many";
	/** Subset of target fields to include when embedding. Absent = all fields. */
	fields?: string[];
}

// ─── Metrics ────────────────────────────────────────────────────────────────

/**
 * Business-level derived metric. A pre-defined query template the LLM
 * can reference by name instead of constructing a full read plan query.
 */
export interface Metric {
	/** Metric name in Mongolian. Example: "Өдрийн орлого". */
	displayName: string;
	/** What this metric measures, in Mongolian. */
	description: string;
	/** Dataset ID this metric queries. Must exist in datasets. */
	query: string;
	/** Aggregations to compute. Same shape as ReadPlanMeasureExpr. */
	measures: MetricMeasure[];
	/** Optional time field for automatic time-range scoping. */
	timeField?: string;
	/** Static filters always applied. Example: status IN ('completed','delivered'). */
	filters?: Filter[];
}

/** Aggregation in a metric definition. */
export interface MetricMeasure {
	/** Field to aggregate. Use "*" for count(*). */
	field: string;
	/** Aggregate operation. */
	op: AggregateOp;
	/** Output column name. */
	alias?: string;
}

// ─── Read Plan (LLM Output) ────────────────────────────────────────────────

/**
 * Structured query plan emitted by the LLM as the `readData` tool argument.
 * The Read Engine validates, compiles, and executes this.
 */
export interface ReadPlan {
	/** Queries to execute. All run in parallel. Max 5. */
	queries: [ReadPlanQuery, ...ReadPlanQuery[]]; // non-empty array
	/** How to combine results from multiple queries. */
	derivation?: Derivation;
	/** Response format hint for the formatting layer. */
	responseFormat?: ResponseFormat;
}

/** Response format for result rendering. */
export type ResponseFormat = "table" | "summary" | "comparison" | "detail";

/**
 * A single dataset query.
 * Two modes:
 *   - Detail mode: embeds (no measures) — returns rows with nested related data
 *   - Aggregate mode: dimensions + measures — returns grouped/aggregated results
 */
export interface ReadPlanQuery {
	/** Optional label for referencing in derivations and result keys. */
	alias?: string;
	/** Dataset ID to query. Must exist in the product catalog. */
	dataset: string;
	/** Fields to GROUP BY. Local ("status") or relation-prefixed ("customer.full_name"). */
	dimensions?: string[];
	/** Aggregations to compute. Each compiles to a PostgREST aggregate in select. */
	measures?: MeasureExpr[];
	/** Relations to embed inline. Only for detail queries (mutually exclusive with measures). */
	embeds?: string[];
	/** WHERE conditions applied before aggregation. Tenant filter added automatically. */
	filters?: Filter[];
	/** ORDER BY. Sort by dimensions or measure aliases. */
	sort?: Sort[];
	/** Max rows. Default 20, max 100. */
	limit?: number;
	/** Row offset for pagination. */
	offset?: number;
	/** Include total row count in response (Prefer: count=exact). */
	includeCount?: boolean;
}

/** Aggregation expression in a read plan query. */
export interface MeasureExpr {
	/** Field to aggregate. Use "*" for count(*). Must exist in the dataset. */
	field: string;
	/** Aggregate operation. Requires pgrst.db_aggregates_enabled = true. */
	op: AggregateOp;
	/** Output column name. Referenced by sort and derivation. Must be unique within the query. */
	alias: string;
}

/** Filter condition. Maps to PostgREST query string parameters. */
export interface Filter {
	/** Column name. NEVER "organization_id" — the engine injects it. */
	field: string;
	/** Filter operator. Maps to PostgREST operator syntax. */
	op: FilterOp;
	/** Single value for comparison operators (eq, gt, etc.) and is. */
	value?: string | number | boolean | null;
	/** Multiple values for in/not_in operators. */
	values?: (string | number)[];
}

/** PostgREST filter operators. */
export type FilterOp =
	| "eq" // =   field=eq.value
	| "neq" // ≠   field=neq.value
	| "gt" // >   field=gt.value
	| "gte" // ≥   field=gte.value
	| "lt" // <   field=lt.value
	| "lte" // ≤   field=lte.value
	| "like" // SQL LIKE     field=like.value
	| "ilike" // SQL ILIKE    field=ilike.value
	| "in" // IN list      field=in.(v1,v2,v3)
	| "not_in" // NOT IN       field=not.in.(v1,v2,v3)
	| "is" // IS NULL/TRUE/FALSE  field=is.null|true|false
	| "fts" // Full text search    field=fts.value
	| "plfts" // Phrase FTS          field=plfts.value
	| "match" // Regex match         field=match.value
	| "imatch"; // Case-insensitive regex  field=imatch.value

/** Sort specification. */
export interface Sort {
	/** Field name or measure alias to sort by. */
	field: string;
	/** Sort direction. */
	order: "asc" | "desc";
}

/**
 * Instruction for combining results from multiple queries.
 * Only meaningful when ReadPlan.queries has 2+ entries.
 */
export interface Derivation {
	/** Combination strategy. */
	type: "sum" | "merge" | "compare" | "concat" | "none";
	/** Field to operate on (e.g., measure alias for sum/compare). */
	targetField?: string;
	/** Human-readable description in Mongolian. */
	description?: string;
}

// ─── Compiled Query (PostgREST) ─────────────────────────────────────────────

/**
 * A fully compiled PostgREST query, ready to execute.
 * Generated by the compiler from ReadPlanQuery + ProductCatalog + tenantId.
 */
export interface CompiledQuery {
	/** HTTP method. Always GET for reads. */
	method: "GET";
	/** PostgREST API path. Example: "/rest/v1/work_orders". */
	path: string;
	/** Query string parameters. Includes select, filters, sort, limit, offset. */
	params: Record<string, string>;
	/** Request headers. Includes Authorization and Prefer. */
	headers: Record<string, string>;
	/** Human-readable description of what this query does (for debugging). */
	description: string;
	/** The original read plan query this was compiled from. */
	sourceQuery: ReadPlanQuery;
	/** The resolved tenant ID (for audit logging). */
	tenantId: string;
}

// ─── Engine Configuration ───────────────────────────────────────────────────

/**
 * Runtime configuration for the Read Engine.
 * Created once per request from the GatewayContext + product catalog.
 */
export interface ReadEngineConfig {
	/** Tenant/organization ID resolved from JWT. NEVER from LLM input. */
	tenantId: string;
	/** Supabase project URL. Example: "https://xyz.supabase.co". */
	supabaseUrl: string;
	/** Supabase anon/publishable key for the REST API. */
	supabaseAnonKey: string;
	/** The product catalog for this request's product. */
	catalog: ProductCatalog;
	/** Supabase client instance for execution. */
	supabase: SupabaseClient;
}

// ─── Engine Result ──────────────────────────────────────────────────────────

/**
 * Final output from the Read Engine after executing all queries
 * and applying derivations.
 */
export interface ReadEngineResult {
	/** Per-query results, in the same order as the read plan. */
	queries: QueryResult[];
	/** Combined/derived result if derivation was specified. */
	derived?: DerivedResult;
	/** Execution metadata. */
	meta: ExecutionMeta;
}

/**
 * Result from a single compiled query execution.
 */
export interface QueryResult {
	/** Query identifier (alias or dataset name). */
	queryRef: string;
	/** Column metadata with display names and types. */
	columns: ColumnMeta[];
	/** Row data. Each row is a key-value map. */
	rows: Record<string, unknown>[];
	/** Number of rows returned (after limit). */
	rowCount: number;
	/** Total matching rows before limit/offset. Only present if includeCount was true. */
	totalCount?: number;
	/** Query execution time in milliseconds. */
	executionTimeMs: number;
}

/** Column metadata for result rendering. */
export interface ColumnMeta {
	/** PostgREST column/alias name. */
	name: string;
	/** Mongolian display name from the catalog. Falls back to name if not in catalog. */
	displayName: string;
	/** Field type for formatting decisions. */
	type: FieldType;
	/** Display format (currency, percentage, etc.). */
	format?: FieldFormat;
}

/**
 * Combined result from a derivation over multiple query results.
 */
export interface DerivedResult {
	/** The derivation type that produced this result. */
	type: Derivation["type"];
	/** Combined row data. */
	rows: Record<string, unknown>[];
	/** Column metadata. */
	columns: ColumnMeta[];
	/** Human-readable description of what was derived. */
	description: string;
}

/** Execution metadata for debugging and performance monitoring. */
export interface ExecutionMeta {
	/** Number of PostgREST queries executed. */
	totalQueries: number;
	/** Total wall-clock time including compilation, execution, and derivation. */
	totalExecutionTimeMs: number;
	/** Compilation or execution warnings (non-fatal). */
	warnings: string[];
	/** Whether any result came from a cache. */
	cacheHit: boolean;
}

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Validation error from Read Plan → Catalog validation.
 * Returned by the validator before compilation.
 */
export interface ReadPlanValidationError {
	/** Error category. */
	code: ValidationErrorCode;
	/** Human-readable error message (Mongolian). */
	message: string;
	/** Query index in the plan (0-based), if the error is query-specific. */
	queryIndex?: number;
	/** The invalid field path, if applicable. */
	field?: string;
}

/** Validation error codes. */
export type ValidationErrorCode =
	| "DATASET_NOT_FOUND"
	| "FIELD_NOT_FOUND"
	| "FIELD_NOT_DIMENSION"
	| "FIELD_NOT_AGGREGATABLE"
	| "INVALID_AGGREGATE_OP"
	| "INVALID_FILTER_OP"
	| "INVALID_FILTER_VALUE"
	| "EMBED_RELATION_NOT_FOUND"
	| "MUTUAL_EXCLUSIVE_MODES"
	| "SORT_FIELD_NOT_FOUND"
	| "TENANT_COLUMN_LEAKED"
	| "EMPTY_PLAN"
	| "TOO_MANY_QUERIES";

// ─── System Prompt Fragment ─────────────────────────────────────────────────

/**
 * The catalog summary injected into the LLM system prompt.
 * This tells the LLM what datasets, dimensions, measures, and metrics
 * are available so it can construct valid ReadPlans.
 */
export interface CatalogPromptFragment {
	/** Product name. */
	productName: string;
	/** Dataset summaries for the LLM context. */
	datasets: DatasetPromptSummary[];
	/** Metric summaries for the LLM context. */
	metrics: MetricPromptSummary[];
}

/** LLM-facing dataset summary. */
export interface DatasetPromptSummary {
	/** Dataset ID (PostgREST table name). */
	id: string;
	/** Mongolian display name. */
	displayName: string;
	/** Available dimension fields. */
	dimensions: { name: string; displayName?: string }[];
	/** Available measure fields with their allowed ops. */
	measures: { name: string; displayName?: string; ops: AggregateOp[] }[];
	/** Available relation embeds. */
	relations: { alias: string; target: string; displayName?: string }[];
}

/** LLM-facing metric summary. */
export interface MetricPromptSummary {
	/** Metric ID. */
	id: string;
	/** Mongolian display name. */
	displayName: string;
	/** Description. */
	description: string;
	/** Which dataset to query. */
	query: string;
}
