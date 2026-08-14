/**
 * Tests for src/app/api/organizations/[id]/ai/chat/route.ts
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock createRouteHandler to just call the handler directly
vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn(
    (handler: (ctx: Record<string, unknown>) => Promise<Response>) => handler,
  ),
}));

// Mock processChatMessage
const mockProcessChatMessage = vi.fn();

vi.mock("@/lib/ai/chat-service", () => ({
  processChatMessage: mockProcessChatMessage,
}));

vi.mock("server-only", () => ({}));

let POST: (context: Record<string, unknown>) => Promise<Response>;

describe("POST /api/organizations/[id]/ai/chat", () => {
  const orgId = "org-1";

  beforeAll(async () => {
    const route = await import("./route");
    POST = route.POST as (
      context: Record<string, unknown>,
    ) => Promise<Response>;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns AI reply on success", async () => {
    mockProcessChatMessage.mockResolvedValue("Танд 3 шинэ захиалга байна.");

    const request = new NextRequest(
      "http://localhost/api/organizations/org-1/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({ message: "Өнөөдрийн захиалгуудыг харуул" }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST({
      request,
      orgId,
      supabase: {},
      user: { id: "user-1" },
    } as Record<string, unknown>);

    const body = (await response.json()) as { reply: string };
    expect(body.reply).toBe("Танд 3 шинэ захиалга байна.");
    expect(mockProcessChatMessage).toHaveBeenCalledWith(
      {},
      orgId,
      expect.objectContaining({
        message: "Өнөөдрийн захиалгуудыг харуул",
      }),
    );
  });

  it("returns 400 when message is missing", async () => {
    const request = new NextRequest(
      "http://localhost/api/organizations/org-1/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST({
      request,
      orgId,
      supabase: {},
      user: { id: "user-1" },
    } as Record<string, unknown>);

    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: { code: string };
    };
    expect(body.error.code).toBe("VALIDATION");
  });

  it("returns 400 when message is empty", async () => {
    const request = new NextRequest(
      "http://localhost/api/organizations/org-1/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({ message: "   " }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST({
      request,
      orgId,
      supabase: {},
      user: { id: "user-1" },
    } as Record<string, unknown>);

    expect(response.status).toBe(400);
  });

  it("rejects oversized messages and malformed history", async () => {
    const request = new NextRequest(
      "http://localhost/api/organizations/org-1/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({
          message: "x".repeat(4_001),
          history: [{ role: "system", content: "invalid" }],
        }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST({
      request,
      orgId,
      supabase: {},
      user: { id: "user-1" },
    } as Record<string, unknown>);

    expect(response.status).toBe(400);
    expect(mockProcessChatMessage).not.toHaveBeenCalled();
  });

  it("includes history when provided", async () => {
    mockProcessChatMessage.mockResolvedValue("Тийм ээ, олдлоо.");

    const request = new NextRequest(
      "http://localhost/api/organizations/org-1/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({
          message: "Захиалга хайх",
          history: [{ role: "user", content: "Сайн уу" }],
        }),
        headers: { "content-type": "application/json" },
      },
    );

    await POST({
      request,
      orgId,
      supabase: {},
      user: { id: "user-1" },
    } as Record<string, unknown>);

    expect(mockProcessChatMessage).toHaveBeenCalledWith(
      {},
      orgId,
      expect.objectContaining({
        history: expect.arrayContaining([
          expect.objectContaining({ role: "user", content: "Сайн уу" }),
        ]),
      }),
    );
  });
});
