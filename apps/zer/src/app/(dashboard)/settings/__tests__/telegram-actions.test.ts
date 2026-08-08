/**
 * Telegram device-code server action — the gateway's /api/link/code is
 * x-api-key protected (server-to-server only); the browser must never hold
 * the shared secret. This action proxies the call with the session org/user.
 *
 * Uses vi.resetModules() + env set before import because GATEWAY_URL /
 * GATEWAY_API_SECRET are captured at module scope.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCapture = vi.fn();
vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
  withDbCapture: vi.fn(
    (
      _label: string,
      query: { then: (r: (v: unknown) => unknown) => unknown },
    ) => query.then((v: unknown) => v),
  ),
}));

const mockRequireActionContext = vi.fn();
vi.mock("@/lib/action-utils", () => ({
  requireActionContext: mockRequireActionContext,
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

function setGatewayEnv() {
  process.env.AGENT_GATEWAY_URL = "https://agent.example.com";
  process.env.AGENT_GATEWAY_API_SECRET = "test-secret";
}

function clearGatewayEnv() {
  delete process.env.AGENT_GATEWAY_URL;
  delete process.env.AGENT_GATEWAY_API_SECRET;
}

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const mockFetch = vi.fn();

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
  mockCapture.mockClear();
  mockRequireActionContext.mockReset();
});

afterEach(() => {
  clearGatewayEnv();
  vi.unstubAllGlobals();
});

describe("getTelegramLinkCode", () => {
  it("returns the formatted code from the gateway", async () => {
    mockRequireActionContext.mockResolvedValue(authedCtx());
    setGatewayEnv();
    mockFetch.mockResolvedValue(
      jsonResponse(200, {
        code: "XK9M2P7Q",
        formatted: "XK9M-2P7Q",
        expiresInMinutes: 10,
      }),
    );

    const { getTelegramLinkCode } = await import("../telegram-actions");
    const result = await getTelegramLinkCode();

    expect(result).toEqual({ formatted: "XK9M-2P7Q" });
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.example.com/api/link/code");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe(
      "test-secret",
    );
    expect(JSON.parse(String(init.body))).toEqual({
      orgId: ORG_ID,
      userId: USER_ID,
      productType: "zer",
    });
  });

  it("returns null when the gateway rejects the request", async () => {
    mockRequireActionContext.mockResolvedValue(authedCtx());
    setGatewayEnv();
    mockFetch.mockResolvedValue(jsonResponse(401, { error: "Unauthorized" }));

    const { getTelegramLinkCode } = await import("../telegram-actions");
    const result = await getTelegramLinkCode();

    expect(result).toBeNull();
    expect(mockCapture).toHaveBeenCalled();
  });

  it("returns null when gateway env is not configured (never fetches)", async () => {
    mockRequireActionContext.mockResolvedValue(authedCtx());

    const { getTelegramLinkCode } = await import("../telegram-actions");
    const result = await getTelegramLinkCode();

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockCapture).toHaveBeenCalled();
  });

  it("returns null when the response has no formatted code", async () => {
    mockRequireActionContext.mockResolvedValue(authedCtx());
    setGatewayEnv();
    mockFetch.mockResolvedValue(jsonResponse(200, { error: "no code" }));

    const { getTelegramLinkCode } = await import("../telegram-actions");
    const result = await getTelegramLinkCode();

    expect(result).toBeNull();
  });

  it("returns null without permission", async () => {
    mockRequireActionContext.mockResolvedValue({
      error: "Танд эрх байхгүй байна.",
    });
    setGatewayEnv();

    const { getTelegramLinkCode } = await import("../telegram-actions");
    const result = await getTelegramLinkCode();

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns null when the fetch throws", async () => {
    mockRequireActionContext.mockResolvedValue(authedCtx());
    setGatewayEnv();
    mockFetch.mockRejectedValue(new Error("network down"));

    const { getTelegramLinkCode } = await import("../telegram-actions");
    const result = await getTelegramLinkCode();

    expect(result).toBeNull();
    expect(mockCapture).toHaveBeenCalled();
  });
});
