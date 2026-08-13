import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpsert = vi.hoisted(() => vi.fn());
const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockCapture = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server-service", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "organizations") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
        };
      }
      if (table === "abandoned_carts") {
        return { upsert: mockUpsert };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));
vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

import { POST } from "./route";

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/store/cart-capture", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("POST /api/store/cart-capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({ data: { id: "org-1" }, error: null });
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("rejects missing slug, session_id or items", async () => {
    expect((await post({ slug: "s", session_id: "x" })).status).toBe(400);
    expect((await post({ slug: "s", items: [] })).status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("rejects an unknown store", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await post({
      slug: "nope",
      session_id: "sess-1",
      items: [{ productId: "p-1", quantity: 1 }],
    });
    expect(res.status).toBe(404);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("upserts the cart keyed on (organization_id, session_id)", async () => {
    const res = await post({
      slug: "storefront-e2e-test",
      session_id: "sess-1",
      items: [{ productId: "p-1", variantId: null, quantity: 2 }],
      contact_email: "buyer@example.com",
      contact_name: "Бат",
      contact_phone: "99112233",
      subtotal: 10000,
      currency: "MNT",
    });
    expect(res.status).toBe(200);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        session_id: "sess-1",
        items: [{ productId: "p-1", variantId: null, quantity: 2 }],
        contact_email: "buyer@example.com",
        subtotal: 10000,
        currency: "MNT",
      }),
      { onConflict: "organization_id, session_id" },
    );
  });
});
