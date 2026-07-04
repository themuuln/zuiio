import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { PATCH, DELETE } from "./route";

// Mock the dependencies
vi.mock("@/lib/apiAuth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseRestContext: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { requireAuth } from "@/lib/apiAuth";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabase/server";

function createPatchRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3001/api/templates/some-id", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createDeleteRequest(): NextRequest {
  return new NextRequest("http://localhost:3001/api/templates/some-id", {
    method: "DELETE",
  });
}

const mockContext = {
  baseUrl: "https://test-project.supabase.co/rest/v1",
  headers: {
    apikey: "test-key",
    Authorization: "Bearer test-key",
    "Content-Type": "application/json",
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSupabaseRestContext).mockReturnValue(mockContext);
  vi.mocked(requireAuth).mockResolvedValue(null);
  // Default: user is authenticated with id "user-123"
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      }),
    },
  } as never);
  vi.stubGlobal("fetch", vi.fn());
});

describe("PATCH /api/templates/[id]", () => {
  it("returns 404 for invalid UUID", async () => {
    const response = await PATCH(createPatchRequest({ name: "Updated" }), {
      params: Promise.resolve({ id: "invalid-uuid" }),
    });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Template not found.");
    // Should not have made any fetch calls
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 401 without authentication", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await PATCH(createPatchRequest({ name: "Updated" }), {
      params: Promise.resolve({ id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("updates user template fields", async () => {
    // Use a call counter to differentiate between existence check (1st) and update (2nd)
    let callCount = 0;
    vi.mocked(fetch).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // First call: existence check
        return new Response(
          JSON.stringify([{ id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", is_builtin: false, user_id: "user-123" }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      // Second call: PATCH update
      return new Response(
        JSON.stringify([{
          id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          name: "Updated Name",
          description: "Updated description",
          category: "sales",
          channels: [],
          flow_json: { nodes: [], edges: [] },
          is_builtin: false,
          usage_count: 0,
          user_id: "user-123",
          created_at: "2026-06-15T00:00:00Z",
          updated_at: "2026-06-15T01:00:00Z",
        }]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const response = await PATCH(createPatchRequest({
      name: "Updated Name",
      description: "Updated description",
      category: "sales",
    }), {
      params: Promise.resolve({ id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty("template");
    expect(body.template.name).toBe("Updated Name");
    expect(body.template.description).toBe("Updated description");
    expect(body.template.category).toBe("sales");
  });

  it("returns 403 when updating a built-in template", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([{ id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", is_builtin: true, user_id: null }]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await PATCH(createPatchRequest({ name: "Hacked" }), {
      params: Promise.resolve({ id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Cannot modify a built-in template.");
  });

  it("returns 404 when template does not exist (valid UUID but no match)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await PATCH(createPatchRequest({ name: "Ghost" }), {
      params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
    });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Template not found.");
  });

  it("returns 400 for invalid category", async () => {
    // For invalid category validation, the fetch only happens for the existence check
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([{ id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", is_builtin: false, user_id: "user-123" }]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await PATCH(createPatchRequest({ category: "bad_category" }), {
      params: Promise.resolve({ id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid category");
  });

  it("returns 400 for empty update body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([{ id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", is_builtin: false, user_id: "user-123" }]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await PATCH(createPatchRequest({}), {
      params: Promise.resolve({ id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Nothing to update.");
  });

  it("returns 403 when updating another user's template", async () => {
    // Mock the authenticated user to have a DIFFERENT ID than the template owner
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "other-user-456" } },
          error: null,
        }),
      },
    } as never);

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([{ id: "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", is_builtin: false, user_id: "template-owner-789" }]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await PATCH(createPatchRequest({ name: "Hacked Name" }), {
      params: Promise.resolve({ id: "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("You do not have permission to modify this template.");
  });
});

describe("DELETE /api/templates/[id]", () => {
  it("returns 404 for invalid UUID", async () => {
    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: "invalid-uuid" }),
    });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Template not found.");
    // Should not have made any fetch calls
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 403 when deleting a built-in template", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([{ id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", is_builtin: true }]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Cannot delete a built-in template.");
  });

  it("returns 200 and deletes user template successfully", async () => {
    // First call: existence check returns user template (owned by user-123)
    // Second call: DELETE returns success
    let callCount = 0;
    vi.mocked(fetch).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(
          JSON.stringify([{ id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", is_builtin: false, user_id: "user-123" }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 403 when deleting another user's template", async () => {
    // Mock the authenticated user to have a DIFFERENT ID than the template owner
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "other-user-456" } },
          error: null,
        }),
      },
    } as never);

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([{ id: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", is_builtin: false, user_id: "template-owner-789" }]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("You do not have permission to delete this template.");
  });

  it("returns 404 when template does not exist (valid UUID but no match)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
    });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Template not found.");
  });

  it("returns 401 without authentication", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });
});
