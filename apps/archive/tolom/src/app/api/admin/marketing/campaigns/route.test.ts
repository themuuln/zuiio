import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const checkAdminRoleMock = vi.fn();
const listCampaignsMock = vi.fn();
const createCampaignMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/admin-service", () => ({
  checkAdminRole: checkAdminRoleMock,
  listCampaigns: listCampaignsMock,
  createCampaign: createCampaignMock,
}));

const { GET, POST } = await import("./route");

describe("admin/marketing/campaigns route", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns campaigns list", async () => {
      checkAdminRoleMock.mockResolvedValue(true);
      listCampaignsMock.mockResolvedValue([
        { id: "camp-1", name: "Summer Sale", type: "email" },
      ]);

      const req = new NextRequest(
        new URL("http://localhost/api/admin/marketing/campaigns"),
      );
      const response = await GET({ request: req, supabase: {}, user });
      const body = await response.json();

      expect(body.data).toEqual([
        { id: "camp-1", name: "Summer Sale", type: "email" },
      ]);
      expect(listCampaignsMock).toHaveBeenCalled();
    });

    it("returns 403 when not authorized", async () => {
      checkAdminRoleMock.mockResolvedValue(false);

      const req = new NextRequest(
        new URL("http://localhost/api/admin/marketing/campaigns"),
      );
      const response = await GET({ request: req, supabase: {}, user });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("handles service error", async () => {
      checkAdminRoleMock.mockResolvedValue(true);
      listCampaignsMock.mockRejectedValue(new Error("DB error"));

      const req = new NextRequest(
        new URL("http://localhost/api/admin/marketing/campaigns"),
      );
      await expect(GET({ request: req, supabase: {}, user })).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("POST", () => {
    it("creates a campaign successfully", async () => {
      checkAdminRoleMock.mockResolvedValue(true);
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "admin-1" },
          error: null,
        }),
      };
      createCampaignMock.mockResolvedValue({
        id: "camp-1",
        name: "Summer Sale",
        type: "email",
      });

      const req = new NextRequest(
        "http://localhost/api/admin/marketing/campaigns",
        {
          method: "POST",
          body: JSON.stringify({ name: "Summer Sale", type: "email" }),
        },
      );
      const response = await POST({ request: req, supabase, user });
      const body = await response.json();

      expect(body.data.id).toBe("camp-1");
      expect(createCampaignMock).toHaveBeenCalledWith(supabase, {
        name: "Summer Sale",
        type: "email",
        organization_id: undefined,
        created_by: "admin-1",
      });
    });

    it("creates a campaign with org override", async () => {
      checkAdminRoleMock.mockResolvedValue(true);
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "admin-1" },
          error: null,
        }),
      };
      createCampaignMock.mockResolvedValue({
        id: "camp-2",
        name: "Local",
        type: "sms",
      });

      const req = new NextRequest(
        "http://localhost/api/admin/marketing/campaigns",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Local",
            type: "sms",
            organization_id: "org-1",
          }),
        },
      );
      const response = await POST({ request: req, supabase, user });
      const body = await response.json();

      expect(body.data.id).toBe("camp-2");
      expect(createCampaignMock).toHaveBeenCalledWith(supabase, {
        name: "Local",
        type: "sms",
        organization_id: "org-1",
        created_by: "admin-1",
      });
    });

    it("returns 403 when not authorized", async () => {
      checkAdminRoleMock.mockResolvedValue(false);

      const req = new NextRequest(
        "http://localhost/api/admin/marketing/campaigns",
        {
          method: "POST",
          body: JSON.stringify({ name: "Summer Sale", type: "email" }),
        },
      );
      const response = await POST({ request: req, supabase: {}, user });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("returns 400 when name is missing", async () => {
      checkAdminRoleMock.mockResolvedValue(true);

      const req = new NextRequest(
        "http://localhost/api/admin/marketing/campaigns",
        {
          method: "POST",
          body: JSON.stringify({ type: "email" }),
        },
      );
      const response = await POST({ request: req, supabase: {}, user });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when type is missing", async () => {
      checkAdminRoleMock.mockResolvedValue(true);

      const req = new NextRequest(
        "http://localhost/api/admin/marketing/campaigns",
        {
          method: "POST",
          body: JSON.stringify({ name: "Summer Sale" }),
        },
      );
      const response = await POST({ request: req, supabase: {}, user });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("handles service error on create", async () => {
      checkAdminRoleMock.mockResolvedValue(true);
      createCampaignMock.mockRejectedValue(new Error("DB error"));
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "admin-1" },
          error: null,
        }),
      };

      const req = new NextRequest(
        "http://localhost/api/admin/marketing/campaigns",
        {
          method: "POST",
          body: JSON.stringify({ name: "Summer Sale", type: "email" }),
        },
      );
      await expect(POST({ request: req, supabase, user })).rejects.toThrow(
        "DB error",
      );
    });
  });
});
