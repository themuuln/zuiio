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

const BOT_TOKEN = "123456:test-bot-token";
const SHOP = { id: "org-1", name: "Storefront E2E Shop" };
const BUYER_SESSION = {
  id: "session-1",
  channel: "telegram",
  external_id: "12345",
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
  botToken?: unknown;
  merchantLink?: unknown;
  organizations?: unknown | ((slug: string) => unknown);
}) {
  const chain = (provider: unknown) => ({
    select: () => chain(provider),
    eq: (_col: string, val: unknown) =>
      chain(typeof provider === "function" ? provider(String(val)) : provider),
    update: () => chain(provider),
    maybeSingle: async () => {
      const resolved = typeof provider === "function" ? provider("") : provider;
      return { data: resolved ?? null, error: null };
    },
  });
  return {
    from: vi.fn((table: string) => {
      if (table === "app_config") return chain(overrides.botToken);
      if (table === "telegram_agent_links")
        return chain(overrides.merchantLink);
      if (table === "organizations") return chain(overrides.organizations);
      return chain(null);
    }),
  };
}

function telegramRequest(text: string) {
  return new Request("http://localhost:3000/api/telegram/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer test-webhook-secret",
    },
    body: JSON.stringify({
      message: { chat: { id: 12345 }, text },
    }),
  });
}

describe("POST /api/telegram/webhook", () => {
  beforeEach(() => {
    vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "test-webhook-secret");
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
        botToken: { value: { token: BOT_TOKEN } },
        merchantLink: null,
        organizations: (slug: string) =>
          slug === "storefront-e2e-test" ? SHOP : null,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rejects requests without the webhook secret", async () => {
    const res = await POST(
      new Request("http://localhost:3000/api/telegram/webhook", {
        method: "POST",
        body: JSON.stringify({ message: { chat: { id: 1 }, text: "hi" } }),
      }),
    );
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("accepts Telegram's X-Telegram-Bot-Api-Secret-Token header", async () => {
    const res = await POST(
      new Request("http://localhost:3000/api/telegram/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Bot-Api-Secret-Token": "test-webhook-secret",
        },
        body: JSON.stringify({
          message: { chat: { id: 12345 }, text: "/start storefront-e2e-test" },
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(mockBindBuyerSession).toHaveBeenCalled();
  });

  it("binds a buyer session on /start <slug> and welcomes them", async () => {
    const res = await POST(telegramRequest("/start storefront-e2e-test"));
    expect(res.status).toBe(200);

    expect(mockBindBuyerSession).toHaveBeenCalledWith(
      expect.anything(),
      "telegram",
      "12345",
      SHOP.id,
    );

    const sendBody = JSON.parse(String(mockFetch.mock.calls[0][1]?.body));
    expect(sendBody.chat_id).toBe(12345);
    expect(sendBody.text).toContain(SHOP.name);
    expect(sendBody.text).toContain("AI туслах");
    expect(mockFetch.mock.calls[0][0]).toContain(`bot${BOT_TOKEN}/sendMessage`);
  });

  it("replies with an unknown-shop message for a bad slug and never binds", async () => {
    const res = await POST(telegramRequest("/start no-such-shop"));
    expect(res.status).toBe(200);

    expect(mockBindBuyerSession).not.toHaveBeenCalled();
    const sendBody = JSON.parse(String(mockFetch.mock.calls[0][1]?.body));
    expect(sendBody.text).toContain("Дэлгүүр олдсонгүй");
  });

  it("welcomes an existing buyer on a plain /start", async () => {
    mockGetBuyerSession.mockResolvedValue(BUYER_SESSION);

    const res = await POST(telegramRequest("/start"));
    expect(res.status).toBe(200);

    expect(mockBindBuyerSession).not.toHaveBeenCalled();
    const sendBody = JSON.parse(String(mockFetch.mock.calls[0][1]?.body));
    expect(sendBody.text).toContain(SHOP.name);
  });

  it("runs the merchant agent and SENDS the reply (regression: reply was discarded)", async () => {
    mockCreateServiceClient.mockReturnValue(
      makeSupabase({
        botToken: { value: { token: BOT_TOKEN } },
        merchantLink: { organization_id: SHOP.id, user_id: "u-1" },
      }),
    );

    const res = await POST(telegramRequest("Өнөөдрийн борлуулалт"));
    expect(res.status).toBe(200);

    expect(mockCreateAllAgentTools).toHaveBeenCalledWith(
      expect.anything(),
      SHOP.id,
    );
    expect(mockRunWithTools).toHaveBeenCalled();
    expect(mockRunBuyerAgent).not.toHaveBeenCalled();

    const sendBody = JSON.parse(String(mockFetch.mock.calls[0][1]?.body));
    expect(sendBody.text).toBe("Борлуулалт 10000₮.");
  });

  it("runs the buyer agent when a buyer session exists and sends the reply", async () => {
    mockGetBuyerSession.mockResolvedValue(BUYER_SESSION);

    const res = await POST(telegramRequest("Утас байна уу?"));
    expect(res.status).toBe(200);

    expect(mockGetBuyerSession).toHaveBeenCalledWith(
      expect.anything(),
      "telegram",
      "12345",
    );
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

    const sendBody = JSON.parse(String(mockFetch.mock.calls[0][1]?.body));
    expect(sendBody.text).toBe("Захиалга бэлэн байна.");
  });

  it("asks an unbound sender to use the storefront deep link", async () => {
    const res = await POST(telegramRequest("Сайн уу"));
    expect(res.status).toBe(200);

    expect(mockRunBuyerAgent).not.toHaveBeenCalled();
    const sendBody = JSON.parse(String(mockFetch.mock.calls[0][1]?.body));
    expect(sendBody.text).toContain("Telegram-ээр захиалах");
  });

  it("reports a missing bot token instead of crashing", async () => {
    mockCreateServiceClient.mockReturnValue(
      makeSupabase({ botToken: null, merchantLink: null }),
    );

    const res = await POST(telegramRequest("/start storefront-e2e-test"));
    expect(res.status).toBe(200);

    // No token anywhere (DB + env) → nothing can be sent; the route must
    // degrade gracefully without binding a session or crashing.
    expect(mockBindBuyerSession).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
