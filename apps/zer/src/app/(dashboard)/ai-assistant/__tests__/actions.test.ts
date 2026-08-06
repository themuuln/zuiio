import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockRequireAppContext = vi.fn();
vi.mock("@/lib/erp", () => ({
  requireAppContext: () => mockRequireAppContext(),
  checkPermission: vi.fn().mockReturnValue(null),
}));

const mockRunWithTools = vi.fn();
vi.mock("@zuiio/ai-agent", () => ({
  runWithTools: (...args: unknown[]) => mockRunWithTools(...args),
}));

const mockCreateAllAgentTools = vi.fn();
vi.mock("@/lib/agent-tools", () => ({
  createAllAgentTools: (...args: unknown[]) => mockCreateAllAgentTools(...args),
}));

const mockCreateServiceClient = vi.fn();
vi.mock("@/lib/supabase/server-service", () => ({
  createServiceClient: () => mockCreateServiceClient(),
}));

vi.mock("@sentry/nextjs", () => ({
  startSpan: (_opts: unknown, fn: (span: unknown) => Promise<unknown>) =>
    fn({ setAttribute: vi.fn(), setAttributes: vi.fn() }),
}));

vi.mock("@zuiio/capture", () => ({
  capture: vi.fn(),
}));

import { askAssistant } from "../actions";

const CONFIG_ERROR =
  "AI туслах тохиргоогүй байна. DEEPSEEK_API_KEY тохируулна уу.";

const MOCK_TOOLS = [{ name: "inventory_low_stock" }, { name: "sales_today" }];

function buildFormData(
  overrides: { userMessage?: string; history?: unknown; orgName?: string } = {},
): FormData {
  const fd = new FormData();
  fd.set("userMessage", overrides.userMessage ?? "Өнөөдрийн борлуулалт?");
  if (overrides.history !== undefined) {
    fd.set("history", JSON.stringify(overrides.history));
  }
  if (overrides.orgName !== undefined) {
    fd.set("orgName", overrides.orgName);
  }
  return fd;
}

function validMessage(role: "user" | "assistant", content: string) {
  return { role, content };
}

describe("askAssistant", () => {
  beforeEach(() => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    mockRequireAppContext.mockResolvedValue({
      organizationId: "org-1",
      permissions: ["*"],
    });
    mockCreateServiceClient.mockReturnValue({ from: vi.fn() });
    mockCreateAllAgentTools.mockReturnValue(MOCK_TOOLS);
    mockRunWithTools.mockResolvedValue("Борлуулалт 1,200,000₮ байна.");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("passes the message, tools, and history through to runWithTools", async () => {
    const history = [
      validMessage("user", "Ашиг гэж юу вэ?"),
      validMessage("assistant", "Ашиг гэдэг нь орлогоос зардлыг хасна."),
    ];

    const result = await askAssistant(undefined, buildFormData({ history }));

    expect(result).toEqual({ answer: "Борлуулалт 1,200,000₮ байна." });
    expect(mockRequireAppContext).toHaveBeenCalledTimes(1);
    expect(mockCreateServiceClient).toHaveBeenCalledTimes(1);
    expect(mockCreateAllAgentTools).toHaveBeenCalledWith(
      expect.anything(),
      "org-1",
    );

    const opts = mockRunWithTools.mock.calls[0][0];
    expect(opts.apiKey).toBe("test-key");
    expect(opts.userMessage).toBe("Өнөөдрийн борлуулалт?");
    expect(opts.tools).toBe(MOCK_TOOLS);
    expect(opts.maxRounds).toBe(5);
    expect(opts.conversationHistory).toEqual(history);
    expect(opts.systemPrompt).toContain("Монголоор хариулна уу");
    expect(opts.systemPrompt).toContain("Zer ERP");
  });

  it("includes the org name in the system prompt when provided", async () => {
    await askAssistant(undefined, buildFormData({ orgName: "Миний дэлгүүр" }));

    const opts = mockRunWithTools.mock.calls[0][0];
    expect(opts.systemPrompt).toContain("Миний дэлгүүр");
  });

  it("returns a config error and never calls runWithTools when the API key is missing", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");

    const result = await askAssistant(undefined, buildFormData());

    expect(result).toEqual({ error: CONFIG_ERROR });
    expect(mockRunWithTools).not.toHaveBeenCalled();
    expect(mockCreateServiceClient).not.toHaveBeenCalled();
  });

  it("returns an error for an empty message", async () => {
    const result = await askAssistant(
      undefined,
      buildFormData({ userMessage: "   " }),
    );

    expect(result).toEqual({ error: "Асуултаа бичнэ үү." });
    expect(mockRunWithTools).not.toHaveBeenCalled();
  });

  it("caps malformed history at the last 20 valid messages", async () => {
    const valid = Array.from({ length: 25 }, (_, i) =>
      validMessage(i % 2 === 0 ? "user" : "assistant", `мессеж ${i}`),
    );
    const malformed = [
      { role: "system", content: "skip me" },
      { role: "user", content: 42 },
      "not-an-object",
      { content: "no role" },
      null,
    ];

    await askAssistant(
      undefined,
      buildFormData({ history: [...malformed, ...valid] }),
    );

    const opts = mockRunWithTools.mock.calls[0][0];
    expect(opts.conversationHistory).toHaveLength(20);
    expect(opts.conversationHistory[0]).toEqual(
      validMessage("assistant", "мессеж 5"),
    );
    expect(opts.conversationHistory[19]).toEqual(
      validMessage("user", "мессеж 24"),
    );
  });

  it("passes an empty history when the history field is not valid JSON", async () => {
    const fd = buildFormData();
    fd.set("history", "{not-json");

    await askAssistant(undefined, fd);

    const opts = mockRunWithTools.mock.calls[0][0];
    expect(opts.conversationHistory).toEqual([]);
  });
});
