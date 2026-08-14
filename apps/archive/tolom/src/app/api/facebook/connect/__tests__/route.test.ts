import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/errors";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

const createSimpleRouteHandlerMock = vi.hoisted(() =>
  vi.fn((handler: unknown) => handler),
);

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: createSimpleRouteHandlerMock,
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  apiError: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code, message } }), {
        status,
      }),
  ),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

// Dynamic imports after vi.mock are the standard Vitest route-test pattern
// (module-loading boundary: the mocked modules must be registered before the
// route module is evaluated).
const { POST } = await import("../route");

type HandlerContext = {
  user: { id: string };
  supabase: unknown;
};

const handler = POST as unknown as (ctx: HandlerContext) => Promise<Response>;

function setupMembership(client: ReturnType<typeof createMockSupabaseClient>) {
  // Route `.maybeSingle()` through the shared thenable qb
  client
    .from("organization_users")
    .maybeSingle.mockReturnValue(client.from("organization_users") as never);
  client.__qb.resolveOnce({ data: { organization_id: "org-1" }, error: null });
}

function gatewayJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
});

describe("POST /api/facebook/connect", () => {
  it("mints a link token, builds the OAuth URL and returns the redirectUrl", async () => {
    const client = createMockSupabaseClient();
    setupMembership(client);
    fetchMock
      .mockResolvedValueOnce(gatewayJsonResponse({ token: "tok-1" }))
      .mockResolvedValueOnce(
        gatewayJsonResponse({ redirectUrl: "https://fb.example/oauth" }),
      );

    const response = await handler({ user: { id: "u-1" }, supabase: client });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ redirectUrl: "https://fb.example/oauth" });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://agent.zuiiotech.com/api/link/generate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          orgId: "org-1",
          userId: "u-1",
          productType: "tolom",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://agent.zuiiotech.com/api/facebook/start",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "tok-1" }),
      }),
    );
  });

  it("rejects when the user is not a member of any organization", async () => {
    const client = createMockSupabaseClient();
    client.__qb.resolveOnce({ data: null, error: null });

    await expect(
      handler({ user: { id: "u-1" }, supabase: client }),
    ).rejects.toThrow(NotFoundError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a gateway error when the token endpoint fails", async () => {
    const client = createMockSupabaseClient();
    setupMembership(client);
    fetchMock.mockResolvedValueOnce(
      gatewayJsonResponse({ error: "link generation failed" }, 500),
    );

    const response = await handler({ user: { id: "u-1" }, supabase: client });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toEqual({
      code: "GATEWAY_ERROR",
      message: "link generation failed",
    });
  });

  it("falls back to a default message when the token is missing", async () => {
    const client = createMockSupabaseClient();
    setupMembership(client);
    fetchMock.mockResolvedValueOnce(gatewayJsonResponse({}));

    const response = await handler({ user: { id: "u-1" }, supabase: client });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.message).toBe("Failed to generate link token");
  });

  it("returns a gateway error when the OAuth start fails", async () => {
    const client = createMockSupabaseClient();
    setupMembership(client);
    fetchMock
      .mockResolvedValueOnce(gatewayJsonResponse({ token: "tok-1" }))
      .mockResolvedValueOnce(
        gatewayJsonResponse({ error: "oauth start failed" }, 500),
      );

    const response = await handler({ user: { id: "u-1" }, supabase: client });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toEqual({
      code: "GATEWAY_ERROR",
      message: "oauth start failed",
    });
  });
});
