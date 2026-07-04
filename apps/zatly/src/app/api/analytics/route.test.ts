import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "./route";

// Mock the dependencies
vi.mock("@/lib/apiAuth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseRestContext: vi.fn(),
}));

import { requireAuth } from "@/lib/apiAuth";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";

function createRequest(searchParams?: string): NextRequest {
  const url = searchParams
    ? `http://localhost:3001/api/analytics?${searchParams}`
    : "http://localhost:3001/api/analytics";
  return new NextRequest(url);
}

const mockContext = {
  baseUrl: "https://test-project.supabase.co/rest/v1",
  headers: {
    apikey: "test-key",
    Authorization: "Bearer test-key",
    "Content-Type": "application/json",
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSupabaseRestContext).mockReturnValue(mockContext);
  vi.mocked(requireAuth).mockResolvedValue(null);
  vi.stubGlobal("fetch", vi.fn());
});

describe("GET /api/analytics", () => {
  it("returns 200 with automations array and totals", async () => {
    // Mock automations response
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();

      if (urlStr.includes("/automations")) {
        return new Response(
          JSON.stringify([
            { id: "auto-1", name: "Automation 1" },
            { id: "auto-2", name: "Automation 2" },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/message_logs")) {
        return new Response(
          JSON.stringify([
            { automation_id: "auto-1", status: "sent" },
            { automation_id: "auto-1", status: "sent" },
            { automation_id: "auto-1", status: "delivered" },
            { automation_id: "auto-1", status: "delivered" },
            { automation_id: "auto-1", status: "opened" },
            { automation_id: "auto-1", status: "opened" },
            { automation_id: "auto-1", status: "clicked" },
            { automation_id: "auto-2", status: "sent" },
            { automation_id: "auto-2", status: "delivered" },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not found", { status: 404 });
    });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty("automations");
    expect(body).toHaveProperty("totals");
    expect(Array.isArray(body.automations)).toBe(true);
    expect(body.automations).toHaveLength(2);
    expect(body.totals).toEqual({
      sent: 3,
      delivered: 3,
      opened: 2,
      clicked: 1,
    });
  });

  it("returns per-automation counts and nullable rates", async () => {
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();

      if (urlStr.includes("/automations")) {
        return new Response(
          JSON.stringify([
            { id: "auto-1", name: "Automation 1" },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/message_logs")) {
        return new Response(
          JSON.stringify([
            { automation_id: "auto-1", status: "sent" },
            { automation_id: "auto-1", status: "sent" },
            { automation_id: "auto-1", status: "sent" },
            { automation_id: "auto-1", status: "sent" },
            { automation_id: "auto-1", status: "sent" },
            { automation_id: "auto-1", status: "delivered" },
            { automation_id: "auto-1", status: "delivered" },
            { automation_id: "auto-1", status: "delivered" },
            { automation_id: "auto-1", status: "delivered" },
            { automation_id: "auto-1", status: "opened" },
            { automation_id: "auto-1", status: "opened" },
            { automation_id: "auto-1", status: "opened" },
            { automation_id: "auto-1", status: "clicked" },
            { automation_id: "auto-1", status: "clicked" },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not found", { status: 404 });
    });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    const auto = body.automations[0];
    expect(auto).toHaveProperty("id", "auto-1");
    expect(auto).toHaveProperty("name", "Automation 1");
    expect(auto).toHaveProperty("sent");
    expect(auto).toHaveProperty("delivered");
    expect(auto).toHaveProperty("opened");
    expect(auto).toHaveProperty("clicked");
    expect(auto).toHaveProperty("deliveryRate");
    expect(auto).toHaveProperty("openRate");
    expect(auto).toHaveProperty("clickRate");
  });

  it("calculates rates correctly (deliveryRate = delivered/sent, null when denom=0)", async () => {
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();

      if (urlStr.includes("/automations")) {
        return new Response(
          JSON.stringify([
            { id: "auto-1", name: "With Data" },
            { id: "auto-2", name: "No Data" },
            { id: "auto-3", name: "Zero Sent" },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/message_logs")) {
        return new Response(
          JSON.stringify([
            // auto-1: sent=5, delivered=4, opened=3, clicked=1
            { automation_id: "auto-1", status: "sent" },
            { automation_id: "auto-1", status: "sent" },
            { automation_id: "auto-1", status: "sent" },
            { automation_id: "auto-1", status: "sent" },
            { automation_id: "auto-1", status: "sent" },
            { automation_id: "auto-1", status: "delivered" },
            { automation_id: "auto-1", status: "delivered" },
            { automation_id: "auto-1", status: "delivered" },
            { automation_id: "auto-1", status: "delivered" },
            { automation_id: "auto-1", status: "opened" },
            { automation_id: "auto-1", status: "opened" },
            { automation_id: "auto-1", status: "opened" },
            { automation_id: "auto-1", status: "clicked" },
            // auto-3: has records but non-sent/delivered/opened/clicked statuses? No, auto-3 simply has no records.
            // The non-auto records (null automation_id) are filterable. But we need to test zero-sent scenario.
            // Let's adjust: auto-3 has no records in message_logs at all (zero sent).
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not found", { status: 404 });
    });

    const response = await GET(createRequest());
    const body = await response.json();

    const auto1 = body.automations.find((a: { id: string }) => a.id === "auto-1");
    expect(auto1).toBeDefined();
    expect(auto1.sent).toBe(5);
    expect(auto1.delivered).toBe(4);
    expect(auto1.opened).toBe(3);
    expect(auto1.clicked).toBe(1);
    // deliveryRate = 4/5 = 0.8
    expect(auto1.deliveryRate).toBeCloseTo(0.8, 2);
    // openRate = 3/4 = 0.75
    expect(auto1.openRate).toBeCloseTo(0.75, 2);
    // clickRate = 1/3 ≈ 0.33
    expect(auto1.clickRate).toBeCloseTo(0.33, 2);

    const auto3 = body.automations.find((a: { id: string }) => a.id === "auto-3");
    expect(auto3).toBeDefined();
    expect(auto3.sent).toBe(0);
    expect(auto3.delivered).toBe(0);
    expect(auto3.opened).toBe(0);
    expect(auto3.clicked).toBe(0);
    expect(auto3.deliveryRate).toBeNull();
    expect(auto3.openRate).toBeNull();
    expect(auto3.clickRate).toBeNull();
  });

  it("returns 401 without authentication", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await GET(createRequest());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns empty automations array and zero totals when DB is empty", async () => {
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();

      if (urlStr.includes("/automations")) {
        return new Response(
          JSON.stringify([]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/message_logs")) {
        return new Response(
          JSON.stringify([]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not found", { status: 404 });
    });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.automations).toEqual([]);
    expect(body.totals).toEqual({ sent: 0, delivered: 0, opened: 0, clicked: 0 });
  });

  it("passes period=7d filter to message_logs query", async () => {
    let messageLogsUrl = "";
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();

      if (urlStr.includes("/automations")) {
        return new Response(
          JSON.stringify([{ id: "auto-1", name: "Test" }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/message_logs")) {
        messageLogsUrl = urlStr;
        return new Response(
          JSON.stringify([]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not found", { status: 404 });
    });

    await GET(createRequest("period=7d"));

    expect(messageLogsUrl).toContain("sent_at=gte.");
  });

  it("passes period=30d filter to message_logs query", async () => {
    let messageLogsUrl = "";
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();

      if (urlStr.includes("/automations")) {
        return new Response(
          JSON.stringify([{ id: "auto-1", name: "Test" }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/message_logs")) {
        messageLogsUrl = urlStr;
        return new Response(
          JSON.stringify([]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not found", { status: 404 });
    });

    await GET(createRequest("period=30d"));

    expect(messageLogsUrl).toContain("sent_at=gte.");
  });

  it("omits period filter when period=all", async () => {
    let messageLogsUrl = "";
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();

      if (urlStr.includes("/automations")) {
        return new Response(
          JSON.stringify([{ id: "auto-1", name: "Test" }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/message_logs")) {
        messageLogsUrl = urlStr;
        return new Response(
          JSON.stringify([]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not found", { status: 404 });
    });

    await GET(createRequest("period=all"));

    expect(messageLogsUrl).not.toContain("sent_at=");
  });

  it("omits period filter when no period param", async () => {
    let messageLogsUrl = "";
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();

      if (urlStr.includes("/automations")) {
        return new Response(
          JSON.stringify([{ id: "auto-1", name: "Test" }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/message_logs")) {
        messageLogsUrl = urlStr;
        return new Response(
          JSON.stringify([]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not found", { status: 404 });
    });

    await GET(createRequest());

    expect(messageLogsUrl).not.toContain("sent_at=");
  });
});
