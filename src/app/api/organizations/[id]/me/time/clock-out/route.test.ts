import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/services/time-tracking-service", () => ({
  clockOut: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  mutationRateLimiter: {
    check: vi.fn(),
  },
}));

const { POST } = await import("./route");
const { clockOut } = await import("@/lib/services/time-tracking-service");
const { mutationRateLimiter } = await import("@/lib/rate-limit");

const ORG_ID = "org-test-1";
const USER_ID = "test-user-id";

function setupAuth(user: { id: string } | null = { id: USER_ID }) {
  const client = createMockSupabaseClient();
  client.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  });

  // Mock org membership check
  const qb = client.from("organization_users");
  qb.maybeSingle.mockResolvedValue(
    user
      ? { data: { organization_id: ORG_ID }, error: null }
      : { data: null, error: null },
  );

  vi.mocked(createClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof createClient>>,
  );

  return client;
}

function makeRequest() {
  return new NextRequest(
    `http://localhost:3000/api/organizations/${ORG_ID}/me/time/clock-out`,
    { method: "POST" },
  );
}

const context = { params: Promise.resolve({ id: ORG_ID }) };

describe("POST /api/organizations/[id]/me/time/clock-out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mutationRateLimiter.check).mockReturnValue({
      allowed: true,
      remaining: 59,
      resetAt: Date.now() + 60_000,
    });
  });

  it("returns 200 with time log on successful clock-out", async () => {
    setupAuth();
    const mockLog = {
      id: "log-1",
      organization_id: ORG_ID,
      mechanic_id: USER_ID,
      clock_in: "2025-06-09T10:00:00Z",
      clock_out: "2025-06-09T18:00:00Z",
      date: "2025-06-09",
      notes: null,
    };
    vi.mocked(clockOut).mockResolvedValue(mockLog);

    const response = await POST(makeRequest(), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(mockLog);
    expect(clockOut).toHaveBeenCalledWith(ORG_ID, USER_ID);
  });

  it("returns 429 when rate limited", async () => {
    setupAuth();
    vi.mocked(mutationRateLimiter.check).mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    });

    const response = await POST(makeRequest(), context);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(clockOut).not.toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    setupAuth(null);

    const response = await POST(makeRequest(), context);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 500 when clockOut throws (e.g. not clocked in)", async () => {
    setupAuth();
    vi.mocked(clockOut).mockRejectedValue(new Error("No open time log found"));

    const response = await POST(makeRequest(), context);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});
