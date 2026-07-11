/**
 * Query key factory for React Query.
 *
 * Each entity namespace exports:
 *  - all()       → base key (["entity"])
 *  - lists(orgId) → ["entity", "list", orgId]
 *  - detail(id)  → ["entity", "detail", id]
 */

export const productKeys = {
  all: () => ["products"] as const,
  lists: (orgId: string) => ["products", "list", orgId] as const,
  detail: (id: string) => ["products", "detail", id] as const,
  definitions: () => ["products", "definitions"] as const,
};

export const saleKeys = {
  all: () => ["sales"] as const,
  lists: (orgId: string) => ["sales", "list", orgId] as const,
  detail: (id: string) => ["sales", "detail", id] as const,
};

export const contactKeys = {
  all: () => ["contacts"] as const,
  lists: (orgId: string) => ["contacts", "list", orgId] as const,
  detail: (id: string) => ["contacts", "detail", id] as const,
};

export const expenseKeys = {
  all: () => ["expenses"] as const,
  lists: (orgId: string) => ["expenses", "list", orgId] as const,
  detail: (id: string) => ["expenses", "detail", id] as const,
};

export const inventoryKeys = {
  all: () => ["inventory"] as const,
  lists: (orgId: string) => ["inventory", "list", orgId] as const,
  detail: (id: string) => ["inventory", "detail", id] as const,
};

export const categoryKeys = {
  all: () => ["categories"] as const,
  lists: (orgId: string) => ["categories", "list", orgId] as const,
  detail: (id: string) => ["categories", "detail", id] as const,
};

export const movementKeys = {
  all: () => ["stock_movements"] as const,
  lists: (orgId: string) => ["stock_movements", "list", orgId] as const,
  detail: (id: string) => ["stock_movements", "detail", id] as const,
};

export const variantKeys = {
  all: () => ["product_variants"] as const,
  byProduct: (productId: string) =>
    ["product_variants", "by_product", productId] as const,
};

export const brandKeys = {
  all: () => ["brands"] as const,
  lists: (orgId: string) => ["brands", "list", orgId] as const,
  detail: (id: string) => ["brands", "detail", id] as const,
};

export const commissionKeys = {
  all: () => ["commissions"] as const,
  summary: (orgId: string) => ["commissions", "summary", orgId] as const,
  unpaidItems: (orgId: string, profileId: string) =>
    ["commissions", "unpaid", orgId, profileId] as const,
  history: (orgId: string) => ["commissions", "history", orgId] as const,
};

export const bundleKeys = {
  all: () => ["product_bundles"] as const,
  lists: (orgId: string) => ["product_bundles", "list", orgId] as const,
  detail: (id: string) => ["product_bundles", "detail", id] as const,
};

export const invoiceKeys = {
  all: () => ["invoices"] as const,
  lists: (orgId: string) => ["invoices", "list", orgId] as const,
  detail: (id: string) => ["invoices", "detail", id] as const,
};

export const discountKeys = {
  all: () => ["discounts"] as const,
  lists: (orgId: string) => ["discounts", "list", orgId] as const,
  detail: (id: string) => ["discounts", "detail", id] as const,
};

export const quotationKeys = {
  all: () => ["quotations"] as const,
  lists: (orgId: string) => ["quotations", "list", orgId] as const,
  detail: (id: string) => ["quotations", "detail", id] as const,
};

export const returnKeys = {
  all: () => ["returns"] as const,
  lists: (orgId: string) => ["returns", "list", orgId] as const,
  detail: (id: string) => ["returns", "detail", id] as const,
};

export const purchaseKeys = {
  all: () => ["purchase_orders"] as const,
  lists: (orgId: string) => ["purchase_orders", "list", orgId] as const,
  detail: (id: string) => ["purchase_orders", "detail", id] as const,
};

export const accountKeys = {
  all: () => ["accounts"] as const,
  lists: (orgId: string) => ["accounts", "list", orgId] as const,
  detail: (id: string) => ["accounts", "detail", id] as const,
};

export const journalEntryKeys = {
  all: () => ["journal_entries"] as const,
  lists: (orgId: string) => ["journal_entries", "list", orgId] as const,
  detail: (id: string) => ["journal_entries", "detail", id] as const,
};

export const roleKeys = {
  all: () => ["roles"] as const,
  lists: (orgId: string) => ["roles", "list", orgId] as const,
  detail: (id: string) => ["roles", "detail", id] as const,
};
export const orderTemplateKeys = {
  all: () => ["order_templates"] as const,
};
