import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getEstimateMock = vi.fn();
const updateEstimateStatusMock = vi.fn();
const sendEstimateEmailMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

vi.mock("@/lib/services/estimate-service", () => ({
  getEstimate: getEstimateMock,
  updateEstimateStatus: updateEstimateStatusMock,
}));

vi.mock("@/lib/services/email-service", () => ({
  sendEstimateEmail: sendEstimateEmailMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/estimates/[estimateId]/send route", () => {
  const orgId = "org-1";
  const estimateId = "est-1";
  const _baseUrl = `http://localhost/api/organizations/${orgId}/estimates/${estimateId}/send`;
  const supabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("sends estimate and marks as sent on success", async () => {
      const estimate = {
        id: estimateId,
        status: "draft",
        customer: { email: "customer@example.com" },
        discount_amount: 0,
        discount_percentage: 0,
        discount_total: 0,
        tax_total: 100,
        grand_total: 1100,
        subtotal: 1000,
        items: [
          {
            unit_price: 500,
            discount_amount: 0,
            discount_percentage: 0,
            line_total: 500,
          },
        ],
        estimate_number: "EST-001",
        public_token: "tok-abc",
      };
      getEstimateMock.mockResolvedValue(estimate);

      const orgRow = { data: { name: "Test Garage" } };
      supabase.single.mockResolvedValue(orgRow);

      process.env.NEXT_PUBLIC_APP_URL = "https://app.tolom.com";

      const response = await (POST as any)({
        params: { estimateId },
        supabase,
        orgId,
      });
      const body = await response.json();

      expect(getEstimateMock).toHaveBeenCalledWith(supabase, estimateId, orgId);
      expect(sendEstimateEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          orgName: "Test Garage",
          recipientEmail: "customer@example.com",
        }),
      );
      expect(updateEstimateStatusMock).toHaveBeenCalledWith(
        supabase,
        estimateId,
        orgId,
        "sent",
      );
      expect(body.data).toEqual({ sent: true });
      expect(response.status).toBe(200);
    });

    it("returns 404 when estimate not found", async () => {
      getEstimateMock.mockResolvedValue(null);

      const response = await (POST as any)({
        params: { estimateId },
        supabase,
        orgId,
      });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("returns 400 when customer has no email", async () => {
      getEstimateMock.mockResolvedValue({
        id: estimateId,
        status: "draft",
        customer: {},
      });

      const response = await (POST as any)({
        params: { estimateId },
        supabase,
        orgId,
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("NO_EMAIL");
    });

    it("handles service error", async () => {
      getEstimateMock.mockRejectedValue(new Error("DB error"));

      await expect(
        (POST as any)({ params: { estimateId }, supabase, orgId }),
      ).rejects.toThrow("DB error");
    });
  });
});
