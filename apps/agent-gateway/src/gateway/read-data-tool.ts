import "server-only";

import { capture } from "@zuiio/capture";
import type { GatewayTool, ToolContext } from "@/providers/types";
import type { ProductCatalog, ReadPlan } from "@/read-engine/types";
import { createReadEngine } from "@/read-engine";

import tolomReadCatalog from "@/read-engine/catalogs/tolom.json";
import zerReadCatalog from "@/read-engine/catalogs/zer.json";

/**
 * Per-product read catalog map. A product is wired to the dynamic `readData`
 * tool only when its read catalog exists here. Products without a catalog keep
 * their legacy inline read tools unchanged (see getProductTools in
 * webhook-helpers.ts). The Read Engine is rolled out one product at a time, and
 * a missing catalog MUST NOT silently disable reads.
 */
const READ_CATALOGS: Record<string, ProductCatalog> = {
	tolom: tolomReadCatalog as unknown as ProductCatalog,
	zer: zerReadCatalog as unknown as ProductCatalog,
};

/**
 * Build the single dynamic `readData` tool for a product.
 *
 * The LLM emits one `ReadPlan` (queries + optional derivation + response
 * format). The tool resolves the product's read catalog, then delegates to the
 * Read Engine, which validates the plan, compiles tenant-isolated PostgREST
 * queries, and executes them. No per-product read tool code lives here — adding
 * a queryable dataset is a catalog edit, not a code change.
 *
 * Returns `null` when the product has no read catalog (caller keeps legacy
 * inline read tools).
 */
export function createReadDataTool(productType: string, context: ToolContext): GatewayTool | null {
	const catalog = READ_CATALOGS[productType];
	if (!catalog) return null;

	const { supabase, orgId } = context;

	return {
		name: "readData",
		description:
			"Бүх бизнес өгөгдөл унших нэгдмэл багаж (Read Engine). " +
			"LLM нь ReadPlan объект дуудна: { queries: [...], derivation?, responseFormat? }. " +
			"Бүх уншилт organization_id-гаар тусгаарлагдана (LLM оруулахгүй). " +
			"Хэрэглэгчийн нэр, огноо, төлөв, дүн зэргээр шүүж, бүлэглэж, нэгтгэж болно.\n\n" +
			"Боломжтой хүснэгтүүд:\n" +
			Object.entries(catalog.datasets)
				.map(([id, ds]) => `- ${id}: ${ds.displayName}`)
				.join("\n"),
		parameters: [
			{
				name: "plan",
				type: "object",
				description:
					"ReadPlan объект. queries: [{ dataset, dimensions?, measures?, embeds?, filters?, sort?, limit?, offset?, includeCount? }]; derivation?: { type, queries?, label? }; responseFormat?: table|summary|comparison|detail. Жишээ: { queries: [{ dataset: \"work_orders\", filters: [{ field: \"status\", op: \"eq\", value: \"in_progress\" }], limit: 10 }] }",
				required: true,
			},
		],
		execute: async (args) => {
			try {
				const rawPlan = args.plan;
				if (typeof rawPlan !== "object" || rawPlan === null) {
					return { error: "readData: plan объект шаардлагатай" };
				}

				const plan = rawPlan as unknown as ReadPlan;

				const engine = createReadEngine({
					tenantId: orgId,
					supabaseUrl: process.env.SUPABASE_URL ?? "",
					supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
					catalog,
					supabase,
				});

				const result = await engine.execute(plan);
				return result;
			} catch (err) {
				capture(err, { context: "agent-gateway: readData" });
				return { error: "Өгөгдөл уншихад алдаа гарлаа" };
			}
		},
	};
}
