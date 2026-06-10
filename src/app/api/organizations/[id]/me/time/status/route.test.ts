import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/services/time-tracking-service", () => ({
  getClockStatus: vi.fn(),
}));

const { GET } = await import("./route");
const { getClockStatus } = await import("@/lib/services/time-tracking-service");

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
    `http://localhost:3000/api/organizations/${ORG_ID}/me/time/status`,
  );
}

const context = { params: Promise.resolve({ id: ORG_ID }) };

describe("GET /api/organizations/[id]/me/time/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns clocked-in status with hours", async () => {
    setupAuth();
    vi.mocked(getClockStatus).mockResolvedValue({
      clockedIn: true,
      since: "2025-06-09T10:00:00Z",
      todayHours: 4.5,
    });

    const response = await GET(makeRequest(), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      clockedIn: true,
      since: "2025-06-09T10:00:00Z",
      todayHours: 4.5,
    });
    expect(getClockStatus).toHaveBeenCalledWith(ORG_ID, USER_ID);
  });

  it("returns clocked-out status", async () => {
    setupAuth();
    vi.mocked(getClockStatus).mockResolvedValue({
      clockedIn: false,
      since: null,
      todayHours: 8,
    });

    const response = await GET(makeRequest(), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      clockedIn: false,
      since: null,
      todayHours: 8,
    });
  });

  it("returns 401 when not authenticated", async () => {
    setupAuth(null);

    const response = await GET(makeRequest(), context);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
