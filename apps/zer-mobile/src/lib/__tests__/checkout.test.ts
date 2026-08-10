import {
  buildProcessShopSaleParams,
  cartItemsToOrderItems,
  type ShopOrderInput,
  submitShopOrder,
  validateCheckoutInput,
} from "@/lib/checkout";
import type { RpcClient } from "@/lib/client";

function makeRpcClient(
  handler: (
    fn: string,
    args?: Record<string, unknown>,
  ) =>
    | { data: unknown; error: { message: string } | null }
    | Promise<{ data: unknown; error: { message: string } | null }>,
): RpcClient {
  return {
    rpc: (fn, args) => Promise.resolve(handler(fn, args)),
  };
}

function makeInput(overrides: Partial<ShopOrderInput> = {}): ShopOrderInput {
  return {
    slug: "my-shop",
    items: [
      { productId: "p1", name: "Бүтээгдэхүүн 1", unitPrice: 1500, quantity: 2 },
      { productId: "p2", name: "Бүтээгдэхүүн 2", unitPrice: 700, quantity: 1 },
    ],
    customerName: "Бат",
    customerPhone: "99112233",
    storeAccountId: "user-1",
    paymentMethod: "cash",
    ...overrides,
  };
}

describe("validateCheckoutInput", () => {
  it("accepts a valid order", () => {
    expect(validateCheckoutInput(makeInput())).toBeNull();
  });

  it("rejects an empty cart", () => {
    expect(validateCheckoutInput(makeInput({ items: [] }))).toContain(
      "Сагсанд",
    );
  });

  it("rejects a missing product name", () => {
    expect(
      validateCheckoutInput(
        makeInput({
          items: [{ productId: "p1", name: "", unitPrice: 100, quantity: 1 }],
        }),
      )?.toLowerCase(),
    ).toContain("бүтээгдэхүүн");
  });

  it("rejects zero/negative quantity", () => {
    expect(
      validateCheckoutInput(
        makeInput({
          items: [{ productId: "p1", name: "A", unitPrice: 100, quantity: 0 }],
        }),
      ),
    ).toContain("тоо");
  });

  it("rejects negative price", () => {
    expect(
      validateCheckoutInput(
        makeInput({
          items: [{ productId: "p1", name: "A", unitPrice: -5, quantity: 1 }],
        }),
      ),
    ).toContain("үнэ");
  });

  it("rejects a too-short customer name", () => {
    expect(validateCheckoutInput(makeInput({ customerName: "Б" }))).toContain(
      "нэр",
    );
  });

  it("rejects an invalid phone", () => {
    expect(
      validateCheckoutInput(makeInput({ customerPhone: "123" }))?.toLowerCase(),
    ).toContain("утас");
  });

  it("allows a missing phone", () => {
    expect(
      validateCheckoutInput(makeInput({ customerPhone: null })),
    ).toBeNull();
  });

  it("rejects delivery without an address", () => {
    expect(
      validateCheckoutInput(
        makeInput({ deliveryType: "delivery", address: "" }),
      ),
    ).toContain("хаяг");
  });

  it("accepts delivery with an address", () => {
    expect(
      validateCheckoutInput(
        makeInput({
          deliveryType: "delivery",
          address: "УБ, Сүхбаатар дүүрэг, 8-р хороо",
        }),
      ),
    ).toBeNull();
  });

  it("allows pickup without an address", () => {
    expect(
      validateCheckoutInput(
        makeInput({ deliveryType: "pickup", pickupBranchSlug: "ub-1" }),
      ),
    ).toBeNull();
  });
});

describe("buildProcessShopSaleParams", () => {
  it("maps items exactly like the web server action", () => {
    const params = buildProcessShopSaleParams(
      makeInput({ storeAccountId: "user-1" }),
      { orgId: "org-1", branchId: "branch-1" },
    );
    expect(params.p_org_id).toBe("org-1");
    expect(params.p_branch_id).toBe("branch-1");
    expect(params.p_user_id).toBe("user-1");
    expect(params.p_salesperson_id).toBe("user-1");
    expect(params.p_payment_method).toBe("cash");
    expect(params.p_total_amount).toBe(1500 * 2 + 700);
    expect(params.p_original_amount).toBe(params.p_total_amount);
    expect(params.p_paid_amount).toBe(params.p_total_amount);
    expect(params.p_items).toEqual([
      {
        product_id: "p1",
        quantity: 2,
        unit_price: 1500,
        total_price: 3000,
        commission_amount: 300,
        variant_id: "",
      },
      {
        product_id: "p2",
        quantity: 1,
        unit_price: 700,
        total_price: 700,
        commission_amount: 70,
        variant_id: "",
      },
    ]);
    expect(params.p_movements).toEqual([
      { product_id: "p1", quantity: 2, unit_cost: 1500, variant_id: "" },
      { product_id: "p2", quantity: 1, unit_cost: 700, variant_id: "" },
    ]);
  });

  it("passes through variant ids", () => {
    const params = buildProcessShopSaleParams(
      makeInput({
        items: [
          {
            productId: "p1",
            name: "A",
            unitPrice: 100,
            quantity: 1,
            variantId: "v1",
          },
        ],
      }),
      { orgId: "org-1", branchId: "branch-1" },
    );
    expect(params.p_items[0].variant_id).toBe("v1");
    expect(params.p_movements[0].variant_id).toBe("v1");
  });

  it("rounds totals to avoid floating-point drift", () => {
    const params = buildProcessShopSaleParams(
      makeInput({
        items: [{ productId: "p1", name: "A", unitPrice: 0.1, quantity: 3 }],
      }),
      { orgId: "org-1", branchId: "branch-1" },
    );
    expect(params.p_total_amount).toBe(0.3);
  });
});

describe("cartItemsToOrderItems", () => {
  it("maps cart items to the checkout input shape", () => {
    const result = cartItemsToOrderItems([
      {
        productId: "p1",
        name: "A",
        unitPrice: 100,
        unit: "ш",
        imageUrl: null,
        quantity: 2,
      },
    ]);
    expect(result).toEqual([
      {
        productId: "p1",
        name: "A",
        unitPrice: 100,
        quantity: 2,
        variantId: null,
      },
    ]);
  });
});

describe("submitShopOrder", () => {
  it("calls submit_shop_order with the slug + items and returns the order id", async () => {
    const rpc = jest.fn(
      async (_fn: string, _args?: Record<string, unknown>) => ({
        data: [{ order_id: "sale-123", total_amount: 3700, status: "pending" }],
        error: null,
      }),
    );
    const result = await submitShopOrder(makeRpcClient(rpc), makeInput());
    expect(result).toEqual({
      ok: true,
      saleId: "sale-123",
      reference: "sale-123",
      serverOrder: true,
      totalAmount: 3700,
      deliveryFee: null,
      discountAmount: null,
      giftCardAmount: null,
      paymentInstructions: null,
    });
    const call = rpc.mock.calls[0];
    expect(call[0]).toBe("submit_shop_order");
    const args = call[1] as Record<string, unknown>;
    expect(args).toMatchObject({
      p_org_slug: "my-shop",
      p_payment_method: "cash",
      p_currency_code: "MNT",
      p_contact_name: "Бат",
    });
    expect(args.p_items).toEqual([
      { product_id: "p1", quantity: 2, variant_id: "" },
      { product_id: "p2", quantity: 1, variant_id: "" },
    ]);
  });

  it("passes the client idempotency key to the RPC", async () => {
    const rpc = jest.fn(
      async (_fn: string, _args?: Record<string, unknown>) => ({
        data: [{ order_id: "sale-123", total_amount: 3700, status: "pending" }],
        error: null,
      }),
    );
    const key = "chk-abc123";
    await submitShopOrder(
      makeRpcClient(rpc),
      makeInput({ idempotencyKey: key }),
    );
    const args = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(args.p_idempotency_key).toBe(key);
  });

  it("passes delivery/pickup + coupon + gift card + email params through", async () => {
    const rpc = jest.fn(
      async (_fn: string, _args?: Record<string, unknown>) => ({
        data: [{ order_id: "sale-123", total_amount: 3700, status: "pending" }],
        error: null,
      }),
    );
    await submitShopOrder(
      makeRpcClient(rpc),
      makeInput({
        deliveryType: "delivery",
        address: "УБ, Сүхбаатар дүүрэг",
        addressNote: "1-р орц",
        email: "buyer@example.com",
        couponCode: "SAVE10",
        giftCardCode: "GC-123",
      }),
    );
    const args = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(args.p_delivery_type).toBe("delivery");
    expect(args.p_address).toBe("УБ, Сүхбаатар дүүрэг");
    expect(args.p_address_note).toBe("1-р орц");
    expect(args.p_contact_email).toBe("buyer@example.com");
    expect(args.p_coupon_code).toBe("SAVE10");
    expect(args.p_gift_card_code).toBe("GC-123");
    expect(args.p_pickup_branch_slug).toBeNull();
  });

  it("passes pickup branch slug and null delivery fields for pickup", async () => {
    const rpc = jest.fn(
      async (_fn: string, _args?: Record<string, unknown>) => ({
        data: [{ order_id: "sale-123", status: "pending" }],
        error: null,
      }),
    );
    await submitShopOrder(
      makeRpcClient(rpc),
      makeInput({ deliveryType: "pickup", pickupBranchSlug: "ub-1" }),
    );
    const args = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(args.p_delivery_type).toBe("pickup");
    expect(args.p_pickup_branch_slug).toBe("ub-1");
    expect(args.p_address).toBeNull();
    expect(args.p_coupon_code).toBeNull();
    expect(args.p_gift_card_code).toBeNull();
  });

  it("surfaces delivery fee, discount, gift card and payment instructions from the result row", async () => {
    const rpc = jest.fn(
      async (_fn: string, _args?: Record<string, unknown>) => ({
        data: [
          {
            order_id: "sale-123",
            total_amount: 3300,
            delivery_fee: 200,
            discount_amount: 400,
            gift_card_amount: 300,
            payment_instructions: {
              bank_name: "Хаан банк",
              bank_account: "5000123456",
              account_name: "Дэлгүүр ХХК",
              qpay_qr_url: null,
            },
          },
        ],
        error: null,
      }),
    );
    const result = await submitShopOrder(
      makeRpcClient(rpc),
      makeInput({
        deliveryType: "delivery",
        address: "УБ, Сүхбаатар дүүрэг",
        paymentMethod: "bank_transfer",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.deliveryFee).toBe(200);
    expect(result.discountAmount).toBe(400);
    expect(result.giftCardAmount).toBe(300);
    expect(result.totalAmount).toBe(3300);
    expect(result.paymentInstructions).toEqual({
      bank_name: "Хаан банк",
      bank_account: "5000123456",
      account_name: "Дэлгүүр ХХК",
      qpay_qr_url: null,
    });
  });

  it("returns VALIDATION_FAILED without calling the RPC", async () => {
    const rpc = jest.fn();
    const result = await submitShopOrder(
      makeRpcClient(rpc),
      makeInput({ customerName: "Б" }),
    );
    expect(result).toMatchObject({ ok: false, code: "VALIDATION_FAILED" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps business RPC errors to RPC_FAILED with the server message", async () => {
    const rpc = jest.fn(
      async (_fn: string, _args?: Record<string, unknown>) => ({
        data: null,
        error: { message: "Нөөц хүрэлцэхгүй байна" },
      }),
    );
    const result = await submitShopOrder(makeRpcClient(rpc), makeInput());
    expect(result).toMatchObject({ ok: false, code: "RPC_FAILED" });
    expect(result.ok === false && result.message).toContain(
      "Нөөц хүрэлцэхгүй байна",
    );
  });

  it("maps thrown network errors to NETWORK_ERROR", async () => {
    const rpc = jest.fn(() => {
      throw new TypeError("Network request failed");
    });
    const result = await submitShopOrder(makeRpcClient(rpc), makeInput());
    expect(result).toMatchObject({ ok: false, code: "NETWORK_ERROR" });
  });

  it("maps fetch-like error messages to NETWORK_ERROR", async () => {
    const rpc = jest.fn(
      async (_fn: string, _args?: Record<string, unknown>) => ({
        data: null,
        error: { message: "Failed to fetch" },
      }),
    );
    const result = await submitShopOrder(makeRpcClient(rpc), makeInput());
    expect(result).toMatchObject({ ok: false, code: "NETWORK_ERROR" });
  });

  it("maps an empty/unexpected result to RPC_FAILED", async () => {
    const rpc = jest.fn(
      async (_fn: string, _args?: Record<string, unknown>) => ({
        data: null,
        error: null,
      }),
    );
    const result = await submitShopOrder(makeRpcClient(rpc), makeInput());
    expect(result).toMatchObject({ ok: false, code: "RPC_FAILED" });
  });
});
