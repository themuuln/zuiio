import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
const chain = {
  select: vi.fn(() => chain),
  ilike: vi.fn(() => chain),
  eq: vi.fn(() => chain),
  is: vi.fn(() => chain),
  limit: mockLimit,
};
const mockFrom = vi.fn(() => chain);
const mockSupabase = { from: mockFrom };

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn((data: unknown) => ({
    status: 200,
    json: async () => ({ data }),
  })),
}));

vi.mock("@/lib/form-validation", () => ({
  transliterateMongolianPlate: vi.fn((plate: string) => plate),
}));

const { GET } = await import("./route");

describe("by-plate route", () => {
  const orgId = "org-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no plate param", async () => {
    const req = new NextRequest(
      new URL("http://localhost/api/organizations/test-org/customers/by-plate"),
    );
    const response = await GET({
      request: req,
      orgId,
      user: { id: "u-1" },
      supabase: mockSupabase,
    });
    const body = await response.json();

    expect(body.data).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns empty array when plate is only whitespace", async () => {
    const req = new NextRequest(
      new URL(
        "http://localhost/api/organizations/test-org/customers/by-plate?plate=%20%20",
      ),
    );
    const response = await GET({
      request: req,
      orgId,
      user: { id: "u-1" },
      supabase: mockSupabase,
    });
    const body = await response.json();

    expect(body.data).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns customers for a matching plate", async () => {
    const customer = { id: "c-1", name: "Bold", phone: "99112233" };
    const vehicle = {
      vehicle_owners: [{ customers: customer }],
    };
    mockLimit.mockResolvedValueOnce({ data: [vehicle], error: null });

    const req = new NextRequest(
      new URL(
        "http://localhost/api/organizations/test-org/customers/by-plate?plate=1234UB01",
      ),
    );
    const response = await GET({
      request: req,
      orgId,
      user: { id: "u-1" },
      supabase: mockSupabase,
    });
    const body = await response.json();

    expect(body.data).toEqual([customer]);
    expect(mockFrom).toHaveBeenCalledWith("vehicles");
    expect(chain.select).toHaveBeenCalledWith(
      "vehicle_owners!inner(customers(*))",
    );
    expect(chain.ilike).toHaveBeenCalledWith("plate_number", "%1234UB01%");
    expect(chain.eq).toHaveBeenCalledWith("organization_id", orgId);
    expect(chain.is).toHaveBeenNthCalledWith(1, "deleted_at", null);
    expect(chain.is).toHaveBeenNthCalledWith(
      2,
      "vehicle_owners.owned_until",
      null,
    );
    expect(chain.limit).toHaveBeenCalledWith(5);
  });

  it("deduplicates when same customer has multiple vehicles", async () => {
    const customer = { id: "c-1", name: "Bold" };
    mockLimit.mockResolvedValueOnce({
      data: [
        { vehicle_owners: [{ customers: customer }] },
        { vehicle_owners: [{ customers: customer }] },
      ],
      error: null,
    });

    const req = new NextRequest(
      new URL(
        "http://localhost/api/organizations/test-org/customers/by-plate?plate=1234",
      ),
    );
    const response = await GET({
      request: req,
      orgId,
      user: { id: "u-1" },
      supabase: mockSupabase,
    });
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toEqual(customer);
  });

  it("skips vehicle rows with empty vehicle_owners", async () => {
    const customer = { id: "c-1", name: "Bold" };
    mockLimit.mockResolvedValueOnce({
      data: [
        { vehicle_owners: [] },
        { vehicle_owners: [{ customers: customer }] },
      ],
      error: null,
    });

    const req = new NextRequest(
      new URL(
        "http://localhost/api/organizations/test-org/customers/by-plate?plate=1234",
      ),
    );
    const response = await GET({
      request: req,
      orgId,
      user: { id: "u-1" },
      supabase: mockSupabase,
    });
    const body = await response.json();

    expect(body.data).toEqual([customer]);
  });

  it("handles customer as an array in vehicle_owners", async () => {
    const customer = { id: "c-1", name: "Bold" };
    mockLimit.mockResolvedValueOnce({
      data: [{ vehicle_owners: [{ customers: [customer] }] }],
      error: null,
    });

    const req = new NextRequest(
      new URL(
        "http://localhost/api/organizations/test-org/customers/by-plate?plate=1234",
      ),
    );
    const response = await GET({
      request: req,
      orgId,
      user: { id: "u-1" },
      supabase: mockSupabase,
    });
    const body = await response.json();

    expect(body.data).toEqual([customer]);
  });

  it("returns empty array when no matching customers", async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null });

    const req = new NextRequest(
      new URL(
        "http://localhost/api/organizations/test-org/customers/by-plate?plate=NONEXIST",
      ),
    );
    const response = await GET({
      request: req,
      orgId,
      user: { id: "u-1" },
      supabase: mockSupabase,
    });
    const body = await response.json();

    expect(body.data).toEqual([]);
    expect(mockFrom).toHaveBeenCalledWith("vehicles");
  });

  it("throws on supabase error", async () => {
    mockLimit.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });

    const req = new NextRequest(
      new URL(
        "http://localhost/api/organizations/test-org/customers/by-plate?plate=1234",
      ),
    );
    await expect(
      GET({
        request: req,
        orgId,
        user: { id: "u-1" },
        supabase: mockSupabase,
      }),
    ).rejects.toThrow("DB error");
  });
});
