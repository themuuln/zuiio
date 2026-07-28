import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getWorkOrderMock = vi.fn();
const getOrganizationMock = vi.fn();
const renderToPdfBufferMock = vi.fn();
const pdfFilenameMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/work-order-service", () => ({
  getWorkOrder: getWorkOrderMock,
}));

vi.mock("@/lib/services/organization-service", () => ({
  getOrganization: getOrganizationMock,
}));

vi.mock("@/lib/pdf/work-order-document", () => ({
  WorkOrderDocument: vi.fn(() => "wo-doc"),
}));

vi.mock("@/lib/utils/pdf", () => ({
  renderToPdfBuffer: renderToPdfBufferMock,
  pdfFilename: pdfFilenameMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/work-orders/[workOrderId]/pdf route", () => {
  const orgId = "org-1";
  const workOrderId = "wo-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns PDF on success", async () => {
      const workOrder = {
        id: workOrderId,
        work_order_number: "WO-001",
        status: "In Progress",
        services: [],
        parts: [],
        customer: null,
        vehicle: null,
      };
      getWorkOrderMock.mockResolvedValue(workOrder);
      getOrganizationMock.mockResolvedValue({
        name: "Test Garage",
        logo_url: null,
      });

      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            name: "Main",
            address: "123 Main",
            phone: "555-0100",
            email: "test@test.com",
          },
        }),
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: { default_currency: "MNT" } }),
      };

      const pdfBuffer = Buffer.from("%PDF-1.4 mock pdf content");
      renderToPdfBufferMock.mockResolvedValue(pdfBuffer);
      pdfFilenameMock.mockReturnValue("work-order-wo-1.pdf");

      const response = await (GET as any)({
        params: { id: orgId, workOrderId },
        supabase,
        orgId,
      });

      expect(getWorkOrderMock).toHaveBeenCalledWith(
        supabase,
        workOrderId,
        orgId,
      );
      expect(getOrganizationMock).toHaveBeenCalledWith(supabase, orgId);
      expect(renderToPdfBufferMock).toHaveBeenCalled();
      expect(pdfFilenameMock).toHaveBeenCalledWith("work-order-wo-1");
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/pdf");
      expect(response.headers.get("Content-Disposition")).toContain(
        "work-order-wo-1.pdf",
      );
    });

    it("handles work order service error", async () => {
      getWorkOrderMock.mockRejectedValue(new Error("Work order not found"));

      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
      };

      await expect(
        (GET as any)({ params: { id: orgId, workOrderId }, supabase, orgId }),
      ).rejects.toThrow("Work order not found");
    });

    it("handles organization lookup error", async () => {
      const workOrder = {
        id: workOrderId,
        work_order_number: "WO-001",
        status: "In Progress",
        services: [],
        parts: [],
      };
      getWorkOrderMock.mockResolvedValue(workOrder);
      getOrganizationMock.mockRejectedValue(
        new Error("Organization not found"),
      );

      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
      };

      await expect(
        (GET as any)({ params: { id: orgId, workOrderId }, supabase, orgId }),
      ).rejects.toThrow("Organization not found");
    });
  });
});
