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

import { requireAuth } from "@/lib/apiAuth";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";

function createPatchRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3001/api/rules/rule-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createDeleteRequest(): NextRequest {
  return new NextRequest("http://localhost:3001/api/rules/rule-1", {
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
  vi.stubGlobal("fetch", vi.fn());
});

describe("PATCH /api/rules/[id]", () => {
  it("updates rule and returns 200 with updated rule", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: "rule-1",
            name: "Updated Rule",
            event: "message_received",
            conditions: [{ field: "tag", operator: "contains", value: "vip" }],
            actions: [{ type: "notify", params: { message: "VIP message" } }],
            enabled: false,
            automation_id: null,
            created_at: "2026-06-15T00:00:00Z",
            updated_at: "2026-06-15T00:00:00Z",
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await PATCH(createPatchRequest({ enabled: false, name: "Updated Rule" }), {
      params: Promise.resolve({ id: "rule-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty("rule");
    expect(body.rule.name).toBe("Updated Rule");
    expect(body.rule.enabled).toBe(false);
  });

  it("returns 400 for invalid update data", async () => {
    const response = await PATCH(createPatchRequest({ event: "invalid_event" }), {
      params: Promise.resolve({ id: "rule-1" }),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 for empty update body", async () => {
    const response = await PATCH(createPatchRequest({}), {
      params: Promise.resolve({ id: "rule-1" }),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Nothing to update.");
  });

  it("returns 404 when rule not found", async () => {
    // Mock the PATCH response returning empty array (no matching row)
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await PATCH(createPatchRequest({ name: "Ghost Rule" }), {
      params: Promise.resolve({ id: "nonexistent-id" }),
    });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Rule not found.");
  });

  it("returns 401 without authentication", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await PATCH(createPatchRequest({ name: "Test" }), {
      params: Promise.resolve({ id: "rule-1" }),
    });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });
});

describe("DELETE /api/rules/[id]", () => {
  it("deletes rule and returns success", async () => {
    // Mock the existence check
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("select=id") && urlStr.includes("eq.rule-1")) {
        return new Response(
          JSON.stringify([{ id: "rule-1" }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      // DELETE request
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: "rule-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 404 when rule does not exist", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: "nonexistent-id" }),
    });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Rule not found.");
  });

  it("returns 401 without authentication", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: "rule-1" }),
    });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });
});
