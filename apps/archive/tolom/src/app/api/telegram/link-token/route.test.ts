import { NotFoundError } from "@zuiio/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code, message } }), { status }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("POST /api/telegram/link-token", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns link token and code on successful gateway calls", async () => {
    const fetchMock = vi
      .fn()
      // generate endpoint
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            token: "gt-secret-abc",
            expiresInMinutes: 15,
            telegramUrl: "https://t.me/tolom_bot?start=abc123",
          }),
      })
      // code endpoint
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            formatted: "ABC-123-XYZ",
            expiresInMinutes: 5,
          }),
      });
    global.fetch = fetchMock;

    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { organization_id: "org-1" },
                error: null,
              }),
            })),
          })),
        })),
      })),
    };

    const response = await (POST as any)({ user, supabase });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      token: "gt-secret-abc",
      expires_in_minutes: 15,
      bot_deep_link: "https://t.me/tolom_bot?start=abc123",
      link_code: "ABC-123-XYZ",
      link_code_expires_in_minutes: 5,
    });

    // Verify fetch calls
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/link/generate"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("org-1"),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/link/code"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("org-1"),
      }),
    );
  });

  it("returns link token with null link_code when code endpoint fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            token: "gt-secret-abc",
            expiresInMinutes: 15,
            telegramUrl: "https://t.me/tolom_bot?start=abc123",
          }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Code generation failed" }),
      });
    global.fetch = fetchMock;

    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { organization_id: "org-1" },
                error: null,
              }),
            })),
          })),
        })),
      })),
    };

    const response = await (POST as any)({ user, supabase });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.token).toBe("gt-secret-abc");
    expect(body.data.link_code).toBeNull();
    expect(body.data.link_code_expires_in_minutes).toBeNull();
  });

  it("throws NotFoundError when user has no org membership", async () => {
    global.fetch = vi.fn();

    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            })),
          })),
        })),
      })),
    };

    await expect((POST as any)({ user, supabase })).rejects.toThrow(
      NotFoundError,
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns GATEWAY_ERROR when generate endpoint fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Gateway timeout" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ formatted: "ABC-123", expiresInMinutes: 5 }),
      });
    global.fetch = fetchMock;

    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { organization_id: "org-1" },
                error: null,
              }),
            })),
          })),
        })),
      })),
    };

    const response = await (POST as any)({ user, supabase });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("GATEWAY_ERROR");
    expect(body.error.message).toBe("Gateway timeout");
  });

  it("returns GATEWAY_ERROR when generate fetch throws", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network failure"))
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ formatted: "ABC-123", expiresInMinutes: 5 }),
      });
    global.fetch = fetchMock;

    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { organization_id: "org-1" },
                error: null,
              }),
            })),
          })),
        })),
      })),
    };

    const response = await (POST as any)({ user, supabase });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("GATEWAY_ERROR");
    expect(body.error.message).toBe("Network failure");
  });
});
