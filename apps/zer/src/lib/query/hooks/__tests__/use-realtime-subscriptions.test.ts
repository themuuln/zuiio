/**
 * Tests for useRealtimeSubscriptions hook.
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRealtimeSubscriptions } from "../use-realtime-subscriptions";

// --- Mocks ---

const mockUseRealtimeMulti = vi.fn();
vi.mock("@zuiio/realtime", () => ({
  useRealtimeMulti: (...args: unknown[]) => mockUseRealtimeMulti(...args),
}));

const mockCreateClient = vi.fn(() => ({ channel: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

const mockLists = {
  productKeys: vi.fn((id: string) => ["products", "list", id]),
  saleKeys: vi.fn((id: string) => ["sales", "list", id]),
  contactKeys: vi.fn((id: string) => ["contacts", "list", id]),
  expenseKeys: vi.fn((id: string) => ["expenses", "list", id]),
  brandKeys: vi.fn((id: string) => ["brands", "list", id]),
};

vi.mock("@/lib/query/keys", () => ({
  productKeys: {
    lists: (...args: unknown[]) => mockLists.productKeys(...args),
  },
  saleKeys: { lists: (...args: unknown[]) => mockLists.saleKeys(...args) },
  contactKeys: {
    lists: (...args: unknown[]) => mockLists.contactKeys(...args),
  },
  expenseKeys: {
    lists: (...args: unknown[]) => mockLists.expenseKeys(...args),
  },
  brandKeys: { lists: (...args: unknown[]) => mockLists.brandKeys(...args) },
}));

// --- Tests ---

const ORG_ID = "org-123";

describe("useRealtimeSubscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls useRealtimeMulti with correct tables config for a valid orgId", () => {
    renderHook(() => useRealtimeSubscriptions(ORG_ID));

    expect(mockUseRealtimeMulti).toHaveBeenCalledTimes(1);
    const callArg = mockUseRealtimeMulti.mock.calls[0][0];

    expect(callArg.supabase).toBeDefined();
    expect(callArg.enabled).toBe(true);
    expect(callArg.tables).toHaveLength(5);
  });

  it("passes all 5 expected tables", () => {
    renderHook(() => useRealtimeSubscriptions(ORG_ID));

    const { tables } = mockUseRealtimeMulti.mock.calls[0][0];
    const tableNames = tables.map((t: { table: string }) => t.table);

    expect(tableNames).toEqual([
      "products",
      "sales",
      "contacts",
      "expenses",
      "brands",
    ]);
  });

  it("uses organization_id=eq filter for each table", () => {
    renderHook(() => useRealtimeSubscriptions(ORG_ID));

    const { tables } = mockUseRealtimeMulti.mock.calls[0][0];

    for (const t of tables) {
      expect(t.filter).toBe(`organization_id=eq.${ORG_ID}`);
    }
  });

  it("passes correct queryKeys for each table", () => {
    renderHook(() => useRealtimeSubscriptions(ORG_ID));

    const { tables } = mockUseRealtimeMulti.mock.calls[0][0];

    expect(tables[0].queryKeys).toEqual([["products", "list", ORG_ID]]);
    expect(tables[1].queryKeys).toEqual([["sales", "list", ORG_ID]]);
    expect(tables[2].queryKeys).toEqual([["contacts", "list", ORG_ID]]);
    expect(tables[3].queryKeys).toEqual([["expenses", "list", ORG_ID]]);
    expect(tables[4].queryKeys).toEqual([["brands", "list", ORG_ID]]);
  });
  it("sets enabled=false when orgId is null", () => {
    renderHook(() => useRealtimeSubscriptions(null));

    expect(mockUseRealtimeMulti).toHaveBeenCalledTimes(1);
    expect(mockUseRealtimeMulti.mock.calls[0][0].enabled).toBe(false);
  });
  it("sets enabled=false when orgId is undefined", () => {
    renderHook(() => useRealtimeSubscriptions(undefined));

    expect(mockUseRealtimeMulti).toHaveBeenCalledTimes(1);
    expect(mockUseRealtimeMulti.mock.calls[0][0].enabled).toBe(false);
  });
  it("sets enabled=false for an empty string orgId", () => {
    renderHook(() => useRealtimeSubscriptions(""));

    expect(mockUseRealtimeMulti).toHaveBeenCalledTimes(1);
    expect(mockUseRealtimeMulti.mock.calls[0][0].enabled).toBe(false);
  });
});
