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
const { GET } = await import("../route");

type HandlerContext = {
  user: { id: string };
  supabase: unknown;
};

const handler = GET as unknown as (ctx: HandlerContext) => Promise<Response>;

function setupMembership(client: ReturnType<typeof createMockSupabaseClient>) {
  // Route `.maybeSingle()` through the shared thenable qb
  client
    .from("organization_users")
    .maybeSingle.mockReturnValue(client.from("organization_users") as never);
  client.__qb.resolveOnce({ data: { organization_id: "org-1" }, error: null });
}

const CONNECTIONS = [
  {
    channel: "messenger",
    pageId: "page-1",
    pageName: "UB Auto Service",
    connectedAt: "2026-08-01T00:00:00Z",
    webhookSubscribedAt: "2026-08-01T00:00:00Z",
    tokenExpiresAt: null,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
});

describe("GET /api/facebook/connections", () => {
  it("proxies the org connections from the gateway", async () => {
    const client = createMockSupabaseClient();
    setupMembership(client);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ connections: CONNECTIONS }), {
        status: 200,
      }),
    );

    const response = await handler({ user: { id: "u-1" }, supabase: client });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ connections: CONNECTIONS });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://agent.zuiiotech.com/api/facebook/connections?orgId=org-1",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-api-key": "" }),
        cache: "no-store",
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

  it("returns a gateway error when the proxy call fails", async () => {
    const client = createMockSupabaseClient();
    setupMembership(client);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "gateway down" }), {
        status: 502,
      }),
    );

    const response = await handler({ user: { id: "u-1" }, supabase: client });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toEqual({
      code: "GATEWAY_ERROR",
      message: "gateway down",
    });
  });

  it("defaults to an empty list when the connections key is missing", async () => {
    const client = createMockSupabaseClient();
    setupMembership(client);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    const response = await handler({ user: { id: "u-1" }, supabase: client });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ connections: [] });
  });
});
