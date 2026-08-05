/**
 * Tests for src/lib/ai/chat-service.ts — Chat message processing
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@zuiio/capture", () => ({
  capture: vi.fn(),
}));

const { mockRunWithTools } = vi.hoisted(() => {
  return {
    mockRunWithTools: vi.fn(),
  };
});

vi.mock("@zuiio/ai-agent", () => ({
  runWithTools: mockRunWithTools,
}));

let processChatMessage: typeof import("../chat-service").processChatMessage;

describe("processChatMessage", () => {
  const mockSupabase = {} as unknown as SupabaseClient;
  const orgId = "org-1";

  beforeAll(async () => {
    process.env.DEEPSEEK_API_KEY = "sk-test";
    const mod = await import("../chat-service");
    processChatMessage = mod.processChatMessage;
  });

  afterAll(() => {
    delete process.env.DEEPSEEK_API_KEY;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns response from runWithTools", async () => {
    mockRunWithTools.mockResolvedValue("Ойлголоо. Энд 2 шинэ захиалга байна.");

    const result = await processChatMessage(mockSupabase, orgId, {
      message: "Өнөөдрийн захиалгуудыг харуул",
    });

    expect(result).toBe("Ойлголоо. Энд 2 шинэ захиалга байна.");
    expect(mockRunWithTools).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "sk-test",
        userMessage: "Өнөөдрийн захиалгуудыг харуул",
        tools: expect.arrayContaining([
          expect.objectContaining({ name: "getWorkOrders" }),
          expect.objectContaining({ name: "getPart" }),
          expect.objectContaining({ name: "getCustomer" }),
          expect.objectContaining({ name: "getInventoryBalance" }),
          expect.objectContaining({ name: "getTodayAppointments" }),
        ]),
        maxRounds: 4,
      }),
    );
  });

  it("passes conversation history to runWithTools", async () => {
    mockRunWithTools.mockResolvedValue("Тийм ээ, захиалга олдлоо.");

    const history = [
      { role: "user" as const, content: "Сайн уу" },
      {
        role: "assistant" as const,
        content: "Сайн байна уу? Танд юу тусалж чадах вэ?",
      },
    ];

    await processChatMessage(mockSupabase, orgId, {
      message: "Захиалга хайх",
      history,
    });

    expect(mockRunWithTools).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationHistory: expect.arrayContaining([
          expect.objectContaining({ role: "user", content: "Сайн уу" }),
          expect.objectContaining({
            role: "assistant",
            content: "Сайн байна уу? Танд юу тусалж чадах вэ?",
          }),
        ]),
      }),
    );
  });

  it("caps message and conversation history sizes", async () => {
    mockRunWithTools.mockResolvedValue("Хариулт");
    const history = Array.from({ length: 25 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: "x".repeat(5_000),
    }));

    await processChatMessage(mockSupabase, orgId, {
      message: "m".repeat(5_000),
      history,
    });

    const call = mockRunWithTools.mock.calls.at(-1)?.[0] as {
      userMessage: string;
      conversationHistory: Array<{ content: string }>;
    };
    expect(call.userMessage).toHaveLength(4_000);
    expect(call.conversationHistory).toHaveLength(20);
    expect(call.conversationHistory[0].content).toHaveLength(4_000);
  });

  it("handles empty history gracefully", async () => {
    mockRunWithTools.mockResolvedValue("Туслах текст");

    const result = await processChatMessage(mockSupabase, orgId, {
      message: "Туслах",
      history: [],
    });

    expect(result).toBe("Туслах текст");
  });

  it("throws when DEEPSEEK_API_KEY is not set", async () => {
    delete process.env.DEEPSEEK_API_KEY;

    await expect(
      processChatMessage(mockSupabase, orgId, { message: "test" }),
    ).rejects.toThrow("DEEPSEEK_API_KEY is not configured");

    process.env.DEEPSEEK_API_KEY = "sk-test";
  });
});
