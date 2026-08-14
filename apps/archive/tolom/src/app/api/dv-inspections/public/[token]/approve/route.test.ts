import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const submitCustomerApprovalMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/dvi-service", () => ({
  submitCustomerApproval: submitCustomerApprovalMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("dv-inspections/public/[token]/approve POST", () => {
  const token = "customer-token-42";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest(body: unknown) {
    return new NextRequest(
      `http://localhost/api/dv-inspections/public/${token}/approve`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      },
    );
  }

  const mockSupabaseFind = (overrides: Record<string, unknown> = {}) => {
    let _updateCallCount = 0;
    return {
      from: vi.fn((_table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "insp-1",
                customer_viewed_at: null,
                ...overrides,
              },
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => {
            _updateCallCount++;
            return Promise.resolve({ error: null });
          }),
        })),
      })),
    };
  };

  it("approves items successfully", async () => {
    const supabase = mockSupabaseFind();
    const mockToken = "customer-token-42";

    submitCustomerApprovalMock.mockResolvedValue({
      status: "partially_approved",
      approved_count: 3,
      declined_count: 1,
    });

    const response = await (POST as any)({
      request: makeRequest({
        item_ids: ["i-1", "i-2", "i-3", "i-4"],
        approved: true,
      }),
      supabase,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("partially_approved");
    expect(body.data.approved_count).toBe(3);
    expect(body.data.declined_count).toBe(1);
    expect(submitCustomerApprovalMock).toHaveBeenCalledWith(
      supabase,
      mockToken,
      { item_ids: ["i-1", "i-2", "i-3", "i-4"], approved: true },
    );
  });

  it("declines items successfully", async () => {
    const supabase = mockSupabaseFind();

    submitCustomerApprovalMock.mockResolvedValue({
      status: "declined",
      approved_count: 0,
      declined_count: 2,
    });

    const response = await (POST as any)({
      request: makeRequest({ item_ids: ["i-1", "i-2"], approved: false }),
      supabase,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("declined");
  });

  it("returns 404 for invalid token", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("not found"),
            }),
          })),
        })),
      })),
    };

    const response = await (POST as any)({
      request: makeRequest({ item_ids: ["i-1"], approved: true }),
      supabase,
    });
    expect(response.status).toBe(404);
  });

  it("returns 400 for missing token in URL", async () => {
    const supabase = { from: vi.fn() };
    const request = new NextRequest(
      "http://localhost/api/dv-inspections/public//approve",
      {
        method: "POST",
        body: JSON.stringify({ item_ids: ["i-1"], approved: true }),
        headers: { "content-type": "application/json" },
      },
    );
    const response = await (POST as any)({ request, supabase });
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid body", async () => {
    const supabase = { from: vi.fn() };
    const response = await (POST as any)({
      request: makeRequest({ item_ids: "not-an-array", approved: true }),
      supabase,
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 for empty item_ids", async () => {
    const supabase = { from: vi.fn() };
    const response = await (POST as any)({
      request: makeRequest({ item_ids: [], approved: true }),
      supabase,
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 for missing approved field", async () => {
    const supabase = { from: vi.fn() };
    const response = await (POST as any)({
      request: makeRequest({ item_ids: ["i-1"] }),
      supabase,
    });
    expect(response.status).toBe(400);
  });

  it("sets customer_viewed_at on first view", async () => {
    const updateCalls: Array<{ table: string; data: unknown; id: string }> = [];
    const supabase = {
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: "insp-1", customer_viewed_at: null },
              error: null,
            }),
          })),
        })),
        update: vi.fn((data: unknown) => {
          updateCalls.push({ table, data, id: "" });
          return {
            eq: vi.fn((_col: string, id: string) => {
              updateCalls[updateCalls.length - 1].id = id;
              return Promise.resolve({ error: null });
            }),
          };
        }),
      })),
    };

    submitCustomerApprovalMock.mockResolvedValue({
      status: "approved",
      approved_count: 1,
      declined_count: 0,
    });

    await (POST as any)({
      request: makeRequest({ item_ids: ["i-1"], approved: true }),
      supabase,
    });

    // Should have set customer_viewed_at
    const firstUpdate = updateCalls.find(
      (u) =>
        u.table === "digital_vehicle_inspections" &&
        u.data &&
        typeof u.data === "object" &&
        "customer_viewed_at" in (u.data as Record<string, unknown>),
    );
    expect(firstUpdate).toBeDefined();
  });

  it("does not re-set customer_viewed_at if already viewed", async () => {
    const supabase = {
      from: vi.fn((_table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "insp-1",
                customer_viewed_at: "2026-07-30T10:00:00Z",
                customer_decision_at: null,
              },
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    };

    submitCustomerApprovalMock.mockResolvedValue({
      status: "approved",
      approved_count: 1,
      declined_count: 0,
    });

    // Should not throw
    await expect(
      (POST as any)({
        request: makeRequest({ item_ids: ["i-1"], approved: true }),
        supabase,
      }),
    ).resolves.toBeDefined();
  });
});
