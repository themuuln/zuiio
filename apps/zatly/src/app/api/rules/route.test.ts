import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET, POST } from "./route";

// Mock the dependencies
vi.mock("@/lib/apiAuth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseRestContext: vi.fn(),
}));

import { requireAuth } from "@/lib/apiAuth";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";

function createRequest(method = "GET", body?: unknown, searchParams?: string): NextRequest {
  const url = searchParams
    ? `http://localhost:3001/api/rules?${searchParams}`
    : "http://localhost:3001/api/rules";
  const request = new NextRequest(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return request;
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

describe("GET /api/rules", () => {
  it("returns 200 with rules array", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: "rule-1",
            name: "Test Rule",
            event: "message_received",
            conditions: [{ field: "tag", operator: "contains", value: "vip" }],
            actions: [{ type: "notify", params: { message: "VIP message" } }],
            enabled: true,
            automation_id: null,
            created_at: "2026-06-15T00:00:00Z",
            updated_at: "2026-06-15T00:00:00Z",
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty("rules");
    expect(Array.isArray(body.rules)).toBe(true);
    expect(body.rules).toHaveLength(1);
    expect(body.rules[0]).toHaveProperty("id", "rule-1");
    expect(body.rules[0]).toHaveProperty("name", "Test Rule");
    expect(body.rules[0]).toHaveProperty("event", "message_received");
    expect(body.rules[0]).toHaveProperty("conditions");
    expect(body.rules[0]).toHaveProperty("actions");
    expect(body.rules[0]).toHaveProperty("enabled", true);
    expect(body.rules[0]).toHaveProperty("automationId");
    expect(body.rules[0]).toHaveProperty("createdAt");
    expect(body.rules[0]).toHaveProperty("updatedAt");
  });

  it("returns empty array when no rules exist", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.rules).toEqual([]);
  });

  it("returns 401 without authentication", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await GET(createRequest());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });
});

describe("POST /api/rules", () => {
  const validRule = {
    name: "Test Rule",
    event: "message_received" as const,
    conditions: [{ field: "tag", operator: "contains", value: "vip" }],
    actions: [{ type: "notify", params: { message: "VIP message" } }],
  };

  it("creates a rule and returns 201 with rule object", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: "new-rule-1",
            name: "Test Rule",
            event: "message_received",
            conditions: [{ field: "tag", operator: "contains", value: "vip" }],
            actions: [{ type: "notify", params: { message: "VIP message" } }],
            enabled: true,
            automation_id: null,
            created_at: "2026-06-15T00:00:00Z",
            updated_at: "2026-06-15T00:00:00Z",
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await POST(createRequest("POST", validRule));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toHaveProperty("rule");
    expect(body.rule.name).toBe("Test Rule");
    expect(body.rule.event).toBe("message_received");
    expect(body.rule.enabled).toBe(true);
    expect(body.rule.id).toBeDefined();
  });

  it("validates event enum (5 valid values)", async () => {
    const invalidRule = { ...validRule, event: "invalid_event" };
    const response = await POST(createRequest("POST", invalidRule));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("validates minimum conditions requirement", async () => {
    const invalidRule = { ...validRule, conditions: [] };
    const response = await POST(createRequest("POST", invalidRule));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("validates minimum actions requirement", async () => {
    const invalidRule = { ...validRule, actions: [] };
    const response = await POST(createRequest("POST", invalidRule));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("validates missing name", async () => {
    const invalidRule = { ...validRule, name: "" };
    const response = await POST(createRequest("POST", invalidRule));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 for invalid data", async () => {
    const invalidRule = { name: "", event: "bad", conditions: [], actions: [] };
    const response = await POST(createRequest("POST", invalidRule));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("supports all five event types", async () => {
    const events = [
      "message_received",
      "tag_added",
      "contact_subscribed",
      "contact_unsubscribed",
      "automation_triggered",
    ] as const;

    for (const event of events) {
      const rule = { ...validRule, event };
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockReset();
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify([{ ...validRule, id: `rule-${event}`, event }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const response = await POST(createRequest("POST", rule));
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.rule.event).toBe(event);
    }
  });

  it("creates rule with automation_id reference", async () => {
    const automationUuid = "550e8400-e29b-41d4-a716-446655440000";
    const ruleWithAutomation = {
      ...validRule,
      automation_id: automationUuid,
    };

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: "new-rule-2",
            name: "Test Rule",
            event: "message_received",
            conditions: [{ field: "tag", operator: "contains", value: "vip" }],
            actions: [{ type: "notify", params: { message: "VIP message" } }],
            enabled: true,
            automation_id: automationUuid,
            created_at: "2026-06-15T00:00:00Z",
            updated_at: "2026-06-15T00:00:00Z",
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await POST(createRequest("POST", ruleWithAutomation));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.rule.automationId).toBe(automationUuid);
  });

  it("returns 401 without authentication", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await POST(createRequest("POST", validRule));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });
});
