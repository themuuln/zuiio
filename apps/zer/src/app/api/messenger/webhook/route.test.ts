import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockRunWithTools = vi.fn();
vi.mock("@zuiio/ai-agent", () => ({
  runWithTools: (...args: unknown[]) => mockRunWithTools(...args),
}));

const mockCreateAllAgentTools = vi.fn();
vi.mock("@/lib/agent-tools", () => ({
  createAllAgentTools: (...args: unknown[]) => mockCreateAllAgentTools(...args),
}));

const mockBindBuyerSession = vi.fn();
const mockGetBuyerSession = vi.fn();
const mockGetBuyerOrg = vi.fn();
const mockRunBuyerAgent = vi.fn();
const mockTouchBuyerSession = vi.fn();
vi.mock("@/lib/bot-commerce", () => ({
  bindBuyerSession: (...args: unknown[]) => mockBindBuyerSession(...args),
  getBuyerSession: (...args: unknown[]) => mockGetBuyerSession(...args),
  getBuyerOrg: (...args: unknown[]) => mockGetBuyerOrg(...args),
  runBuyerAgent: (...args: unknown[]) => mockRunBuyerAgent(...args),
  touchBuyerSession: (...args: unknown[]) => mockTouchBuyerSession(...args),
}));

const mockCreateServiceClient = vi.fn();
vi.mock("@/lib/supabase/server-service", () => ({
  createServiceClient: () => mockCreateServiceClient(),
}));

vi.mock("@zuiio/capture", () => ({
  capture: vi.fn(),
}));

import { POST } from "./route";

const PAGE_TOKEN = "EAA-test-page-token";
const SHOP = { id: "org-1", name: "Storefront E2E Shop" };
const BUYER_SESSION = {
  id: "session-1",
  channel: "messenger",
  external_id: "PSID1",
  organization_id: SHOP.id,
  created_at: "2026-08-11T00:00:00Z",
  last_active_at: "2026-08-11T00:00:00Z",
};
const BUYER_ORG = {
  id: SHOP.id,
  slug: "storefront-e2e-test",
  name: SHOP.name,
  currency: "MNT",
};

const mockFetch = vi.fn();

function makeSupabase(overrides: {
  pageToken?: unknown;
  merchantLink?: unknown;
  organizations?: unknown;
}) {
  const chain = (data: unknown) => ({
    select: () => chain(data),
    eq: () => chain(data),
    update: () => chain(data),
    maybeSingle: async () => ({ data: data ?? null, error: null }),
  });
  return {
    from: vi.fn((table: string) => {
      if (table === "app_config") return chain(overrides.pageToken);
      if (table === "messenger_agent_links")
        return chain(overrides.merchantLink);
      if (table === "organizations") return chain(overrides.organizations);
      return chain(null);
    }),
  };
}

function messengerEvent(messaging: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/messenger/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      object: "page",
      entry: [{ messaging: [messaging] }],
    }),
  });
}

function lastSendBody(): Record<string, unknown> {
  const call = mockFetch.mock.calls.at(-1);
  return JSON.parse(String(call?.[1]?.body));
}

describe("POST /api/messenger/webhook", () => {
  beforeEach(() => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-deepseek-key");

    mockFetch.mockReset().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    mockBindBuyerSession.mockReset().mockResolvedValue(undefined);
    mockGetBuyerSession.mockReset();
    mockGetBuyerOrg.mockReset().mockResolvedValue(BUYER_ORG);
    mockRunBuyerAgent.mockReset().mockResolvedValue("Захиалга бэлэн байна.");
    mockTouchBuyerSession.mockReset().mockResolvedValue(undefined);
    mockRunWithTools.mockReset().mockResolvedValue("Борлуулалт 10000₮.");
    mockCreateAllAgentTools
      .mockReset()
      .mockReturnValue([{ name: "sales_today" }]);

    mockCreateServiceClient.mockReturnValue(
      makeSupabase({
        pageToken: { value: { token: PAGE_TOKEN } },
        merchantLink: null,
        organizations: SHOP,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("binds a buyer session on a deep-link referral and welcomes them", async () => {
    const res = await POST(
      messengerEvent({
        sender: { id: "PSID1" },
        referral: { ref: "storefront-e2e-test", source: "SHORTLINK" },
      }),
    );
    expect(res.status).toBe(200);

    await vi.waitFor(() => {
      expect(mockBindBuyerSession).toHaveBeenCalledWith(
        expect.anything(),
        "messenger",
        "PSID1",
        SHOP.id,
      );
    });

    expect(mockFetch.mock.calls[0][0]).toContain("graph.facebook.com");
    expect(lastSendBody()).toMatchObject({
      recipient: { id: "PSID1" },
    });
    expect(String(lastSendBody().message?.text)).toContain(SHOP.name);
  });

  it("replies with an unknown-shop message for a bad referral slug", async () => {
    mockCreateServiceClient.mockReturnValue(
      makeSupabase({ pageToken: { value: { token: PAGE_TOKEN } } }),
    );

    const res = await POST(
      messengerEvent({
        sender: { id: "PSID1" },
        referral: { ref: "no-such-shop", source: "SHORTLINK" },
      }),
    );
    expect(res.status).toBe(200);

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    expect(mockBindBuyerSession).not.toHaveBeenCalled();
    expect(String(lastSendBody().message?.text)).toContain("Дэлгүүр олдсонгүй");
  });

  it("runs the merchant agent for a linked sender", async () => {
    mockCreateServiceClient.mockReturnValue(
      makeSupabase({
        pageToken: { value: { token: PAGE_TOKEN } },
        merchantLink: { organization_id: SHOP.id, user_id: "u-1" },
      }),
    );

    const res = await POST(
      messengerEvent({
        sender: { id: "PSID1" },
        message: { text: "Өнөөдрийн борлуулалт" },
      }),
    );
    expect(res.status).toBe(200);

    await vi.waitFor(() => {
      expect(mockRunWithTools).toHaveBeenCalled();
    });
    expect(mockCreateAllAgentTools).toHaveBeenCalledWith(
      expect.anything(),
      SHOP.id,
    );
    expect(mockRunBuyerAgent).not.toHaveBeenCalled();
    expect(String(lastSendBody().message?.text)).toBe("Борлуулалт 10000₮.");
  });

  it("runs the buyer agent for a session-bound sender", async () => {
    mockGetBuyerSession.mockResolvedValue(BUYER_SESSION);

    const res = await POST(
      messengerEvent({
        sender: { id: "PSID1" },
        message: { text: "Утас байна уу?" },
      }),
    );
    expect(res.status).toBe(200);

    await vi.waitFor(() => {
      expect(mockRunBuyerAgent).toHaveBeenCalled();
    });
    expect(mockRunBuyerAgent).toHaveBeenCalledWith({
      supabase: expect.anything(),
      org: BUYER_ORG,
      text: "Утас байна уу?",
      baseUrl: "http://localhost:3000",
    });
    expect(mockTouchBuyerSession).toHaveBeenCalledWith(
      expect.anything(),
      BUYER_SESSION.id,
    );
    expect(String(lastSendBody().message?.text)).toBe("Захиалга бэлэн байна.");
  });

  it("asks an unbound sender to use the storefront deep link", async () => {
    const res = await POST(
      messengerEvent({
        sender: { id: "PSID1" },
        message: { text: "Сайн уу" },
      }),
    );
    expect(res.status).toBe(200);

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    expect(mockRunBuyerAgent).not.toHaveBeenCalled();
    expect(String(lastSendBody().message?.text)).toContain(
      "Messenger-ээр захиалах",
    );
  });
});
