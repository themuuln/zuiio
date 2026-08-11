import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockStorefrontTools = vi.fn();
vi.mock("./storefront", () => ({
  createStorefrontAgentTools: (...args: unknown[]) =>
    mockStorefrontTools(...args),
}));

import { createBuyerAgentTools } from "./buyer";

const SLUG = "storefront-e2e-test";
const BASE_URL = "https://shop.example.mn";

type Tool = {
  name: string;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

function toolsWith(supabase: unknown): Record<string, Tool> {
  return Object.fromEntries(
    createBuyerAgentTools(supabase as never, SLUG, BASE_URL).map((t) => [
      t.name,
      t as Tool,
    ]),
  );
}

function rpcSupabase(result: { data?: unknown; error?: unknown } | null) {
  return {
    rpc: vi.fn().mockResolvedValue(result),
  };
}

describe("createBuyerAgentTools", () => {
  beforeEach(() => {
    mockStorefrontTools.mockReset().mockReturnValue([
      { name: "search_products", parameters: [], execute: async () => ({}) },
      { name: "get_product", parameters: [], execute: async () => ({}) },
      { name: "get_shop_info", parameters: [], execute: async () => ({}) },
    ]);
  });

  it("includes the storefront catalog tools plus place_order", () => {
    const tools = createBuyerAgentTools({} as never, SLUG, BASE_URL);
    const names = tools.map((t) => t.name);
    expect(names).toContain("search_products");
    expect(names).toContain("get_product");
    expect(names).toContain("get_shop_info");
    expect(names).toContain("place_order");
    expect(mockStorefrontTools).toHaveBeenCalledWith(
      expect.anything(),
      SLUG,
      BASE_URL,
    );
  });

  it("place_order submits normalized items and returns the order row", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          order_id: "ord-1",
          total_amount: 10000,
          status: "pending",
          delivery_fee: 0,
          discount_amount: 0,
          gift_card_amount: 0,
          payment_instructions: { bank: "Хаан банк" },
        },
      ],
      error: null,
    });
    const tools = toolsWith({ rpc });

    const result = await tools.place_order.execute({
      items: [
        { product_id: "p-1", quantity: 2 },
        { product_id: "p-2", quantity: "3", variant_id: "v-2" },
      ],
      contact_name: "Бат",
      contact_phone: "99112233",
      delivery_type: "delivery",
      address: "Улаанбаатар, СБД",
    });

    expect(result).toMatchObject({
      order_id: "ord-1",
      total_amount: 10000,
      status: "pending",
    });
    expect(rpc).toHaveBeenCalledWith("submit_shop_order", {
      p_org_slug: SLUG,
      p_items: [
        { product_id: "p-1", quantity: 2, variant_id: "" },
        { product_id: "p-2", quantity: 3, variant_id: "v-2" },
      ],
      p_payment_method: "cash",
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_delivery_type: "delivery",
      p_address: "Улаанбаатар, СБД",
      p_address_note: undefined,
      p_pickup_branch_slug: undefined,
      p_idempotency_key: expect.any(String),
    });
  });

  it("place_order rejects when items are missing or malformed", async () => {
    const rpc = vi.fn();
    const tools = toolsWith({ rpc });

    expect(
      await tools.place_order.execute({
        contact_name: "Бат",
        contact_phone: "99112233",
      }),
    ).toEqual({ error: "Захиалгын бүтээгдэхүүн буруу байна." });
    expect(
      await tools.place_order.execute({
        items: [{ product_id: "", quantity: 1 }],
        contact_name: "Бат",
        contact_phone: "99112233",
      }),
    ).toEqual({ error: "Захиалгын бүтээгдэхүүн буруу байна." });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("place_order requires name and phone", async () => {
    const tools = toolsWith(rpcSupabase({ data: [], error: null }));
    expect(
      await tools.place_order.execute({ items: [{ product_id: "p-1" }] }),
    ).toEqual({ error: "Нэр, утас шаардлагатай." });
  });

  it("place_order requires an address for delivery", async () => {
    const tools = toolsWith(rpcSupabase({ data: [], error: null }));
    expect(
      await tools.place_order.execute({
        items: [{ product_id: "p-1", quantity: 1 }],
        contact_name: "Бат",
        contact_phone: "99112233",
        delivery_type: "delivery",
      }),
    ).toEqual({ error: "Хүргэлтийн хаяг шаардлагатай." });
  });

  it("place_order surfaces the RPC error", async () => {
    const tools = toolsWith(
      rpcSupabase({ error: { message: "Нөөц хүрэлцэхгүй байна" } }),
    );
    expect(
      await tools.place_order.execute({
        items: [{ product_id: "p-1", quantity: 999 }],
        contact_name: "Бат",
        contact_phone: "99112233",
      }),
    ).toEqual({ error: "Нөөц хүрэлцэхгүй байна" });
  });

  it("place_order returns an error when no order row comes back", async () => {
    const tools = toolsWith(rpcSupabase({ data: [], error: null }));
    expect(
      await tools.place_order.execute({
        items: [{ product_id: "p-1", quantity: 1 }],
        contact_name: "Бат",
        contact_phone: "99112233",
      }),
    ).toEqual({ error: "Захиалга үүсгэхэд алдаа гарлаа." });
  });

  it("get_order_status returns the order row scoped to the shop", async () => {
    const org = { id: "org-1" };
    const from = vi.fn((table: string) => {
      if (table === "organizations") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: org, error: null }),
            }),
          }),
        };
      }
      if (table === "sales") {
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              eq: () => ({
                maybeSingle: async () =>
                  val === "ord-1"
                    ? {
                        data: {
                          id: "ord-1",
                          status: "pending",
                          total_amount: 10000,
                          created_at: "2026-08-11T00:00:00Z",
                        },
                        error: null,
                      }
                    : { data: null, error: null },
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    const tools = toolsWith({ from });

    const result = await tools.get_order_status.execute({ order_id: "ord-1" });
    expect(result).toMatchObject({ order_id: "ord-1", status: "pending" });
    expect(from).toHaveBeenCalledWith("sales");
  });

  it("get_order_status reports unknown orders", async () => {
    const from = vi.fn((table: string) => {
      if (table === "organizations") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { id: "org-1" }, error: null }),
            }),
          }),
        };
      }
      if (table === "sales") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    const tools = toolsWith({ from });

    expect(await tools.get_order_status.execute({ order_id: "nope" })).toEqual({
      error: "Захиалга олдсонгүй. Захиалгын дугаараа шалгана уу.",
    });
  });
});
