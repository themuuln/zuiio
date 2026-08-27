import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCustomerCartTools } from "@/gateway/customer-cart-tool";
import type { ToolContext } from "@/providers/types";

const state = {
	items: [] as Array<{
		product_id: string;
		quantity: number;
		variant_id?: string;
	}>,
	checkout_data: {},
};

const supabase = {
	from: vi.fn(() => {
		const chain = {
			select: vi.fn(() => chain),
			eq: vi.fn(() => chain),
			maybeSingle: vi.fn(async () => ({ data: state, error: null })),
			upsert: vi.fn((input: typeof state) => {
				state.items = input.items;
				state.checkout_data = input.checkout_data;
				return chain;
			}),
			single: vi.fn(async () => ({ data: state, error: null })),
			delete: vi.fn(() => chain),
		};
		return chain;
	}),
};

const context: ToolContext = {
	orgId: "11111111-1111-4111-8111-111111111111",
	userId: "sender-1",
	supabase: supabase as never,
	audience: "customer",
	productType: "zer",
	channel: "messenger",
	channelChatId: "page-1",
	channelUserId: "sender-1",
};

const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
	state.items = [];
	state.checkout_data = {};
	vi.clearAllMocks();
});

describe("customer cart tools", () => {
	it("persists and merges repeated product additions", async () => {
		const addToCart = createCustomerCartTools(context).find(
			(tool) => tool.name === "addToCart",
		);
		if (!addToCart) throw new Error("addToCart missing");

		await addToCart.execute({ product_id: PRODUCT_ID, quantity: 2 }, context);
		const result = await addToCart.execute(
			{ product_id: PRODUCT_ID, quantity: 3 },
			context,
		);

		expect(result).toMatchObject({
			items: [{ product_id: PRODUCT_ID, quantity: 5 }],
		});
		expect(supabase.from).toHaveBeenCalledWith("customer_carts");
	});
});
