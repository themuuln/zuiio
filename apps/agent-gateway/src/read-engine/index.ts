import type { SupabaseClient } from "@supabase/supabase-js";
import { compileQuery } from "./compile";
import { executeCompiledQuery } from "./execute";
import { applyDerivation } from "./reduce";
import type {
	ExecutionMeta,
	ProductCatalog,
	QueryResult,
	ReadEngineConfig,
	ReadEngineResult,
	ReadPlan,
} from "./types";
import type { ValidationResult } from "./validate";
import { validateReadPlan } from "./validate";

export class ReadEngine {
	private supabase: SupabaseClient;
	private catalog: ProductCatalog;
	private tenantId: string;

	constructor(config: ReadEngineConfig) {
		this.tenantId = config.tenantId;
		this.catalog = config.catalog;
		this.supabase = config.supabase;
	}

	async execute(plan: ReadPlan): Promise<ReadEngineResult> {
		const validation: ValidationResult = validateReadPlan(
			plan,
			this.catalog,
			this.tenantId,
		);

		const meta: ExecutionMeta = {
			totalQueries: 0,
			totalExecutionTimeMs: 0,
			warnings: [],
			cacheHit: false,
		};

		if (!validation.valid) {
			return {
				queries: [],
				meta: {
					...meta,
					warnings: validation.errors.map((e) => e.message),
				},
			};
		}

		const start = performance.now();

		const compiledQueries = plan.queries.map((q) =>
			compileQuery(q, this.catalog, this.tenantId),
		);

		const results: QueryResult[] = await Promise.all(
			compiledQueries.map((c) => executeCompiledQuery(c, this.supabase)),
		);

		const derived = applyDerivation(results, plan.derivation);

		const totalExecutionTimeMs = performance.now() - start;

		return {
			queries: results,
			derived,
			meta: {
				totalQueries: results.length,
				totalExecutionTimeMs,
				warnings: meta.warnings,
				cacheHit: false,
			},
		};
	}
}

export function createReadEngine(config: ReadEngineConfig): ReadEngine {
	return new ReadEngine(config);
}
