import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockRequireWriteAction = vi.fn();
vi.mock("@/lib/action-utils", () => ({
  requireWriteAction: (...args: unknown[]) => mockRequireWriteAction(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const mockRevalidateEntities = vi.fn();
vi.mock("@/lib/revalidate", () => ({
  revalidateEntities: (...args: unknown[]) => mockRevalidateEntities(...args),
}));

const mockLogAuditEvent = vi.fn();
vi.mock("@/lib/audit", () => ({
  logAuditEventWithClient: (...args: unknown[]) => mockLogAuditEvent(...args),
}));

const mockCapture = vi.fn();
vi.mock("@zuiio/capture", () => ({
  capture: (...args: unknown[]) => mockCapture(...args),
  // Real withDbCapture awaits the query builder promise; the mock chain's
  // terminal methods (.single/.maybeSingle) return promises.
  withDbCapture: async (_label: unknown, query: unknown) => query,
}));

import {
  approveStockTransfer,
  cancelStockTransfer,
  createStockTransfer,
} from "../actions";

interface MockChain {
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
}

interface MockSupabase {
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
}

function createMockSupabase(
  overrides: { single?: unknown; maybeSingle?: unknown; rpc?: unknown } = {},
): {
  supabase: MockSupabase;
  chain: MockChain;
  rpc: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
} {
  const chain: MockChain = {
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(() =>
      Promise.resolve(
        overrides.single ?? { data: { id: "transfer-1" }, error: null },
      ),
    ),
    maybeSingle: vi.fn(() =>
      Promise.resolve(overrides.maybeSingle ?? { data: null, error: null }),
    ),
  };
  const rpc = vi.fn(() =>
    Promise.resolve(overrides.rpc ?? { data: { success: true }, error: null }),
  );
  const from = vi.fn(() => chain);
  const supabase: MockSupabase = { from, rpc };
  return { supabase, chain, rpc, from };
}

function makeContext(supabase: unknown) {
  return {
    supabase,
    organizationId: "org-1",
    userId: "user-1",
    branchId: "branch-1",
    isBranchScoped: false,
    permissions: [],
  };
}

function formDataWith(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("createStockTransfer", () => {
  it("rejects transfers between the same warehouse without touching the DB", async () => {
    const { supabase, from } = createMockSupabase();
    mockRequireWriteAction.mockResolvedValue(makeContext(supabase));

    const result = await createStockTransfer(
      undefined,
      formDataWith({
        from_warehouse_id: "w1",
        to_warehouse_id: "w1",
        items: JSON.stringify([{ product_id: "p1", quantity: 5 }]),
      }),
    );

    expect(result).toEqual({
      error: "Эхлэх болон очих агуулах ижил байж болохгүй.",
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("requires at least one item", async () => {
    const { supabase } = createMockSupabase();
    mockRequireWriteAction.mockResolvedValue(makeContext(supabase));

    const result = await createStockTransfer(
      undefined,
      formDataWith({
        from_warehouse_id: "w1",
        to_warehouse_id: "w2",
        items: "[]",
      }),
    );

    expect(result).toEqual({ error: "Дор хаяж нэг бараа оруулна уу." });
  });

  it("inserts the transfer header then its items", async () => {
    const { supabase, chain, from } = createMockSupabase();
    mockRequireWriteAction.mockResolvedValue(makeContext(supabase));

    const result = await createStockTransfer(
      undefined,
      formDataWith({
        from_warehouse_id: "w1",
        to_warehouse_id: "w2",
        notes: "urgent",
        items: JSON.stringify([
          { product_id: "p1", quantity: 5 },
          { product_id: "p2", quantity: 2 },
        ]),
      }),
    );

    expect(result).toEqual({ success: true, error: undefined });

    // Header insert
    expect(from).toHaveBeenNthCalledWith(1, "stock_transfers");
    expect(chain.insert.mock.calls[0][0]).toMatchObject({
      organization_id: "org-1",
      from_warehouse_id: "w1",
      to_warehouse_id: "w2",
      notes: "urgent",
      created_by: "user-1",
    });

    // Items insert (bulk)
    expect(from).toHaveBeenNthCalledWith(2, "stock_transfer_items");
    expect(chain.insert.mock.calls[1][0]).toEqual([
      { transfer_id: "transfer-1", product_id: "p1", quantity: 5 },
      { transfer_id: "transfer-1", product_id: "p2", quantity: 2 },
    ]);

    expect(mockLogAuditEvent).toHaveBeenCalledTimes(1);
    expect(mockRevalidateEntities).toHaveBeenCalledWith(["inventory"]);
  });

  it("rejects invalid item quantities with a Mongolian error", async () => {
    const { supabase, from } = createMockSupabase();
    mockRequireWriteAction.mockResolvedValue(makeContext(supabase));

    const result = await createStockTransfer(
      undefined,
      formDataWith({
        from_warehouse_id: "w1",
        to_warehouse_id: "w2",
        items: JSON.stringify([{ product_id: "p1", quantity: -3 }]),
      }),
    );

    expect(result).toEqual({
      error: "Барааны тоо хэмжээ эерэг тоо байх ёстой.",
    });
    expect(from).not.toHaveBeenCalled();
  });
});

describe("approveStockTransfer", () => {
  it("calls the approve_stock_transfer RPC with the transfer id", async () => {
    const { supabase, rpc } = createMockSupabase();
    mockRequireWriteAction.mockResolvedValue(makeContext(supabase));

    const result = await approveStockTransfer(
      undefined,
      formDataWith({ id: "t1" }),
    );

    expect(rpc).toHaveBeenCalledWith("approve_stock_transfer", {
      p_transfer_id: "t1",
    });
    expect(result).toEqual({ success: true, error: undefined });
    expect(mockLogAuditEvent).toHaveBeenCalledTimes(1);
    expect(mockRevalidateEntities).toHaveBeenCalledWith(["inventory"]);
  });

  it("surfaces RPC-level errors (e.g. insufficient stock) in Mongolian", async () => {
    const { supabase, rpc } = createMockSupabase();
    mockRequireWriteAction.mockResolvedValue(makeContext(supabase));
    rpc.mockResolvedValueOnce({
      data: {
        error:
          "Агуулахын нөөц хүрэлцэхгүй байна: бараа p1 (байгаа: 2, шаардлагатай: 10)",
      },
      error: null,
    });

    const result = await approveStockTransfer(
      undefined,
      formDataWith({ id: "t1" }),
    );

    expect(result.error).toContain("Агуулахын нөөц хүрэлцэхгүй байна");
    expect(mockLogAuditEvent).not.toHaveBeenCalled();
  });

  it("maps transport-level RPC errors to a Mongolian message", async () => {
    const { supabase, rpc } = createMockSupabase();
    mockRequireWriteAction.mockResolvedValue(makeContext(supabase));
    rpc.mockResolvedValueOnce({ data: null, error: new Error("network") });

    const result = await approveStockTransfer(
      undefined,
      formDataWith({ id: "t1" }),
    );

    expect(result.error).toBe("Шилжүүлэг баталгаажуулахад алдаа гарлаа.");
  });
});

describe("cancelStockTransfer", () => {
  it("cancels only pending transfers and audits the change", async () => {
    const { supabase, chain } = createMockSupabase({
      maybeSingle: { data: { id: "t1" }, error: null },
    });
    mockRequireWriteAction.mockResolvedValue(makeContext(supabase));

    const result = await cancelStockTransfer(
      undefined,
      formDataWith({ id: "t1" }),
    );

    expect(result).toEqual({ success: true, error: undefined });
    expect(chain.update).toHaveBeenCalledWith({ status: "cancelled" });
    expect(chain.eq).toHaveBeenCalledWith("status", "pending");
    expect(mockLogAuditEvent).toHaveBeenCalledTimes(1);
  });

  it("rejects cancelling an already processed transfer", async () => {
    const { supabase } = createMockSupabase({
      maybeSingle: { data: null, error: null },
    });
    mockRequireWriteAction.mockResolvedValue(makeContext(supabase));

    const result = await cancelStockTransfer(
      undefined,
      formDataWith({ id: "t1" }),
    );

    expect(result.error).toBe(
      "Шилжүүлэг цуцлах боломжгүй байна. Зөвхөн хүлээгдэж буй шилжүүлгийг цуцлах боломжтой.",
    );
  });
});

describe("permission errors", () => {
  it("forwards the requireWriteAction error for every action", async () => {
    mockRequireWriteAction.mockResolvedValue({
      error: "Зөвшөөрөл хүрэлцэхгүй байна.",
    });

    for (const action of [
      createStockTransfer,
      approveStockTransfer,
      cancelStockTransfer,
    ]) {
      const result = await action(undefined, formDataWith({ id: "t1" }));
      expect(result).toEqual({ error: "Зөвшөөрөл хүрэлцэхгүй байна." });
    }
  });
});
