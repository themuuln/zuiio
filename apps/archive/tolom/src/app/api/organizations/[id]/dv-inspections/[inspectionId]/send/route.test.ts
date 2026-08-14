import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const sendInspectionToCustomerMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/dvi-service", () => ({
  sendInspectionToCustomer: sendInspectionToCustomerMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/dv-inspections/[inspectionId]/send POST", () => {
  const orgId = "org-1";
  const inspectionId = "insp-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const url = `http://localhost/api/organizations/${orgId}/dv-inspections/${inspectionId}/send`;

  it("sends inspection to customer", async () => {
    sendInspectionToCustomerMock.mockResolvedValue({
      sent: true,
      token: "customer-token-abc",
      expires_at: "2026-08-30T00:00:00Z",
    });

    const supabase = { from: vi.fn() };
    const request = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify({ customer_phone: "+97699112233" }),
      headers: { "content-type": "application/json" },
    });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase,
      params: { inspectionId },
    });
    const data = await response.json();

    expect(sendInspectionToCustomerMock).toHaveBeenCalledWith(
      supabase,
      inspectionId,
      orgId,
      user.id,
      "+97699112233",
    );
    expect(data.data.sent).toBe(true);
    expect(data.data.token).toBe("customer-token-abc");
    expect(response.status).toBe(200);
  });

  it("returns 400 when customer_phone is missing", async () => {
    const supabase = { from: vi.fn() };
    const request = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase,
      params: { inspectionId },
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 when customer_phone is empty", async () => {
    const supabase = { from: vi.fn() };
    const request = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify({ customer_phone: "" }),
      headers: { "content-type": "application/json" },
    });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase,
      params: { inspectionId },
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 when inspectionId is missing", async () => {
    const supabase = { from: vi.fn() };
    const request = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify({ customer_phone: "+97699112233" }),
      headers: { "content-type": "application/json" },
    });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase,
      params: {},
    });
    expect(response.status).toBe(400);
  });

  it("handles service error", async () => {
    sendInspectionToCustomerMock.mockRejectedValue(
      new Error("SMS sending failed"),
    );

    const supabase = { from: vi.fn() };
    const request = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify({ customer_phone: "+97699112233" }),
      headers: { "content-type": "application/json" },
    });
    await expect(
      (POST as any)({
        request,
        orgId,
        user,
        supabase,
        params: { inspectionId },
      }),
    ).rejects.toThrow("SMS sending failed");
  });
});
