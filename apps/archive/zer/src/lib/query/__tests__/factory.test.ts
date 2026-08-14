/**
 * Tests for src/lib/query/keys.ts and src/lib/query/factory.ts
 */
import { describe, expect, it } from "vitest";
import {
  accountKeys,
  bomKeys,
  brandKeys,
  bundleKeys,
  categoryKeys,
  commissionKeys,
  contactKeys,
  couponKeys,
  discountKeys,
  expenseKeys,
  giftCardKeys,
  inventoryKeys,
  invoiceKeys,
  journalEntryKeys,
  laborKeys,
  movementKeys,
  orderTemplateKeys,
  productionKeys,
  productKeys,
  promotionKeys,
  purchaseKeys,
  qualityKeys,
  quotationKeys,
  returnKeys,
  roleKeys,
  saleKeys,
  variantKeys,
} from "../keys";

describe("query keys", () => {
  it("productKeys has expected structure", () => {
    expect(productKeys).toBeDefined();
    expect(typeof productKeys.all).toBe("function");
  });

  it("productKeys.all returns array", () => {
    const result = productKeys.all();
    expect(Array.isArray(result)).toBe(true);
  });

  it("saleKeys has expected structure", () => {
    expect(saleKeys).toBeDefined();
    expect(typeof saleKeys.all).toBe("function");
  });

  it("contactKeys has expected structure", () => {
    expect(contactKeys).toBeDefined();
    expect(typeof contactKeys.all).toBe("function");
  });

  it("expenseKeys has expected structure", () => {
    expect(expenseKeys).toBeDefined();
    expect(typeof expenseKeys.all).toBe("function");
  });

  it("inventoryKeys has expected structure", () => {
    expect(inventoryKeys).toBeDefined();
    expect(typeof inventoryKeys.all).toBe("function");
  });

  it("all key factories return stable entity keys", () => {
    const cases: Array<[() => readonly unknown[], readonly unknown[]]> = [
      [productKeys.all, ["products"]],
      [() => productKeys.lists("org-1"), ["products", "list", "org-1"]],
      [
        () => productKeys.detail("product-1"),
        ["products", "detail", "product-1"],
      ],
      [productKeys.definitions, ["products", "definitions"]],
      [saleKeys.all, ["sales"]],
      [() => saleKeys.lists("org-1"), ["sales", "list", "org-1"]],
      [() => saleKeys.detail("sale-1"), ["sales", "detail", "sale-1"]],
      [contactKeys.all, ["contacts"]],
      [() => contactKeys.lists("org-1"), ["contacts", "list", "org-1"]],
      [
        () => contactKeys.detail("contact-1"),
        ["contacts", "detail", "contact-1"],
      ],
      [expenseKeys.all, ["expenses"]],
      [() => expenseKeys.lists("org-1"), ["expenses", "list", "org-1"]],
      [
        () => expenseKeys.detail("expense-1"),
        ["expenses", "detail", "expense-1"],
      ],
      [inventoryKeys.all, ["inventory"]],
      [() => inventoryKeys.lists("org-1"), ["inventory", "list", "org-1"]],
      [() => inventoryKeys.detail("item-1"), ["inventory", "detail", "item-1"]],
      [categoryKeys.all, ["categories"]],
      [() => categoryKeys.lists("org-1"), ["categories", "list", "org-1"]],
      [
        () => categoryKeys.detail("category-1"),
        ["categories", "detail", "category-1"],
      ],
      [movementKeys.all, ["stock_movements"]],
      [() => movementKeys.lists("org-1"), ["stock_movements", "list", "org-1"]],
      [
        () => movementKeys.detail("movement-1"),
        ["stock_movements", "detail", "movement-1"],
      ],
      [variantKeys.all, ["product_variants"]],
      [
        () => variantKeys.byProduct("product-1"),
        ["product_variants", "by_product", "product-1"],
      ],
      [brandKeys.all, ["brands"]],
      [() => brandKeys.lists("org-1"), ["brands", "list", "org-1"]],
      [() => brandKeys.detail("brand-1"), ["brands", "detail", "brand-1"]],
      [commissionKeys.all, ["commissions"]],
      [
        () => commissionKeys.summary("org-1"),
        ["commissions", "summary", "org-1"],
      ],
      [
        () => commissionKeys.unpaidItems("org-1", "profile-1"),
        ["commissions", "unpaid", "org-1", "profile-1"],
      ],
      [
        () => commissionKeys.history("org-1"),
        ["commissions", "history", "org-1"],
      ],
      [bundleKeys.all, ["product_bundles"]],
      [() => bundleKeys.lists("org-1"), ["product_bundles", "list", "org-1"]],
      [
        () => bundleKeys.detail("bundle-1"),
        ["product_bundles", "detail", "bundle-1"],
      ],
      [invoiceKeys.all, ["invoices"]],
      [() => invoiceKeys.lists("org-1"), ["invoices", "list", "org-1"]],
      [
        () => invoiceKeys.detail("invoice-1"),
        ["invoices", "detail", "invoice-1"],
      ],
      [discountKeys.all, ["discounts"]],
      [() => discountKeys.lists("org-1"), ["discounts", "list", "org-1"]],
      [
        () => discountKeys.detail("discount-1"),
        ["discounts", "detail", "discount-1"],
      ],
      [couponKeys.all, ["coupons"]],
      [() => couponKeys.lists("org-1"), ["coupons", "list", "org-1"]],
      [() => couponKeys.detail("coupon-1"), ["coupons", "detail", "coupon-1"]],
      [promotionKeys.all, ["promotions"]],
      [() => promotionKeys.lists("org-1"), ["promotions", "list", "org-1"]],
      [
        () => promotionKeys.detail("promotion-1"),
        ["promotions", "detail", "promotion-1"],
      ],
      [giftCardKeys.all, ["gift_cards"]],
      [() => giftCardKeys.lists("org-1"), ["gift_cards", "list", "org-1"]],
      [
        () => giftCardKeys.detail("gift-card-1"),
        ["gift_cards", "detail", "gift-card-1"],
      ],
      [quotationKeys.all, ["quotations"]],
      [() => quotationKeys.lists("org-1"), ["quotations", "list", "org-1"]],
      [
        () => quotationKeys.detail("quotation-1"),
        ["quotations", "detail", "quotation-1"],
      ],
      [returnKeys.all, ["returns"]],
      [() => returnKeys.lists("org-1"), ["returns", "list", "org-1"]],
      [() => returnKeys.detail("return-1"), ["returns", "detail", "return-1"]],
      [purchaseKeys.all, ["purchase_orders"]],
      [() => purchaseKeys.lists("org-1"), ["purchase_orders", "list", "org-1"]],
      [
        () => purchaseKeys.detail("purchase-1"),
        ["purchase_orders", "detail", "purchase-1"],
      ],
      [accountKeys.all, ["accounts"]],
      [() => accountKeys.lists("org-1"), ["accounts", "list", "org-1"]],
      [
        () => accountKeys.detail("account-1"),
        ["accounts", "detail", "account-1"],
      ],
      [journalEntryKeys.all, ["journal_entries"]],
      [
        () => journalEntryKeys.lists("org-1"),
        ["journal_entries", "list", "org-1"],
      ],
      [
        () => journalEntryKeys.detail("entry-1"),
        ["journal_entries", "detail", "entry-1"],
      ],
      [roleKeys.all, ["roles"]],
      [() => roleKeys.lists("org-1"), ["roles", "list", "org-1"]],
      [() => roleKeys.detail("role-1"), ["roles", "detail", "role-1"]],
      [orderTemplateKeys.all, ["order_templates"]],
      [bomKeys.all, ["boms"]],
      [productionKeys.all, ["production_orders"]],
      [
        () => productionKeys.detail("production-1"),
        ["production_orders", "detail", "production-1"],
      ],
      [qualityKeys.all, ["quality_checks"]],
      [
        () => qualityKeys.detail("quality-1"),
        ["quality_checks", "detail", "quality-1"],
      ],
      [
        () => qualityKeys.summary("production-1"),
        ["quality_checks", "summary", "production-1"],
      ],
      [laborKeys.all, ["production_stage_labor"]],
      [
        () => laborKeys.stage("stage-1"),
        ["production_stage_labor", "stage", "stage-1"],
      ],
      [
        () => laborKeys.costSummary("production-1"),
        ["production_stage_labor", "cost", "production-1"],
      ],
    ];

    for (const [factory, expected] of cases) {
      expect(factory()).toEqual(expected);
    }
  });
});
