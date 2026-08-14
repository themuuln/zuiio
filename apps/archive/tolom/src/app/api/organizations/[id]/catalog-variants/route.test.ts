import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getVariantGroupsMock = vi.fn();
const getVariantGroupMock = vi.fn();
const createVariantGroupMock = vi.fn();
const updateVariantGroupMock = vi.fn();
const deleteVariantGroupMock = vi.fn();
const getVariantOptionsMock = vi.fn();
const getVariantOptionMock = vi.fn();
const createVariantOptionMock = vi.fn();
const updateVariantOptionMock = vi.fn();
const deleteVariantOptionMock = vi.fn();
const getItemVariantsMock = vi.fn();
const createItemVariantMock = vi.fn();
const updateItemVariantMock = vi.fn();
const deleteItemVariantMock = vi.fn();
const bulkGenerateVariantsMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/catalog-variant-service", () => ({
  getVariantGroups: getVariantGroupsMock,
  getVariantGroup: getVariantGroupMock,
  createVariantGroup: createVariantGroupMock,
  updateVariantGroup: updateVariantGroupMock,
  deleteVariantGroup: deleteVariantGroupMock,
  getVariantOptions: getVariantOptionsMock,
  getVariantOption: getVariantOptionMock,
  createVariantOption: createVariantOptionMock,
  updateVariantOption: updateVariantOptionMock,
  deleteVariantOption: deleteVariantOptionMock,
  getItemVariants: getItemVariantsMock,
  createItemVariant: createItemVariantMock,
  updateItemVariant: updateItemVariantMock,
  deleteItemVariant: deleteItemVariantMock,
  bulkGenerateVariants: bulkGenerateVariantsMock,
}));

const { POST } = await import("./route");

interface HandlerContext {
  request: NextRequest;
  supabase: SupabaseClient;
  orgId: string;
  user?: { id: string };
}

describe("organizations/[id]/catalog-variants route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/catalog-variants`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns 400 for missing body", async () => {
      const req = new NextRequest(new URL(baseUrl), { method: "POST" });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      const response = await POST(context);

      expect(response.status).toBe(400);
    });

    it("returns 400 for missing action", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({}),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      const response = await POST(context);

      expect(response.status).toBe(400);
    });

    it("returns 400 for unknown action", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({ action: "unknown-action" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      const response = await POST(context);

      expect(response.status).toBe(400);
    });

    describe("Groups", () => {
      it("lists groups", async () => {
        const groups = [{ id: "g-1", name: "Size" }];
        getVariantGroupsMock.mockResolvedValue(groups);

        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({ action: "list-groups" }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);
        const body = await response.json();

        expect(getVariantGroupsMock).toHaveBeenCalledWith({}, orgId, undefined);
        expect(body.data).toEqual(groups);
      });

      it("gets group by id", async () => {
        const group = { id: "g-1", name: "Size" };
        getVariantGroupMock.mockResolvedValue(group);

        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({ action: "get-group", id: "g-1" }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);
        const body = await response.json();

        expect(getVariantGroupMock).toHaveBeenCalledWith({}, "g-1");
        expect(body.data).toEqual(group);
      });

      it("returns 400 for get-group without id", async () => {
        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({ action: "get-group" }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);

        expect(response.status).toBe(400);
      });

      it("creates group", async () => {
        const group = { id: "g-1", name: "Size", applies_to: "service" };
        createVariantGroupMock.mockResolvedValue(group);

        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({
            action: "create-group",
            name: "Size",
            applies_to: "service",
          }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);
        const body = await response.json();

        expect(createVariantGroupMock).toHaveBeenCalledWith({}, orgId, {
          name: "Size",
          name_mn: undefined,
          applies_to: "service",
          sort_order: undefined,
        });
        expect(body.data).toEqual(group);
      });

      it("returns 400 for create-group without name", async () => {
        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({
            action: "create-group",
            applies_to: "service",
          }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);

        expect(response.status).toBe(400);
      });

      it("updates group", async () => {
        const group = { id: "g-1", name: "Updated" };
        updateVariantGroupMock.mockResolvedValue(group);

        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({
            action: "update-group",
            id: "g-1",
            name: "Updated",
          }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);
        const body = await response.json();

        expect(updateVariantGroupMock).toHaveBeenCalled();
        expect(body.data).toEqual(group);
      });

      it("deletes group", async () => {
        deleteVariantGroupMock.mockResolvedValue(undefined);

        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({ action: "delete-group", id: "g-1" }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);
        const body = await response.json();

        expect(deleteVariantGroupMock).toHaveBeenCalledWith({}, "g-1", orgId);
        expect(body.data).toBeNull();
      });
    });

    describe("Options", () => {
      it("lists options", async () => {
        const options = [{ id: "o-1", label: "Small" }];
        getVariantOptionsMock.mockResolvedValue(options);

        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({ action: "list-options" }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);
        const body = await response.json();

        expect(getVariantOptionsMock).toHaveBeenCalledWith(
          {},
          orgId,
          undefined,
        );
        expect(body.data).toEqual(options);
      });

      it("creates option", async () => {
        const option = { id: "o-1", group_id: "g-1", label: "Small" };
        createVariantOptionMock.mockResolvedValue(option);

        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({
            action: "create-option",
            group_id: "g-1",
            label: "Small",
          }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);
        const body = await response.json();

        expect(createVariantOptionMock).toHaveBeenCalled();
        expect(body.data).toEqual(option);
      });

      it("returns 400 for create-option without group_id", async () => {
        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({ action: "create-option", label: "Small" }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);

        expect(response.status).toBe(400);
      });
    });

    describe("Item Variants", () => {
      it("lists items", async () => {
        const items = [{ id: "iv-1", variant_label: "Red" }];
        getItemVariantsMock.mockResolvedValue(items);

        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({
            action: "list-items",
            entity_type: "service",
            entity_id: "svc-1",
          }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);
        const body = await response.json();

        expect(getItemVariantsMock).toHaveBeenCalledWith(
          {},
          orgId,
          "service",
          "svc-1",
        );
        expect(body.data).toEqual(items);
      });

      it("returns 400 for list-items without entity_id", async () => {
        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({ action: "list-items" }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);

        expect(response.status).toBe(400);
      });

      it("creates item variant", async () => {
        const item = { id: "iv-1", variant_label: "Large", price: 15000 };
        createItemVariantMock.mockResolvedValue(item);

        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({
            action: "create-item",
            entity_type: "part",
            entity_id: "prt-1",
            variant_label: "Large",
            price: 15000,
          }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);
        const body = await response.json();

        expect(createItemVariantMock).toHaveBeenCalled();
        expect(body.data).toEqual(item);
      });

      it("returns 400 for create-item without entity_type", async () => {
        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({
            action: "create-item",
            entity_id: "prt-1",
            variant_label: "Large",
          }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);

        expect(response.status).toBe(400);
      });

      it("updates item variant", async () => {
        const item = { id: "iv-1", price: 20000 };
        updateItemVariantMock.mockResolvedValue(item);

        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({
            action: "update-item",
            id: "iv-1",
            price: 20000,
          }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);
        const body = await response.json();

        expect(updateItemVariantMock).toHaveBeenCalled();
        expect(body.data).toEqual(item);
      });

      it("deletes item variant", async () => {
        deleteItemVariantMock.mockResolvedValue(undefined);

        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({ action: "delete-item", id: "iv-1" }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);
        const body = await response.json();

        expect(deleteItemVariantMock).toHaveBeenCalledWith(
          {},
          "iv-1",
          orgId,
          user.id,
        );
        expect(body.data).toBeNull();
      });

      it("bulk generates variants", async () => {
        const items = [{ id: "iv-1", variant_label: "Red-Large" }];
        bulkGenerateVariantsMock.mockResolvedValue(items);

        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({
            action: "bulk-items",
            entity_type: "service",
            entity_id: "svc-1",
            dimension_options: {
              color: ["Red", "Blue"],
              size: ["Large", "Small"],
            },
          }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);
        const body = await response.json();

        expect(bulkGenerateVariantsMock).toHaveBeenCalled();
        expect(body.data).toEqual(items);
      });

      it("returns 400 for bulk-items without dimension_options", async () => {
        const req = new NextRequest(new URL(baseUrl), {
          method: "POST",
          body: JSON.stringify({
            action: "bulk-items",
            entity_type: "service",
            entity_id: "svc-1",
          }),
        });
        const context: HandlerContext = {
          request: req,
          supabase: {} as SupabaseClient,
          orgId,
          user,
        };
        const response = await POST(context);

        expect(response.status).toBe(400);
      });
    });

    it("handles service error", async () => {
      getVariantGroupsMock.mockRejectedValue(new Error("Service error"));

      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({ action: "list-groups" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      await expect(POST(context)).rejects.toThrow("Service error");
    });
  });
});
