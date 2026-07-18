import type {
	WriteCatalog,
	WritePlan,
	CompiledMutation,
	WriteField,
	WriteOperationKind,
} from "./types";
import type { ProductCatalog } from "@/read-engine/types";

/**
 * Compiles a validated WritePlan into a Supabase-ready mutation.
 *
 * Deterministic: no DB, no LLM. It:
 *  - strips fields that don't exist in the catalog (defensive; validate() already warned)
 *  - strips fields marked writable:false (organization_id, deleted_at, …)
 *  - injects organization_id from the resolved tenant (NEVER from the plan)
 *  - for soft delete, sets deleted_at = now() and forces operation semantics to update
 *
 * The compiled payload is what execute() sends to Supabase. Tenant isolation is
 * guaranteed because organization_id is always injected here and never read
 * from the LLM's `data`.
 */
export function compileMutation(
	plan: WritePlan,
	catalog: WriteCatalog,
	tenantId: string,
): CompiledMutation {
	const dataset = catalog.datasets[plan.dataset];
	if (!dataset) {
		throw new Error(`Write dataset not found: ${plan.dataset}`);
	}

	const tenantColumn = catalog.tenant.column;
	const softDelete = plan.operation === "delete" ? (plan.softDelete ?? true) : false;

	const payload: Record<string, unknown> = {};

	// Copy only known, writable fields from the plan's data
	for (const [rawField, rawValue] of Object.entries(plan.data ?? {})) {
		if (rawField === tenantColumn) continue; // never trust LLM for tenant
		const field: WriteField | undefined = dataset.fields[rawField];
		if (!field) continue; // unknown → drop
		if (field.writable === false) continue; // protected → drop
		payload[rawField] = rawValue;
	}

	// ALWAYS inject tenant — the engine owns this, not the LLM
	payload[tenantColumn] = tenantId;

	// Soft delete → set deleted_at instead of removing the row
	if (softDelete) {
		payload["deleted_at"] = new Date().toISOString();
	}

	const operation: WriteOperationKind = softDelete ? "update" : plan.operation;

	const description = buildDescription(
		plan,
		dataset.displayName,
		tenantColumn,
		tenantId,
		softDelete,
	);

	return {
		source: dataset.source,
		operation,
		id: plan.id,
		payload,
		softDelete,
		tenantId,
		description,
	};
}

function buildDescription(
	plan: WritePlan,
	datasetName: string,
	tenantColumn: string,
	tenantId: string,
	softDelete: boolean,
): string {
	const op = softDelete ? "soft-delete" : plan.operation;
	const target = plan.id ? ` id=${plan.id}` : "";
	return `${op} ${datasetName}${target} | ${tenantColumn}=${tenantId}`;
}

// Re-export the shared type for callers that build catalogs from full ProductCatalogs.
export type { ProductCatalog };
