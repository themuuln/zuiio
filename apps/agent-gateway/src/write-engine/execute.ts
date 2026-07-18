import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompiledMutation, WriteResult, WriteCatalog } from "./types";

/**
 * Executes a compiled mutation against Supabase with tenant isolation enforced
 * at the query level (defense in depth: organization_id is in the payload AND
 * the filter for update/delete/select so a wrong PK can never cross orgs).
 *
 * Returns a Mongolian-language result the caller feeds back to the LLM.
 */
export async function executeMutation(
	mutation: CompiledMutation,
	catalog: WriteCatalog,
	supabase: SupabaseClient,
): Promise<WriteResult> {
	const tenantColumn = catalog.tenant.column;
	const { source, operation, id, payload, softDelete, tenantId } = mutation;

	const warnings: string[] = [];

	try {
		if (operation === "insert") {
			const { data, error } = await supabase
				.from(source)
				.insert(payload)
				.select()
				.single();

			if (error) {
				return { success: false, message: sanitize(error), warnings };
			}
			const newId = (data as Record<string, unknown>)?.[catalog.datasets[sourceToDatasetId(catalog, source)].pk] as string | undefined;
			return {
				success: true,
				message: "Амжилттай бүртгэгдлээ.",
				id: newId,
				data: data as Record<string, unknown>,
				warnings,
			};
		}

		if (operation === "update") {
			// Build a query that filters by PK AND tenant
			const ds = catalog.datasets[sourceToDatasetId(catalog, source)];
			let query = supabase
				.from(source)
				.update(payload)
				.eq(ds.pk, id as string)
				.eq(tenantColumn, tenantId);

			// Soft delete returns the row with deleted_at set
			const { data, error } = softDelete
				? await query.select().single()
				: await query.select().single();

			if (error) {
				return { success: false, message: sanitize(error), warnings };
			}
			return {
				success: true,
				message: softDelete ? "Амжилттай устгагалаа (soft)." : "Амжилттай шинэчлэгдлээ.",
				id: id,
				data: data as Record<string, unknown>,
				warnings,
			};
		}

		// Hard delete (softDelete=false)
		const ds = catalog.datasets[sourceToDatasetId(catalog, source)];
		const { error } = await supabase
			.from(source)
			.delete()
			.eq(ds.pk, id as string)
			.eq(tenantColumn, tenantId);

		if (error) {
			return { success: false, message: sanitize(error), warnings };
		}
		return { success: true, message: "Амжилттай устгагалаа.", id, warnings };
	} catch (err) {
		return {
			success: false,
			message: `Бичих үед алдаа гарлаа: ${err instanceof Error ? err.message : String(err)}`,
			warnings,
		};
	}
}

/** Maps a PostgREST source name back to a dataset id. */
function sourceToDatasetId(catalog: WriteCatalog, source: string): string {
	for (const [id, ds] of Object.entries(catalog.datasets)) {
		if (ds.source === source) return id;
	}
	return source;
}

/** Minimal DB error scrubber — never leak raw Postgres errors to the LLM. */
function sanitize(error: { message?: string; code?: string }): string {
	const msg = error?.message ?? "Тодорхойгүй алдаа";
	// Hide constraint/internal details
	if (/violates.*constraint/.test(msg)) {
		return "Өгөгдлийн нөхцөл зөрчилдлөө (constraint).";
	}
	if (/duplicate key/.test(msg)) {
		return "Ижил бүртгэл аль хэдийн байна.";
	}
	if (/foreign key/.test(msg)) {
		return "Холбоотой бичлэг олдсонгүй.";
	}
	return "Бичих үед алдаа гарлаа.";
}
