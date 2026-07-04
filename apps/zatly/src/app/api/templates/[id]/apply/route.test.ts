import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "./route";

// Mock the dependencies
vi.mock("@/lib/apiAuth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseRestContext: vi.fn(),
}));

import { requireAuth } from "@/lib/apiAuth";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";

function createApplyRequest(): NextRequest {
  return new NextRequest("http://localhost:3001/api/templates/tmpl-1/apply", {
    method: "POST",
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

describe("POST /api/templates/[id]/apply", () => {
  it("returns 404 for invalid UUID", async () => {
    const response = await POST(createApplyRequest(), {
      params: Promise.resolve({ id: "invalid-uuid" }),
    });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Template not found.");
    // Should not have made any fetch calls
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 201 with automation containing deep-copied flow_json", async () => {
    const templateFlowJson = {
      nodes: [{ id: "start-1", type: "start", data: { label: "Start" }, position: { x: 250, y: 50 } }],
      edges: [],
    };

    const createdAutomation = {
      id: "auto-new-1",
      name: "Welcome Greeting",
      status: "draft",
      flow_json: templateFlowJson,
      channels: [],
    };

    // Mock fetch calls in order: 1) fetch template, 2) create automation, 3) update usage
    let callCount = 0;
    vi.mocked(fetch).mockImplementation(async (_url: string | URL | Request, init?: RequestInit) => {
      callCount++;

      if (callCount === 1) {
        // First call: fetch template
        return new Response(
          JSON.stringify([{
            id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            name: "Welcome Greeting",
            description: "A welcome template",
            flow_json: templateFlowJson,
            usage_count: 5,
          }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (callCount === 2) {
        // Second call: create automation
        const sentBody = init?.body ? JSON.parse(init.body as string) : {};

        // Verify deep copy: the sent flow_json should be a different reference
        expect(sentBody.flow_json).toEqual(templateFlowJson);
        expect(sentBody.flow_json).not.toBe(templateFlowJson);

        return new Response(
          JSON.stringify([createdAutomation]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (callCount === 3) {
        // Third call: update usage_count
        const sentBody = init?.body ? JSON.parse(init.body as string) : {};
        expect(sentBody.usage_count).toBe(6); // 5 + 1

        return new Response(
          JSON.stringify([{ usage_count: 6 }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not found", { status: 404 });
    });

    const response = await POST(createApplyRequest(), {
      params: Promise.resolve({ id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toHaveProperty("automation");
    expect(body.automation.id).toBe("auto-new-1");
    expect(body.automation.name).toBe("Welcome Greeting");
    expect(body.automation.status).toBe("draft");
    expect(body.automation.flow_json).toEqual(templateFlowJson);
    expect(body.automation.channels).toEqual([]);
  });

  it("increments usage_count by 1 on apply", async () => {
    const templateFlowJson = { nodes: [], edges: [] };
    let callCount = 0;

    vi.mocked(fetch).mockImplementation(async (_url: string | URL | Request, init?: RequestInit) => {
      callCount++;

      if (callCount === 1) {
        return new Response(
          JSON.stringify([{
            id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            name: "Test Template",
            description: "",
            flow_json: templateFlowJson,
            usage_count: 0,
          }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (callCount === 2) {
        return new Response(
          JSON.stringify([{ id: "auto-1", name: "Test Template", status: "draft" }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (callCount === 3) {
        const sentBody = init?.body ? JSON.parse(init.body as string) : {};
        expect(sentBody.usage_count).toBe(1); // 0 + 1
        return new Response(
          JSON.stringify([{ usage_count: 1 }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not found", { status: 404 });
    });

    await POST(createApplyRequest(), {
      params: Promise.resolve({ id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });

    expect(callCount).toBe(3);
  });

  it("returns 404 when template does not exist (valid UUID but no match)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await POST(createApplyRequest(), {
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

    const response = await POST(createApplyRequest(), {
      params: Promise.resolve({ id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("creates automation with deep copy (modifying result doesn't affect template)", async () => {
    const templateFlowJson = {
      nodes: [{ id: "start-1", type: "start", data: { label: "Original" } }],
      edges: [],
    };

    let automationFlowJson: unknown = null;
    let callCount = 0;

    vi.mocked(fetch).mockImplementation(async (_url: string | URL | Request, init?: RequestInit) => {
      callCount++;

      if (callCount === 1) {
        return new Response(
          JSON.stringify([{
            id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            name: "Test Template",
            description: "",
            flow_json: templateFlowJson,
            usage_count: 0,
          }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (callCount === 2) {
        const sentBody = init?.body ? JSON.parse(init.body as string) : {};
        automationFlowJson = sentBody.flow_json;
        return new Response(
          JSON.stringify([{ id: "auto-1", name: "Test Template", status: "draft" }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (callCount === 3) {
        return new Response(
          JSON.stringify([{ usage_count: 1 }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not found", { status: 404 });
    });

    await POST(createApplyRequest(), {
      params: Promise.resolve({ id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    });

    // Verify deep copy by modifying the result
    expect(automationFlowJson).toEqual(templateFlowJson);
    expect(automationFlowJson).not.toBe(templateFlowJson);

    if (automationFlowJson && typeof automationFlowJson === "object") {
      const autoFlow = automationFlowJson as { nodes: Array<{ data: { label: string } }> };
      autoFlow.nodes[0].data.label = "Modified";

      // Template should remain unchanged
      expect(templateFlowJson.nodes[0].data.label).toBe("Original");
    }
  });
});
