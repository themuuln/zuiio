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

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { requireAuth } from "@/lib/apiAuth";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabase/server";

function createGetRequest(searchParams?: string): NextRequest {
  const url = searchParams
    ? `http://localhost:3001/api/templates?${searchParams}`
    : "http://localhost:3001/api/templates";
  return new NextRequest(url);
}

function createPostRequest(body?: unknown): NextRequest {
  return new NextRequest("http://localhost:3001/api/templates", {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
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

const mockBuiltInTemplates = [
  {
    id: "builtin-1",
    name: "Welcome Greeting",
    description: "A welcome template",
    category: "welcome",
    channels: ["messenger"],
    flow_json: { nodes: [{ id: "n1", type: "start" }], edges: [] },
    is_builtin: true,
    usage_count: 5,
    user_id: null,
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "builtin-2",
    name: "FAQ Support",
    description: "An FAQ template",
    category: "support",
    channels: ["messenger"],
    flow_json: { nodes: [{ id: "n2", type: "condition" }], edges: [] },
    is_builtin: true,
    usage_count: 3,
    user_id: null,
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
];

const mockUserTemplate = {
  id: "user-tmpl-1",
  name: "My Custom Template",
  description: "A user-created template",
  category: "sales",
  channels: ["instagram"],
  flow_json: { nodes: [{ id: "n3", type: "sendMessage" }], edges: [] },
  is_builtin: false,
  usage_count: 1,
  user_id: "user-123",
  created_at: "2026-06-15T01:00:00Z",
  updated_at: "2026-06-15T01:00:00Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSupabaseRestContext).mockReturnValue(mockContext);
  vi.mocked(requireAuth).mockResolvedValue(null);
  vi.stubGlobal("fetch", vi.fn());
});

describe("GET /api/templates", () => {
  it("returns all templates as array with template objects", async () => {
    // Mock authenticated user
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    // Mock fetch to return both built-in and user templates
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([...mockBuiltInTemplates, mockUserTemplate]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await GET(createGetRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty("templates");
    expect(Array.isArray(body.templates)).toBe(true);
    expect(body.templates).toHaveLength(3);
    expect(body.templates[0]).toHaveProperty("id");
    expect(body.templates[0]).toHaveProperty("name");
    expect(body.templates[0]).toHaveProperty("description");
    expect(body.templates[0]).toHaveProperty("category");
    expect(body.templates[0]).toHaveProperty("channels");
    expect(body.templates[0]).toHaveProperty("flow_json");
    expect(body.templates[0]).toHaveProperty("is_builtin");
    expect(body.templates[0]).toHaveProperty("usageCount");
    expect(body.templates[0]).toHaveProperty("userId");
    expect(body.templates[0]).toHaveProperty("createdAt");
    expect(body.templates[0]).toHaveProperty("updatedAt");
  });

  it("filters templates by category", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as never);

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([mockBuiltInTemplates[0]]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await GET(createGetRequest("category=welcome"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.templates).toHaveLength(1);
    expect(body.templates[0].category).toBe("welcome");
  });

  it("filters templates by channel", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as never);

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([mockBuiltInTemplates[0]]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await GET(createGetRequest("channel=messenger"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.templates).toHaveLength(1);
  });

  it("returns built-in templates even without authentication", async () => {
    // Mock unauthenticated: createClient throws
    vi.mocked(createClient).mockRejectedValue(new Error("No session"));

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify(mockBuiltInTemplates),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await GET(createGetRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.templates).toHaveLength(2);
    expect(body.templates.every((t: { is_builtin: boolean }) => t.is_builtin)).toBe(true);
  });

  it("returns empty array for nonexistent category", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as never);

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await GET(createGetRequest("category=nonexistent"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.templates).toEqual([]);
  });
});

describe("POST /api/templates", () => {
  const validBody = {
    name: "My Template",
    description: "A test template",
    category: "welcome",
    channels: ["messenger"],
    flow_json: { nodes: [{ id: "n1", type: "start" }], edges: [] },
  };

  it("returns 401 without authentication", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await POST(createPostRequest(validBody));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 201 with created template for valid body", async () => {
    vi.mocked(requireAuth).mockResolvedValue(null);
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as never);

    const createdRow = {
      id: "new-tmpl-1",
      ...validBody,
      is_builtin: false,
      usage_count: 0,
      user_id: "user-123",
      created_at: "2026-06-15T02:00:00Z",
      updated_at: "2026-06-15T02:00:00Z",
    };

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([createdRow]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await POST(createPostRequest(validBody));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toHaveProperty("template");
    expect(body.template.name).toBe("My Template");
    expect(body.template.category).toBe("welcome");
    expect(body.template.is_builtin).toBe(false);
    expect(body.template.userId).toBe("user-123");
    expect(body.template.id).toBeDefined();
  });

  it("returns 400 when name is missing", async () => {
    const response = await POST(createPostRequest({ category: "welcome", description: "No name" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Name is required.");
  });

  it("returns 400 when name is empty", async () => {
    const response = await POST(createPostRequest({ name: "", category: "welcome" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Name is required.");
  });

  it("returns 400 for invalid category", async () => {
    const response = await POST(createPostRequest({ name: "Test", category: "invalid_cat" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid category");
  });

  it("returns 400 when category is missing", async () => {
    const response = await POST(createPostRequest({ name: "Test" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Category is required.");
  });

  it("sets is_builtin=false and user_id for authenticated user", async () => {
    vi.mocked(requireAuth).mockResolvedValue(null);
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-456" } },
          error: null,
        }),
      },
    } as never);

    const createdRow = {
      id: "new-tmpl-2",
      name: "Auth Template",
      description: "",
      category: "sales",
      channels: [],
      flow_json: { nodes: [], edges: [] },
      is_builtin: false,
      usage_count: 0,
      user_id: "user-456",
      created_at: "2026-06-15T03:00:00Z",
      updated_at: "2026-06-15T03:00:00Z",
    };

    // Track what was sent to the API
    let sentBody = "";
    vi.mocked(fetch).mockImplementation(async (_url: string | URL | Request, init?: RequestInit) => {
      if (init?.body) {
        sentBody = init.body as string;
      }
      return new Response(
        JSON.stringify([createdRow]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const response = await POST(createPostRequest({ name: "Auth Template", category: "sales" }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.template.is_builtin).toBe(false);
    expect(body.template.userId).toBe("user-456");

    // Verify the payload sent to Supabase has is_builtin=false and user_id
    const parsed = JSON.parse(sentBody);
    expect(parsed.is_builtin).toBe(false);
    expect(parsed.user_id).toBe("user-456");
  });
});
