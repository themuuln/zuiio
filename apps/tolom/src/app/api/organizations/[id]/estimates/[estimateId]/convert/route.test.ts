import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";

const convertEstimateToWorkOrderMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/estimate-service", () => ({
  convertEstimateToWorkOrder: convertEstimateToWorkOrderMock,
}));

const { POST } = await import("./route");

describe("organizations/[id]/estimates/[estimateId]/convert route", () => {
  const orgId = "org-1";
  const estimateId = "est-1";
  const user = { id: "user-1" };
  const supabase = { client: "test" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("converts estimate to work order", async () => {
      const workOrder = { id: "wo-1", status: "New" };
      convertEstimateToWorkOrderMock.mockResolvedValue(workOrder);

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/estimates/${estimateId}/convert`,
        { method: "POST" },
      );

      const response = await (POST as any)({
        request,
        params: { estimateId },
        orgId,
        user,
        supabase,
      });
      const body = await response.json();

      expect(convertEstimateToWorkOrderMock).toHaveBeenCalledWith(
        supabase,
        estimateId,
        orgId,
        user.id,
      );
      expect(body.data).toEqual(workOrder);
    });

    it("handles NotFoundError when estimate is not found", async () => {
      convertEstimateToWorkOrderMock.mockRejectedValue(
        new NotFoundError("Estimate not found"),
      );

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/estimates/${estimateId}/convert`,
        { method: "POST" },
      );

      await expect(
        (POST as any)({
          request,
          params: { estimateId },
          orgId,
          user,
          supabase,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("handles ValidationError when estimate is already converted", async () => {
      convertEstimateToWorkOrderMock.mockRejectedValue(
        new ValidationError(
          "This estimate has already been converted to a work order",
        ),
      );

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/estimates/${estimateId}/convert`,
        { method: "POST" },
      );

      await expect(
        (POST as any)({
          request,
          params: { estimateId },
          orgId,
          user,
          supabase,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("handles generic service error", async () => {
      convertEstimateToWorkOrderMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/estimates/${estimateId}/convert`,
        { method: "POST" },
      );

      await expect(
        (POST as any)({
          request,
          params: { estimateId },
          orgId,
          user,
          supabase,
        }),
      ).rejects.toThrow("DB error");
    });
  });
});
