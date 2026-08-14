import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const checkAdminRoleMock = vi.fn();
const updateCampaignMock = vi.fn();
const deleteCampaignMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/admin-service", () => ({
  checkAdminRole: checkAdminRoleMock,
  updateCampaign: updateCampaignMock,
  deleteCampaign: deleteCampaignMock,
}));

const { PATCH, DELETE } = await import("./route");

describe("admin/marketing/campaigns/[campaignId] route", () => {
  const campaignId = "camp-1";
  const params = { campaignId };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH", () => {
    it("updates a campaign successfully", async () => {
      checkAdminRoleMock.mockResolvedValue(true);
      updateCampaignMock.mockResolvedValue({
        id: campaignId,
        name: "Updated Campaign",
        type: "email",
        status: "active",
      });

      const req = new NextRequest(
        new URL(`http://localhost/api/admin/marketing/campaigns/${campaignId}`),
        {
          method: "PATCH",
          body: JSON.stringify({ name: "Updated Campaign", status: "active" }),
        },
      );
      const response = await PATCH({ request: req, supabase: {}, params });
      const body = await response.json();

      expect(body.data).toEqual({
        id: campaignId,
        name: "Updated Campaign",
        type: "email",
        status: "active",
      });
      expect(updateCampaignMock).toHaveBeenCalledWith({}, campaignId, {
        name: "Updated Campaign",
        status: "active",
      });
    });

    it("returns 403 when not authorized", async () => {
      checkAdminRoleMock.mockResolvedValue(false);

      const req = new NextRequest(
        new URL(`http://localhost/api/admin/marketing/campaigns/${campaignId}`),
        { method: "PATCH" },
      );
      const response = await PATCH({ request: req, supabase: {}, params });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("handles service error on update", async () => {
      checkAdminRoleMock.mockResolvedValue(true);
      updateCampaignMock.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest(
        new URL(`http://localhost/api/admin/marketing/campaigns/${campaignId}`),
        {
          method: "PATCH",
          body: JSON.stringify({ name: "Test" }),
        },
      );

      await expect(
        PATCH({ request: req, supabase: {}, params }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("DELETE", () => {
    it("deletes a campaign successfully", async () => {
      checkAdminRoleMock.mockResolvedValue(true);
      deleteCampaignMock.mockResolvedValue(undefined);

      const response = await DELETE({ supabase: {}, params });
      const body = await response.json();

      expect(body.data).toEqual({ success: true });
      expect(deleteCampaignMock).toHaveBeenCalledWith({}, campaignId);
    });

    it("returns 403 when not authorized", async () => {
      checkAdminRoleMock.mockResolvedValue(false);

      const response = await DELETE({ supabase: {}, params });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("handles service error on delete", async () => {
      checkAdminRoleMock.mockResolvedValue(true);
      deleteCampaignMock.mockRejectedValue(new Error("DB error"));

      await expect(DELETE({ supabase: {}, params })).rejects.toThrow(
        "DB error",
      );
    });
  });
});
