import { describe, expect, it } from "vitest";
import {
  addProductToCart,
  buildSaleFormData,
  cartCount,
  cartSubtotal,
  computeChange,
  lineTotal,
  type PosLine,
  type PosProduct,
  removeLine,
  setLineQuantity,
  setLineUnitPrice,
} from "./pos";

const product = (overrides: Partial<PosProduct> = {}): PosProduct => ({
  id: "p1",
  name: "Бүтээгдэхүүн 1",
  sale_price: 5000,
  current_stock: 10,
  unit: "ш",
  barcode: "1234567890",
  image_url: null,
  has_variants: false,
  ...overrides,
});

const line = (overrides: Partial<PosLine> = {}): PosLine => ({
  productId: "p1",
  productName: "Бүтээгдэхүүн 1",
  unitPrice: 5000,
  quantity: 1,
  stock: 10,
  imageUrl: null,
  unit: "ш",
  ...overrides,
});

describe("addProductToCart", () => {
  it("adds a new product as a single line", () => {
    const result = addProductToCart([], product());
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1);
    expect(result[0].unitPrice).toBe(5000);
  });

  it("increments quantity when the same product is tapped again", () => {
    const once = addProductToCart([], product());
    const twice = addProductToCart(once, product());
    expect(twice).toHaveLength(1);
    expect(twice[0].quantity).toBe(2);
  });

  it("caps quantity at tracked stock", () => {
    const full = [line({ quantity: 10, stock: 10 })];
    const result = addProductToCart(full, product());
    expect(result[0].quantity).toBe(10);
  });

  it("does not cap when stock is not tracked", () => {
    const unlimited = [line({ quantity: 50, stock: null })];
    const result = addProductToCart(
      unlimited,
      product({ current_stock: null }),
    );
    expect(result[0].quantity).toBe(51);
  });

  it("does not add a product whose tracked stock is zero", () => {
    const result = addProductToCart([], product({ current_stock: 0 }));
    expect(result).toHaveLength(0);
  });

  it("does not add a variant whose tracked stock is zero", () => {
    const base = product({ current_stock: 10, has_variants: true });
    const result = addProductToCart([], base, {
      id: "v1",
      label: "Улаан",
      salePrice: 6000,
      stock: 0,
    });
    expect(result).toHaveLength(0);
  });

  it("adds a product with untracked stock even when zero", () => {
    const result = addProductToCart([], product({ current_stock: null }));
    expect(result).toHaveLength(1);
  });

  it("treats a variant as its own line", () => {
    const base = product({ has_variants: true });
    const withVariant = addProductToCart([], base, {
      id: "v1",
      label: "Улаан",
      salePrice: 6000,
      stock: 5,
    });
    const withVariantAgain = addProductToCart(withVariant, base, {
      id: "v1",
      label: "Улаан",
      salePrice: 6000,
      stock: 5,
    });
    const withOtherVariant = addProductToCart(withVariantAgain, base, {
      id: "v2",
      label: "Цэнхэр",
      salePrice: 6000,
      stock: 5,
    });
    expect(withOtherVariant).toHaveLength(2);
    expect(withOtherVariant[0].quantity).toBe(2);
    expect(withOtherVariant[0].variantId).toBe("v1");
    expect(withOtherVariant[1].variantId).toBe("v2");
    expect(withOtherVariant[0].unitPrice).toBe(6000);
  });

  it("uses the variant stock cap, not the product stock", () => {
    const base = product({ current_stock: 10, has_variants: true });
    const result = addProductToCart([], base, {
      id: "v1",
      label: "Улаан",
      salePrice: 6000,
      stock: 2,
    });
    const capped = addProductToCart(result, base, {
      id: "v1",
      label: "Улаан",
      salePrice: 6000,
      stock: 2,
    });
    const atCap = addProductToCart(capped, base, {
      id: "v1",
      label: "Улаан",
      salePrice: 6000,
      stock: 2,
    });
    expect(atCap[0].quantity).toBe(2);
  });

  it("falls back to the product price when the variant has none", () => {
    const base = product({ sale_price: 4000, has_variants: true });
    const result = addProductToCart([], base, {
      id: "v1",
      label: "Улаан",
      salePrice: null,
      stock: null,
    });
    expect(result[0].unitPrice).toBe(4000);
  });
});

describe("setLineQuantity", () => {
  it("clamps below 1 to 1", () => {
    const result = setLineQuantity([line()], 0, 0);
    expect(result[0].quantity).toBe(1);
  });

  it("clamps above tracked stock", () => {
    const result = setLineQuantity([line({ stock: 3 })], 0, 99);
    expect(result[0].quantity).toBe(3);
  });

  it("ignores out-of-range indexes", () => {
    const lines = [line()];
    expect(setLineQuantity(lines, 5, 4)).toBe(lines);
    expect(setLineQuantity(lines, -1, 4)).toBe(lines);
  });
});

describe("removeLine", () => {
  it("removes the line at the index", () => {
    const lines = [line(), line({ productId: "p2", productName: "Б" })];
    const result = removeLine(lines, 0);
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe("p2");
  });

  it("ignores out-of-range indexes", () => {
    const lines = [line()];
    expect(removeLine(lines, 2)).toBe(lines);
  });
});

describe("setLineUnitPrice", () => {
  it("overrides the unit price", () => {
    const result = setLineUnitPrice([line()], 0, 3500);
    expect(result[0].unitPrice).toBe(3500);
  });

  it("clamps negative prices to zero", () => {
    const result = setLineUnitPrice([line()], 0, -5);
    expect(result[0].unitPrice).toBe(0);
  });
});

describe("totals", () => {
  it("computes line totals, subtotal and item count", () => {
    const lines = [
      line({ quantity: 2, unitPrice: 5000 }),
      line({ productId: "p2", productName: "Б", quantity: 1, unitPrice: 1500 }),
    ];
    expect(lineTotal(lines[0])).toBe(10000);
    expect(cartSubtotal(lines)).toBe(11500);
    expect(cartCount(lines)).toBe(3);
  });

  it("empty cart totals to zero", () => {
    expect(cartSubtotal([])).toBe(0);
    expect(cartCount([])).toBe(0);
  });
});

describe("computeChange", () => {
  it("returns the difference when tendered exceeds the total", () => {
    expect(computeChange(20000, 15000)).toBe(5000);
  });

  it("returns zero when tendered equals the total", () => {
    expect(computeChange(15000, 15000)).toBe(0);
  });

  it("returns zero when tendered is short", () => {
    expect(computeChange(10000, 15000)).toBe(0);
  });
});

describe("buildSaleFormData", () => {
  it("builds the createSale FormData contract", () => {
    const formData = buildSaleFormData({
      lines: [line({ quantity: 2, unitPrice: 5000 })],
      paymentMethod: "cash",
      customerName: "Бат",
      customerPhone: "99111111",
      notes: "хүргэлт",
    });

    expect(formData.get("items")).toBe(
      JSON.stringify([
        { productId: "p1", quantity: 2, unitPrice: 5000, variantId: null },
      ]),
    );
    expect(formData.get("paid_amount")).toBe("10000");
    expect(formData.get("payment_method")).toBe("cash");
    expect(formData.get("payment_splits")).toBe(
      JSON.stringify([{ method: "cash", amount: 10000 }]),
    );
    expect(formData.get("status")).toBe("completed");
    expect(String(formData.get("sale_date"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(String(formData.get("idempotency_key"))).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(formData.get("customer_name")).toBe("Бат");
    expect(formData.get("customer_phone")).toBe("99111111");
    expect(formData.get("notes")).toBe("хүргэлт");
  });

  it("omits customer fields when absent", () => {
    const formData = buildSaleFormData({
      lines: [line()],
      paymentMethod: "card",
    });
    expect(formData.get("customer_name")).toBeNull();
    expect(formData.get("customer_phone")).toBeNull();
    expect(formData.get("notes")).toBeNull();
    expect(formData.get("payment_method")).toBe("card");
  });

  it("includes the variant id in items", () => {
    const formData = buildSaleFormData({
      lines: [line({ variantId: "v1" })],
      paymentMethod: "invoice",
    });
    const items = JSON.parse(String(formData.get("items"))) as Array<{
      variantId: string | null;
    }>;
    expect(items[0].variantId).toBe("v1");
  });
});
