/**
 * Facebook connect server actions — org-scoped connection reads and the
 * token-verified OAuth start (gateway stays invisible; orgId/productType
 * never come from the client).
 *
 * Uses vi.resetModules() + env set before import because GATEWAY_URL /
 * GATEWAY_API_SECRET are captured at module scope.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCapture = vi.fn();
const mockWithDbCapture = vi.fn(
  (_label: string, query: { then: (r: (v: unknown) => unknown) => unknown }) =>
    query.then((v: unknown) => v),
);
vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
  withDbCapture: mockWithDbCapture,
}));

const mockRequireActionContext = vi.fn();
vi.mock("@/lib/action-utils", () => ({
  requireActionContext: mockRequireActionContext,
}));

const mockCreateServiceClient = vi.fn();
vi.mock("@/lib/supabase/server-service", () => ({
  createServiceClient: mockCreateServiceClient,
}));

const ORG_ID = "org-123";
const USER_ID = "user-456";

function authedCtx() {
  return {
    organizationId: ORG_ID,
    userId: USER_ID,
    permissions: ["settings.manage"],
    supabase: {},
  };
}

/** Chainable supabase query mock — each method returns the chain, the
 * chain resolves to the given data/error. */
function chainResolving(result: { data?: unknown; error?: unknown }) {
  const chain = {
    // biome-ignore lint/suspicious/noThenProperty: intentional — supabase query chains are awaitable; the mock must be too
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
  };
  return chain;
}

function setGatewayEnv() {
  process.env.AGENT_GATEWAY_URL = "https://agent.example.com";
  process.env.AGENT_GATEWAY_API_SECRET = "test-secret";
}

function clearGatewayEnv() {
  delete process.env.AGENT_GATEWAY_URL;
  delete process.env.AGENT_GATEWAY_API_SECRET;
}

const mockFetch = vi.fn();

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
  mockCapture.mockClear();
  mockRequireActionContext.mockReset();
  mockCreateServiceClient.mockReset();
  mockWithDbCapture.mockClear();
});

afterEach(() => {
  clearGatewayEnv();
  vi.unstubAllGlobals();
});

describe("getFacebookConnections", () => {
  it("returns mapped connection rows scoped to the org", async () => {
    mockRequireActionContext.mockResolvedValue(authedCtx());
    mockCreateServiceClient.mockReturnValue({
      from: vi.fn(() =>
        chainResolving({
          data: [
            {
              channel: "messenger",
              page_id: "page-1",
              page_name: "Авто Сервис",
              created_at: "2026-08-01T00:00:00Z",
              webhook_subscribed_at: "2026-08-01T01:00:00Z",
              token_expires_at: "2026-09-30T00:00:00Z",
            },
            {
              channel: "instagram",
              page_id: "page-1",
              page_name: "Авто Сервис (Instagram)",
              created_at: "2026-08-01T00:00:00Z",
              webhook_subscribed_at: null,
              token_expires_at: null,
            },
          ],
          error: null,
        }),
      ),
    });

    const { getFacebookConnections } = await import("../facebook-actions");
    const rows = await getFacebookConnections();

    expect(rows).toEqual([
      {
        channel: "messenger",
        pageId: "page-1",
        pageName: "Авто Сервис",
        connectedAt: "2026-08-01T00:00:00Z",
        webhookSubscribedAt: "2026-08-01T01:00:00Z",
        tokenExpiresAt: "2026-09-30T00:00:00Z",
      },
      {
        channel: "instagram",
        pageId: "page-1",
        pageName: "Авто Сервис (Instagram)",
        connectedAt: "2026-08-01T00:00:00Z",
        webhookSubscribedAt: null,
        tokenExpiresAt: null,
      },
    ]);
  });

  it("queries only the caller's org and active messenger/instagram rows", async () => {
    mockRequireActionContext.mockResolvedValue(authedCtx());
    const chain = chainResolving({ data: [], error: null });
    const from = vi.fn(() => chain);
    mockCreateServiceClient.mockReturnValue({ from });

    const { getFacebookConnections } = await import("../facebook-actions");
    await getFacebookConnections();

    expect(from).toHaveBeenCalledWith("channel_connections");
    expect(chain.select).toHaveBeenCalledWith(
      "channel, page_id, page_name, created_at, webhook_subscribed_at, token_expires_at",
    );
    expect(chain.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(chain.eq).toHaveBeenCalledWith("is_active", true);
    expect(chain.in).toHaveBeenCalledWith("channel", [
      "messenger",
      "instagram",
    ]);
  });

  it("returns [] on query error and captures it", async () => {
    mockRequireActionContext.mockResolvedValue(authedCtx());
    mockCreateServiceClient.mockReturnValue({
      from: vi.fn(() =>
        chainResolving({ data: null, error: { message: "db down" } }),
      ),
    });

    const { getFacebookConnections } = await import("../facebook-actions");
    const rows = await getFacebookConnections();

    expect(rows).toEqual([]);
    expect(mockCapture).toHaveBeenCalledWith(
      { message: "db down" },
      expect.objectContaining({ context: "facebook: fetch connections" }),
    );
  });

  it("returns [] when the user lacks settings.manage", async () => {
    mockRequireActionContext.mockResolvedValue({
      error: "Танд эрх байхгүй байна.",
    });

    const { getFacebookConnections } = await import("../facebook-actions");
    const rows = await getFacebookConnections();

    expect(rows).toEqual([]);
    expect(mockCreateServiceClient).not.toHaveBeenCalled();
  });
});

describe("startFacebookOAuth", () => {
  function jsonResponse(status: number, body: unknown) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  it("mints a token then returns the verified OAuth dialog URL", async () => {
    mockRequireActionContext.mockResolvedValue(authedCtx());
    setGatewayEnv();
    mockFetch
      .mockResolvedValueOnce(jsonResponse(200, { token: "compact-token-1" }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          redirectUrl: "https://www.facebook.com/dialog/oauth?...",
        }),
      );

    const { startFacebookOAuth } = await import("../facebook-actions");
    const result = await startFacebookOAuth();

    expect("redirectUrl" in result && result.redirectUrl).toContain(
      "facebook.com/dialog/oauth",
    );

    // link/generate: orgId/userId/productType with the shared secret
    const [generateUrl, generateInit] = mockFetch.mock.calls[0];
    expect(generateUrl).toBe("https://agent.example.com/api/link/generate");
    expect(generateInit.headers["x-api-key"]).toBe("test-secret");
    expect(JSON.parse(generateInit.body)).toEqual({
      orgId: ORG_ID,
      userId: USER_ID,
      productType: "zer",
    });

    // facebook/start: only the compact token crosses the wire
    const [startUrl, startInit] = mockFetch.mock.calls[1];
    expect(startUrl).toBe("https://agent.example.com/api/facebook/start");
    expect(JSON.parse(startInit.body)).toEqual({ token: "compact-token-1" });
  });

  it("rejects when the gateway env is not configured", async () => {
    mockRequireActionContext.mockResolvedValue(authedCtx());
    clearGatewayEnv();

    const { startFacebookOAuth } = await import("../facebook-actions");
    const result = await startFacebookOAuth();

    expect("error" in result).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns the permission error when unauthorized", async () => {
    mockRequireActionContext.mockResolvedValue({
      error: "Танд эрх байхгүй байна.",
    });

    const { startFacebookOAuth } = await import("../facebook-actions");
    const result = await startFacebookOAuth();

    expect(result).toEqual({ error: "Танд эрх байхгүй байна." });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns an error when token minting fails", async () => {
    mockRequireActionContext.mockResolvedValue(authedCtx());
    setGatewayEnv();
    mockFetch.mockResolvedValueOnce(
      jsonResponse(401, { error: "Unauthorized" }),
    );

    const { startFacebookOAuth } = await import("../facebook-actions");
    const result = await startFacebookOAuth();

    expect(result).toEqual({ error: "Холболтын токен үүсгэхэд алдаа гарлаа." });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("surfaces the gateway error when the OAuth start fails", async () => {
    mockRequireActionContext.mockResolvedValue(authedCtx());
    setGatewayEnv();
    mockFetch
      .mockResolvedValueOnce(jsonResponse(200, { token: "t" }))
      .mockResolvedValueOnce(
        jsonResponse(500, { error: "Facebook app not configured" }),
      );

    const { startFacebookOAuth } = await import("../facebook-actions");
    const result = await startFacebookOAuth();

    expect(result).toEqual({ error: "Facebook app not configured" });
  });
});
