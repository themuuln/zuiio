import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  noContent: vi.fn(() => new Response(null, { status: 204 })),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

const { PATCH, DELETE } = await import("./route");

interface HandlerContext {
  request?: NextRequest;
  supabase: SupabaseClient;
  orgId: string;
  params: Record<string, string>;
}

// ── Chain builders ──────────────────────────────────────────────

/** Chain: .select().eq("id",x).eq("org_id",x).is("del",null).maybeSingle() */
function makeChainA(role: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: role, error: null });
  return {
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        is: vi.fn(() => ({ maybeSingle })),
      })),
    })),
  };
}

/** Chain: .select().eq("org_id",x).is("del",null).ilike("name",x).neq("id",x).maybeSingle() */
function makeChainB(duplicate: unknown) {
  const maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: duplicate, error: null });
  return {
    eq: vi.fn(() => ({
      is: vi.fn(() => ({
        ilike: vi.fn(() => ({
          neq: vi.fn(() => ({ maybeSingle })),
        })),
      })),
    })),
  };
}

/** roles.update().eq("id",x) */
function makeUpdateChain() {
  const eq = vi.fn().mockResolvedValue({ error: null });
  return { update: vi.fn(() => ({ eq })) };
}

/** role_permissions: .delete().eq("role_id",x) + .insert() */
function makePermsMock(insertCallback?: (data: unknown) => void) {
  return {
    delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    insert: vi.fn((data: unknown) => {
      insertCallback?.(data);
      return { error: null };
    }),
  };
}

/** organization_users: .select().eq("role_id",x).eq("org_id",x).is("removed_at",null) */
function makeOrgUsersMock(count: number | null = 0) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(() => Promise.resolve({ count, error: null, data: [] })),
        })),
      })),
    })),
  };
}

describe("organizations/[id]/roles/[roleId] route", () => {
  const orgId = "org-1";
  const roleId = "role-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/roles/${roleId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH", () => {
    it("updates role name and description", async () => {
      const role = {
        id: roleId,
        name: "Admin",
        description: "Old desc",
        is_system: false,
      };
      const selectMock = vi
        .fn()
        .mockReturnValueOnce(makeChainA(role))
        .mockReturnValueOnce(makeChainB(null));
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "roles")
            return { ...makeUpdateChain(), select: selectMock };
          if (table === "role_permissions") return makePermsMock();
          return {};
        }),
      } as unknown as SupabaseClient;

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ name: "Super Admin", description: "Top role" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase,
        orgId,
        params: { roleId },
      };
      const response = await PATCH(context);
      const body = await response.json();
      expect(body.data).toEqual({ success: true });
    });

    it("replaces permissions when permissionIds provided", async () => {
      const role = { id: roleId, name: "Admin", is_system: false };
      let capturedInsert: unknown = null;
      const selectMock = vi
        .fn()
        .mockReturnValueOnce(makeChainA(role))
        .mockReturnValueOnce(makeChainB(null));
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "roles")
            return { ...makeUpdateChain(), select: selectMock };
          if (table === "role_permissions")
            return makePermsMock((data: unknown) => {
              capturedInsert = data;
            });
          return {};
        }),
      } as unknown as SupabaseClient;

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ permissionIds: ["p-1", "p-2"] }),
      });
      const context: HandlerContext = {
        request: req,
        supabase,
        orgId,
        params: { roleId },
      };
      const response = await PATCH(context);
      const body = await response.json();
      expect(body.data).toEqual({ success: true });
      expect(capturedInsert).toEqual([
        { role_id: roleId, permission_id: "p-1" },
        { role_id: roleId, permission_id: "p-2" },
      ]);
    });

    it("returns 404 when role not found", async () => {
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "roles")
            return { select: vi.fn().mockReturnValueOnce(makeChainA(null)) };
          return {};
        }),
      } as unknown as SupabaseClient;

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ name: "New Name" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase,
        orgId,
        params: { roleId },
      };
      const response = await PATCH(context);
      expect(response.status).toBe(404);
    });

    it("returns 403 when role is system", async () => {
      const role = { id: roleId, name: "System Role", is_system: true };
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "roles")
            return { select: vi.fn().mockReturnValueOnce(makeChainA(role)) };
          return {};
        }),
      } as unknown as SupabaseClient;

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ name: "New Name" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase,
        orgId,
        params: { roleId },
      };
      const response = await PATCH(context);
      expect(response.status).toBe(403);
    });

    it("returns 400 for empty name", async () => {
      const role = { id: roleId, name: "Admin", is_system: false };
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "roles")
            return { select: vi.fn().mockReturnValueOnce(makeChainA(role)) };
          return {};
        }),
      } as unknown as SupabaseClient;

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ name: "" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase,
        orgId,
        params: { roleId },
      };
      const response = await PATCH(context);
      expect(response.status).toBe(400);
    });

    it("returns 409 on duplicate name", async () => {
      const role = { id: roleId, name: "Admin", is_system: false };
      const selectMock = vi
        .fn()
        .mockReturnValueOnce(makeChainA(role))
        .mockReturnValueOnce(makeChainB({ id: "other-role" }));
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "roles")
            return { ...makeUpdateChain(), select: selectMock };
          return {};
        }),
      } as unknown as SupabaseClient;

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ name: "Admin" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase,
        orgId,
        params: { roleId },
      };
      const response = await PATCH(context);
      expect(response.status).toBe(409);
    });
  });

  describe("DELETE", () => {
    it("soft-deletes role when no members assigned", async () => {
      const role = { id: roleId, is_system: false };
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "roles")
            return {
              select: vi.fn().mockReturnValueOnce(makeChainA(role)),
              update: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ error: null }),
              })),
            };
          if (table === "organization_users") return makeOrgUsersMock(0);
          return {};
        }),
      } as unknown as SupabaseClient;

      const context: HandlerContext = { supabase, orgId, params: { roleId } };
      const response = await DELETE(context);
      expect(response.status).toBe(204);
    });

    it("returns 404 when role not found", async () => {
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "roles")
            return { select: vi.fn().mockReturnValueOnce(makeChainA(null)) };
          return {};
        }),
      } as unknown as SupabaseClient;

      const context: HandlerContext = { supabase, orgId, params: { roleId } };
      const response = await DELETE(context);
      expect(response.status).toBe(404);
    });

    it("returns 403 when role is system", async () => {
      const role = { id: roleId, is_system: true };
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "roles")
            return { select: vi.fn().mockReturnValueOnce(makeChainA(role)) };
          return {};
        }),
      } as unknown as SupabaseClient;

      const context: HandlerContext = { supabase, orgId, params: { roleId } };
      const response = await DELETE(context);
      expect(response.status).toBe(403);
    });

    it("returns 409 when members are assigned", async () => {
      const role = { id: roleId, is_system: false };
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "roles")
            return { select: vi.fn().mockReturnValueOnce(makeChainA(role)) };
          if (table === "organization_users") return makeOrgUsersMock(3);
          return {};
        }),
      } as unknown as SupabaseClient;

      const context: HandlerContext = { supabase, orgId, params: { roleId } };
      const response = await DELETE(context);
      expect(response.status).toBe(409);
    });
  });
});
