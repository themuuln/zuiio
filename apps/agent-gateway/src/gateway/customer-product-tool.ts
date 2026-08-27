import "server-only";

import { capture } from "@zuiio/capture";
import type { GatewayTool, ToolContext } from "@/providers/types";

/**
 * Customer-safe product catalog search for Zer.
 *
 * Messenger/Instagram customers get a fail-closed tool set: NO internal
 * business tools (sales, invoices, expenses, employees). The one exception is
 * this read-only product lookup, which is what a customer actually asks for
 * ("бараа байна уу?", "үнэ нь хэд вэ?", "ямар бараа байгаа?").
 *
 * Safety rules:
 * - Every query is scoped by context.orgId (never from LLM input).
 * - Only whitelisted fields are returned — NEVER cost_price or min_stock
 *   (internal margin data).
 * - No writes, no joins into sales/stock internals.
 */
export function createCustomerProductTool(context: ToolContext): GatewayTool {
	const { supabase, orgId } = context;

	return {
		name: "searchProducts",
		description:
			'Барааны каталог хайх (харилцагчид зориулсан). Нэр, SKU эсвэл баркодаар хайж, барааны нэр, тайлбар, борлуулалтын үнэ, үлдэгдэл тоо хэмжээг буцаана. Жишээ: searchProducts({ query: "гитар" }) эсвэл searchProducts({ query: "SKU-1024", limit: 5 }).',
		parameters: [
			{
				name: "query",
				type: "string",
				description:
					"Хайх текст — барааны нэр, SKU эсвэл баркод. Хоосон бол хамгийн сүүлийн бараанууд буцаана.",
				required: true,
			},
			{
				name: "limit",
				type: "number",
				description: "Буцаах барааны тоо (1-10, анхдагч 5).",
				required: false,
			},
		],
		execute: async (args) => {
			const rawQuery = args.query;
			const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
			const rawLimit = args.limit;
			const limit =
				typeof rawLimit === "number" && Number.isFinite(rawLimit)
					? Math.min(Math.max(Math.floor(rawLimit), 1), 10)
					: 5;

			try {
				let builder = supabase
					.from("products")
					.select(
						"id, name, sku, barcode, description, sale_price, current_stock",
					)
					.eq("organization_id", orgId);

				if (query) {
					const pattern = `%${escapeLike(query)}%`;
					// Quote the pattern so commas inside the query don't split the `or` filter.
					// PostgREST splits on unquoted commas; quoted values keep them.
					const quoted = `"${pattern.replace(/"/g, '\\"')}"`;
					builder = builder.or(
						`name.ilike.${quoted},sku.ilike.${quoted},barcode.ilike.${quoted}`,
					);
				}

				const { data, error } = await builder
					.order("created_at", {
						ascending: false,
					})
					.limit(limit);

				if (error) {
					capture(error, { context: "agent-gateway: searchProducts" });
					return { error: "Бараа хайхад алдаа гарлаа" };
				}

				return {
					products: (data ?? []).map((row) => ({
						id: row.id,
						name: row.name ?? null,
						sku: row.sku ?? null,
						barcode: row.barcode ?? null,
						description: row.description ?? null,
						salePrice: row.sale_price ?? null,
						currentStock: row.current_stock ?? null,
					})),
				};
			} catch (err) {
				capture(err, { context: "agent-gateway: searchProducts" });
				return { error: "Бараа хайхад алдаа гарлаа" };
			}
		},
	};
}

/** Escape special characters for PostgreSQL ILIKE patterns. */
function escapeLike(input: string): string {
	return input.replace(/[%_\\]/g, "\\$&");
}
