import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockRunWithTools = vi.fn();
vi.mock("@zuiio/ai-agent", () => ({
  runWithTools: (...args: unknown[]) => mockRunWithTools(...args),
}));

const mockCreateStorefrontAgentTools = vi.fn();
vi.mock("@/lib/agent-tools/storefront", () => ({
  createStorefrontAgentTools: (...args: unknown[]) =>
    mockCreateStorefrontAgentTools(...args),
}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("@zuiio/capture", () => ({
  capture: vi.fn(),
}));

import { POST } from "./route";

const ORG = {
  id: "org-1",
  name: "Storefront E2E Shop",
  currency: "MNT",
  slug: "storefront-e2e-test",
};

function mockOrgLookup(org: typeof ORG | null) {
  mockCreateClient.mockReturnValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: org, error: null }),
        }),
      }),
    }),
  });
}

function buildRequest(body: unknown, ip?: string) {
  return new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ip ? { "x-forwarded-for": ip } : {}),
    },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  slug: "storefront-e2e-test",
  messages: [
    { role: "user", content: "Сайн уу" },
    { role: "assistant", content: "Сайн байна уу" },
    { role: "user", content: "Утас байна уу?" },
  ],
  baseUrl: "https://shop.example.mn",
};

describe("POST /api/ai/chat", () => {
  beforeEach(() => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-deepseek-key");
    mockRunWithTools.mockReset();
    mockCreateStorefrontAgentTools
      .mockReset()
      .mockReturnValue([{ name: "search_products" }]);
    mockOrgLookup(ORG);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 400 for a non-JSON body", async () => {
    const res = await POST(
      new Request("http://localhost/api/ai/chat", {
        method: "POST",
        body: "not-json",
      }),
    );
    expect(res.status).toBe(400);
    expect(mockRunWithTools).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing or invalid slug", async () => {
    for (const body of [
      { ...VALID_BODY, slug: "" },
      { ...VALID_BODY, slug: "bad slug!" },
      { ...VALID_BODY, slug: "x".repeat(65) },
      { slug: "storefront-e2e-test" },
    ]) {
      const res = await POST(buildRequest(body));
      expect(res.status).toBe(400);
    }
  });

  it("returns 400 for invalid messages", async () => {
    const invalidMessages = [
      [],
      [{ role: "system", content: "hi" }],
      [{ role: "user", content: "" }],
      [{ role: "user", content: "x".repeat(2001) }],
      "not-an-array",
    ];
    for (const messages of invalidMessages) {
      const res = await POST(buildRequest({ ...VALID_BODY, messages }));
      expect(res.status).toBe(400);
    }
  });

  it("returns 404 for an unknown slug", async () => {
    mockOrgLookup(null);
    const res = await POST(buildRequest(VALID_BODY));
    expect(res.status).toBe(404);
    expect(mockRunWithTools).not.toHaveBeenCalled();
  });

  it("returns 503 when DEEPSEEK_API_KEY is missing", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    const res = await POST(buildRequest(VALID_BODY));
    expect(res.status).toBe(503);
    expect(mockRunWithTools).not.toHaveBeenCalled();
  });

  it("runs the agent with mapped history and returns the reply", async () => {
    const reply = "Танд 2 утас байна.";
    mockRunWithTools.mockResolvedValue(reply);

    const res = await POST(buildRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reply });

    const opts = mockRunWithTools.mock.calls[0][0];
    expect(opts.userMessage).toBe("Утас байна уу?");
    expect(opts.conversationHistory).toEqual([
      { role: "user", content: "Сайн уу" },
      { role: "assistant", content: "Сайн байна уу" },
    ]);
    expect(opts.maxRounds).toBe(4);
    expect(opts.systemPrompt).toContain("Storefront E2E Shop");
    expect(opts.systemPrompt).toContain("MNT");
    expect(mockCreateStorefrontAgentTools).toHaveBeenCalledWith(
      expect.anything(),
      "storefront-e2e-test",
      "https://shop.example.mn",
    );
  });

  it("rejects a non-http baseUrl", async () => {
    mockRunWithTools.mockResolvedValue("ok");
    await POST(buildRequest({ ...VALID_BODY, baseUrl: "javascript:alert(1)" }));
    const opts = mockRunWithTools.mock.calls[0][0];
    expect(opts.systemPrompt).not.toContain("javascript:");
  });

  it("returns 500 and captures when the agent throws", async () => {
    mockRunWithTools.mockRejectedValue(new Error("deepseek down"));
    const res = await POST(buildRequest(VALID_BODY));
    expect(res.status).toBe(500);
  });

  it("rate-limits a single IP after 20 requests", async () => {
    mockRunWithTools.mockResolvedValue("ok");
    const ip = "203.0.113.77";

    for (let i = 0; i < 20; i++) {
      const res = await POST(buildRequest(VALID_BODY, ip));
      expect(res.status).toBe(200);
    }

    const res = await POST(buildRequest(VALID_BODY, ip));
    expect(res.status).toBe(429);
  });
});
