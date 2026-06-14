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

export const commissionKeys = {
  all: () => ["commissions"] as const,
  summary: (orgId: string) => ["commissions", "summary", orgId] as const,
  unpaidItems: (orgId: string, profileId: string) =>
    ["commissions", "unpaid", orgId, profileId] as const,
  history: (orgId: string) => ["commissions", "history", orgId] as const,
};
