import { describe, expect, it, vi } from "vitest";

import { createCustomerProductTool } from "@/gateway/customer-product-tool";
import { getProductTools } from "@/gateway/webhook-helpers";
import type { ToolContext } from "@/providers/types";
import { TEST_ORG_ID } from "../fixtures/supabase-mock";

/**
 * Customer tool surface — public catalog and customer checkout are available
 * only for Zer Messenger/Instagram, while internal business data stays closed.
 */
describe("getProductTools — customer audience", () => {
	const context: ToolContext = {
		orgId: TEST_ORG_ID,
		userId: "user-1",
		supabase: {} as never,
		audience: "customer",
	};

	it("adds durable cart and gated QPay checkout for Messenger and Instagram", () => {
		for (const channel of ["messenger", "instagram"] as const) {
			const tools = getProductTools("zer", { ...context, channel });
			expect(tools.map((t) => t.name)).toEqual([
				"searchProducts",
				"addToCart",
				"viewCart",
				"clearCart",
				"checkoutCartWithQpay",
			]);
		}
	});

	it("keeps webchat customer tools read-only until its checkout is wired", () => {
		const tools = getProductTools("zer", { ...context, channel: "webchat" });
		expect(tools.map((t) => t.name)).toEqual(["searchProducts"]);
	});

	it("returns no tools for tolom customers", () => {
		const tools = getProductTools("tolom", context);
		expect(tools).toEqual([]);
	});

	it("still returns the full internal tool set when audience is internal", () => {
		const tools = getProductTools("zer", { ...context, audience: "internal" });
		const names = tools.map((t) => t.name);
		expect(names).toContain("readData");
		expect(names).toContain("writeData");
		expect(names).not.toContain("searchProducts");
	});
});

describe("searchProducts tool", () => {
	const ORG = TEST_ORG_ID;

	function buildSupabase(rows: Array<Record<string, unknown>>) {
		const chain: Record<string, unknown> = {};
		chain.select = vi.fn(() => chain);
		chain.eq = vi.fn(() => chain);
		chain.or = vi.fn(() => chain);
		chain.order = vi.fn(() => chain);
		chain.limit = vi.fn(() => Promise.resolve({ data: rows, error: null }));
		const client = {
			from: vi.fn(() => chain),
			then: vi.fn((resolve: (v: unknown) => unknown) =>
				resolve({ data: rows, error: null }),
			),
		};
		return { client, chain };
	}

	it("scopes every query to the org and searches name/sku/barcode", async () => {
		const { client, chain } = buildSupabase([]);
		const tool = createCustomerProductTool({
			orgId: ORG,
			userId: "user-1",
			supabase: client as never,
		});

		await tool.execute({ query: "гитар" });

		expect(client.from).toHaveBeenCalledWith("products");
		expect(chain.eq).toHaveBeenCalledWith("organization_id", ORG);
		expect(chain.or).toHaveBeenCalledWith(
			'name.ilike."%гитар%",sku.ilike."%гитар%",barcode.ilike."%гитар%"',
		);
	});

	it("returns only whitelisted fields — never cost_price or min_stock", async () => {
		const { client } = buildSupabase([
			{
				id: "p1",
				name: "Гитар",
				sku: "GTR-1",
				barcode: "123456",
				description: "Акустик",
				sale_price: 450000,
				current_stock: 3,
				cost_price: 200000, // must never leak
				min_stock: 1, // must never leak
			},
		]);
		const tool = createCustomerProductTool({
			orgId: ORG,
			userId: "user-1",
			supabase: client as never,
		});

		const result = (await tool.execute({ query: "гитар" })) as {
			products: Array<Record<string, unknown>>;
		};
		const serialized = JSON.stringify(result);
		expect(result.products[0]).toEqual({
			id: "p1",
			name: "Гитар",
			sku: "GTR-1",
			barcode: "123456",
			description: "Акустик",
			salePrice: 450000,
			currentStock: 3,
		});
		expect(serialized).not.toContain("cost_price");
		expect(serialized).not.toContain("min_stock");
		expect(serialized).not.toContain("200000");
	});

	it("clamps limit to 1-10 with default 5 and omits the text filter when query is blank", async () => {
		const { client, chain } = buildSupabase([]);
		const tool = createCustomerProductTool({
			orgId: ORG,
			userId: "user-1",
			supabase: client as never,
		});

		// Blank query + no limit → default 5, no text filter.
		await tool.execute({ query: "  " });
		expect(chain.or).not.toHaveBeenCalled();
		expect(chain.limit).toHaveBeenCalledWith(5);

		// Limit 100 clamps to 10.
		await tool.execute({ query: "x", limit: 100 });
		expect(chain.limit).toHaveBeenCalledWith(10);

		// Limit 0 clamps to 1.
		await tool.execute({ query: "x", limit: 0 });
		expect(chain.limit).toHaveBeenCalledWith(1);

		await tool.execute({ query: "x", limit: 3 });
		expect(chain.limit).toHaveBeenCalledWith(3);
	});

	it("escapes ILIKE wildcards in the user query", async () => {
		const { client, chain } = buildSupabase([]);
		const tool = createCustomerProductTool({
			orgId: ORG,
			userId: "user-1",
			supabase: client as never,
		});

		await tool.execute({ query: "50%" });
		const orArg = chain.or.mock.calls[0]?.[0] as string;
		expect(orArg).toContain('name.ilike."%50\\%%"');
		expect(orArg).toContain('sku.ilike."%50\\%%"');
		expect(orArg).toContain('barcode.ilike."%50\\%%"');
	});

	it("returns a Mongolian error on query failure", async () => {
		// Make the chain resolve with an error
		const errorChain: Record<string, unknown> = {};
		errorChain.select = vi.fn(() => errorChain);
		errorChain.eq = vi.fn(() => errorChain);
		errorChain.or = vi.fn(() => errorChain);
		errorChain.order = vi.fn(() => errorChain);
		errorChain.limit = vi.fn(() =>
			Promise.resolve({ data: null, error: new Error("boom") }),
		);
		const errorClient = { from: vi.fn(() => errorChain) };

		const tool = createCustomerProductTool({
			orgId: ORG,
			userId: "user-1",
			supabase: errorClient as never,
		});

		const result = (await tool.execute({ query: "x" })) as {
			error: string;
		};
		expect(result.error).toBe("Бараа хайхад алдаа гарлаа");
	});
});
