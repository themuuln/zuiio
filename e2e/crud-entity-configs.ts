/**
 * Entity configurations for the reusable CRUD test factory.
 *
 * Add a new entity → its tests are generated automatically.
 * Placeholders: UNIQUE_ID → E2E-{timestamp}, UNIQUE_EMAIL → e2e-{timestamp}@test.mn
 *
 * Entity levels:
 *   LEVEL 2 (create + list verify): Customers, Suppliers, Warehouses
 *   LEVEL 3 (list page loads only): everything else
 *
 * To promote an entity from 3→2: add `createFields` and `listAssertText: "UNIQUE_ID"`
 * To add edit: add `edit` config  (requires working create first)
 * To add delete: add `delete` config (requires working create first)
 */

import type { EntityConfig } from "./crud-factory";

// ── LEVEL 2: Create + list verify ──────────────────────────────────────────

export const CUSTOMERS_CONFIG: EntityConfig = {
  name: "Харилцагчид (Customers)",
  listUrl: "/customers",
  listTitle: "Харилцагчид",
  create: {
    type: "drawer",
    triggerText: "Харилцагч бүртгэх",
    formId: "customer-form",
  },
  createFields: [
    { id: "name", value: "UNIQUE_ID" },
    { id: "phone", value: "99112233", optional: true },
    { id: "email", value: "UNIQUE_EMAIL", optional: true },
    { id: "address", value: "E2E address", optional: true },
  ],
  submitText: "Хадгалах",
  listAssertText: "UNIQUE_ID",
};

export const SUPPLIERS_CONFIG: EntityConfig = {
  name: "Нийлүүлэгчид (Suppliers)",
  listUrl: "/suppliers",
  listTitle: "Нийлүүлэгчид",
  create: {
    type: "drawer",
    triggerText: "Нийлүүлэгч бүртгэх",
    formId: "supplier-form",
  },
  createFields: [
    { id: "name", value: "UNIQUE_ID" },
    { id: "phone", value: "99112233", optional: true },
    { id: "email", value: "UNIQUE_EMAIL", optional: true },
    { id: "address", value: "E2E address", optional: true },
  ],
  submitText: "Хадгалах",
  listAssertText: "UNIQUE_ID",
};

export const WAREHOUSES_CONFIG: EntityConfig = {
  name: "Агуулахууд (Warehouses)",
  listUrl: "/inventory/warehouses",
  listTitle: "Агуулахууд",
  create: { type: "dialog", triggerText: "Шинэ агуулах" },
  createFields: [
    { id: "name", value: "UNIQUE_ID" },
    { id: "location", value: "E2E Location", optional: true },
  ],
  submitText: "Агуулах нэмэх",
  listAssertText: "UNIQUE_ID",
};

// ── LEVEL 3: List page loads only ──────────────────────────────────────────

export const PRODUCTS_CONFIG: EntityConfig = {
  name: "Бүтээгдэхүүн (Products)",
  listUrl: "/products",
  listTitle: "Бүтээгдэхүүн",
  create: {
    type: "drawer",
    triggerText: "Шинэ бүтээгдэхүүн",
    formId: "product-form",
  },
  createFields: [],
  submitText: "Хадгалах",
  listAssertText: "Бүтээгдэхүүн",
};

export const DISCOUNTS_CONFIG: EntityConfig = {
  name: "Хямдралууд (Discounts)",
  listUrl: "/discounts",
  listTitle: "Хямдрал",
  create: {
    type: "drawer",
    triggerText: "Шинэ хямдрал",
    formId: "discount-form",
  },
  createFields: [],
  submitText: "Хадгалах",
  listAssertText: "Хямдрал",
};

export const CATEGORIES_CONFIG: EntityConfig = {
  name: "Ангилалууд (Categories)",
  listUrl: "/inventory/categories",
  listTitle: "Ангилалууд",
  create: {
    type: "drawer",
    triggerText: "Ангилал нэмэх",
    formId: "category-form",
  },
  createFields: [],
  submitText: "Хадгалах",
  listAssertText: "Ангилалууд",
};

export const BRANCHES_CONFIG: EntityConfig = {
  name: "Салбарууд (Branches)",
  listUrl: "/settings/branches",
  listTitle: "Салбарууд",
  create: { type: "dialog", triggerText: "Шинэ салбар" },
  createFields: [],
  submitText: "Салбар нэмэх",
  listAssertText: "Салбарууд",
};

export const EXPENSES_CONFIG: EntityConfig = {
  name: "Зарлага (Expenses)",
  listUrl: "/expenses",
  listTitle: "Зарлага",
  create: {
    type: "drawer",
    triggerText: "Шинэ зарлага",
    formId: "expense-form",
  },
  createFields: [],
  submitText: "Зарлага хадгалах",
  listAssertText: "Зарлага",
};

export const PURCHASES_CONFIG: EntityConfig = {
  name: "Худалдан авалт (Purchases)",
  listUrl: "/purchases",
  listTitle: "Худалдан авалт",
  create: {
    type: "drawer",
    triggerText: "Шинэ захиалга",
    formId: "purchase-form",
  },
  createFields: [],
  submitText: "Захиалга үүсгэх",
  listAssertText: "Худалдан авалт",
};

export const INVOICES_CONFIG: EntityConfig = {
  name: "Нэхэмжлэл (Invoices)",
  listUrl: "/invoices",
  listTitle: "Нэхэмжлэл",
  create: {
    type: "drawer",
    triggerText: "Шинэ нэхэмжлэл",
    formId: "invoice-form",
  },
  createFields: [],
  submitText: "Нэхэмжлэл үүсгэх",
  listAssertText: "Нэхэмжлэл",
};

export const QUOTATIONS_CONFIG: EntityConfig = {
  name: "Үнийн санал (Quotations)",
  listUrl: "/quotations",
  listTitle: "Үнийн санал",
  create: {
    type: "drawer",
    triggerText: "Шинэ үнийн санал",
    formId: "quotation-form",
  },
  createFields: [],
  submitText: "Үнийн санал үүсгэх",
  listAssertText: "Үнийн санал",
};

export const RETURNS_CONFIG: EntityConfig = {
  name: "Буцаалт (Returns)",
  listUrl: "/returns",
  listTitle: "Буцаалт",
  create: {
    type: "drawer",
    triggerText: "Шинэ буцаалт",
    formId: "return-form",
  },
  createFields: [],
  submitText: "Буцаалт үүсгэх",
  listAssertText: "Буцаалт",
};

export const SALES_CONFIG: EntityConfig = {
  name: "Борлуулалт (Sales)",
  listUrl: "/sales",
  listTitle: "Борлуулалт",
  create: {
    type: "drawer",
    triggerText: "Шинэ борлуулалт",
    formId: "sale-form",
  },
  createFields: [],
  submitText: "Борлуулалт хадгалах",
  listAssertText: "Борлуулалт",
};
