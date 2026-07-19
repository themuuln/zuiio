import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/services/purchase-order-service", () => ({
  receiveByBarcode: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  mutationRateLimiter: {
    check: vi.fn(),
  },
}));

vi.mock("@/lib/services/subscription-enforcement", () => ({
  requireActiveSubscription: vi.fn().mockResolvedValue(undefined),
}));

const { POST } = await import("./route");
const { receiveByBarcode } = await import(
  "@/lib/services/purchase-order-service"
);
const { mutationRateLimiter } = await import("@/lib/rate-limit");

const ORG_ID = "org-test-1";
const PO_ID = "po-1";

function makeRequest(body?: unknown) {
  return new NextRequest(
    `http://localhost:3000/api/organizations/${ORG_ID}/inventory/purchase-orders/${PO_ID}/receive-barcode`,
    {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      headers:
        body === undefined ? undefined : { "content-type": "application/json" },
    },
  );
}

const context = {
  params: Promise.resolve({ id: ORG_ID, purchaseOrderId: PO_ID }),
};

describe("POST /api/organizations/[id]/inventory/purchase-orders/[purchaseOrderId]/receive-barcode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mutationRateLimiter.check).mockReturnValue({
      allowed: true,
      remaining: 59,
      resetAt: Date.now() + 60_000,
    });
    const client = createMockSupabaseClient();
    client.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
    client.from("organization_users").maybeSingle.mockResolvedValue({
      data: { organization_id: ORG_ID },
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>,
    );
  });
  it("returns 400 when barcode is missing", async () => {
    const response = await POST(makeRequest({}), context);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Barcode is required");
    expect(receiveByBarcode).not.toHaveBeenCalled();
  });

  it("returns 200 with the updated item on successful receive", async () => {
    const updated = {
      id: "poi-1",
      part_id: "part-1",
      quantity_ordered: 5,
      quantity_received: 1,
      unit_cost: 10000,
    };
    vi.mocked(receiveByBarcode).mockResolvedValue(updated as never);

    const response = await POST(
      makeRequest({ barcode: "1234567890" }),
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(updated);
    expect(receiveByBarcode).toHaveBeenCalledWith(
      expect.anything(),
      PO_ID,
      ORG_ID,
      "1234567890",
    );
  });

  it("returns 500 when the service throws", async () => {
    vi.mocked(receiveByBarcode).mockRejectedValue(
      new Error("No part found with barcode: 000"),
    );

    const response = await POST(makeRequest({ barcode: "000" }), context);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});
