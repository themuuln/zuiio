import { compileMutation } from "./compile";
import { executeMutation } from "./execute";
import type { WriteEngineConfig, WritePlan, WriteResult } from "./types";
import { validateWritePlan } from "./validate";

export type {
	WriteCatalog,
	WriteEngineConfig,
	WritePlan,
	WriteResult,
} from "./types";

/**
 * Top-level Write Engine entry point.
 *
 * Given a validated runtime config (tenantId + catalog + supabase) and an
 * LLM-emitted WritePlan, it:
 *   1. validates the plan against the catalog (fields, perms, tenant leak)
 *   2. compiles to a Supabase mutation (strips non-writable, injects org)
 *   3. executes with tenant isolation enforced at the query level
 *   4. returns a Mongolian-language WriteResult
 *
 * The caller (webhook-helpers writeData tool) never touches Supabase directly —
 * all isolation and validation lives here.
 */
export async function runWrite(
	config: WriteEngineConfig,
	plan: WritePlan,
): Promise<WriteResult> {
	const { tenantId, catalog, supabase } = config;

	const validation = validateWritePlan(plan, catalog);
	if (!validation.valid) {
		const first = validation.errors[0];
		return {
			success: false,
			message: first?.field
				? `Бичих төлөвлөгөө алдаатай: ${first.message}`
				: `Бичих төлөвлөөгөө алдаатай: ${first?.message ?? "тодорхойгүй"}`,
			warnings: validation.warnings,
		};
	}

	// If there were non-fatal warnings (stripped fields), surface them
	const compiled = compileMutation(plan, catalog, tenantId);
	const result = await executeMutation(compiled, catalog, supabase);
	if (validation.warnings.length > 0) {
		result.warnings = [...(result.warnings ?? []), ...validation.warnings];
	}
	return result;
}
