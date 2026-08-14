import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/services/qr-token-service", () => ({
  verifyAndClaimClockToken: vi.fn(),
}));

const { POST } = await import("./route");
const { verifyAndClaimClockToken } = await import(
  "@/lib/services/qr-token-service"
);

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

function makeRequest(body?: Record<string, unknown>) {
  return new NextRequest(
    `http://localhost:3000/api/organizations/${ORG_ID}/clock/verify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
}

const context = { params: Promise.resolve({ id: ORG_ID }) };

describe("POST /api/organizations/[id]/clock/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns direction info on successful verification", async () => {
    const client = setupAuth();
    vi.mocked(verifyAndClaimClockToken).mockResolvedValue({
      valid: true,
      actionType: "clock_in",
    });

    // Mock the profiles lookup done by the route after verification succeeds
    client.__qb.resolveWith({
      data: { full_name: "John Doe" },
      error: null,
    });

    const response = await POST(
      makeRequest({ rawToken: "valid-token" }),
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      direction: "in",
      actionType: "clock_in",
      mechanicName: "John Doe",
    });
    expect(verifyAndClaimClockToken).toHaveBeenCalledWith(
      client,
      "valid-token",
      USER_ID,
    );
  });

  it("returns apiError when rawToken is missing", async () => {
    setupAuth();

    const response = await POST(makeRequest({}), context);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(body.error.message).toBe("rawToken is required");
  });

  it("returns apiError when token is invalid", async () => {
    setupAuth();
    vi.mocked(verifyAndClaimClockToken).mockResolvedValue({
      valid: false,
      actionType: "clock_in",
      reason: "Token has expired",
    });

    const response = await POST(
      makeRequest({ rawToken: "expired-token" }),
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_TOKEN");
    expect(body.error.message).toBe("Token has expired");
  });

  it("returns 500 when service throws", async () => {
    setupAuth();
    vi.mocked(verifyAndClaimClockToken).mockRejectedValue(
      new Error("DB connection failed"),
    );

    const response = await POST(
      makeRequest({ rawToken: "some-token" }),
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});
