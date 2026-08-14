import { HydrationBoundary, type QueryClient } from "@tanstack/react-query";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDashboardData } from "@/lib/services/report-service";
import { createClient } from "@/lib/supabase/server";
import type { DashboardData } from "@/lib/types";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";
import { dashboardKeys, profileKeys } from "../keys";
import { PrefetchDashboard } from "../prefetch-dashboard";

const { mockDehydrate, capturedClientHolder } = vi.hoisted(() => ({
  mockDehydrate: vi.fn(),
  capturedClientHolder: { client: undefined as QueryClient | undefined },
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, dehydrate: mockDehydrate };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/services/report-service", () => ({
  getDashboardData: vi.fn(),
}));

// ── Fixtures ──────────────────────────────────────────────────

const profileRow = {
  id: "user-1",
  organization_id: null,
  branch_id: null,
  full_name: "Org Owner",
  username: "owner",
  phone: "+97699112233",
  avatar_url: null,
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const membershipRow = {
  organization_id: "org-1",
  role_id: null,
  branch_id: null,
  roles: null,
};

const subscriptionRow = {
  id: "sub-1",
  organization_id: "org-1",
  plan_type: "pro",
  status: "active",
  started_at: "2025-01-01T00:00:00Z",
  expires_at: "2026-01-01T00:00:00Z",
  grace_period_end: null,
  settings: { trial: false },
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const featureFlags = [
  { id: "ff-1", flag_key: "billing", enabled: true, description: null },
];

const dashboardData = {
  summary: { totalRevenue: 100 },
} as unknown as DashboardData;

// ── Helpers ───────────────────────────────────────────────────

let createClientMock: MockSupabaseClient;

function getQb() {
  const qb = createClientMock.from("profiles");
  return qb as unknown as { maybeSingle: Mock };
}

function seedProfileWithOrg() {
  const qb = getQb();
  qb.maybeSingle
    .mockResolvedValueOnce({ data: profileRow, error: null })
    .mockResolvedValueOnce({ data: membershipRow, error: null })
    .mockResolvedValueOnce({ data: { name: "Org One" }, error: null })
    .mockResolvedValueOnce({ data: subscriptionRow, error: null });
  createClientMock.__qb.resolveWith({ data: featureFlags, error: null });
}

beforeEach(() => {
  createClientMock = createMockSupabaseClient();
  vi.mocked(createClient).mockResolvedValue(createClientMock);
  capturedClientHolder.client = undefined;
  mockDehydrate.mockClear();
  mockDehydrate.mockImplementation((queryClient: QueryClient) => {
    capturedClientHolder.client = queryClient;
    return { mutations: [], queries: [] };
  });
  vi.mocked(getDashboardData).mockResolvedValue(dashboardData);
});

describe("PrefetchDashboard", () => {
  it("renders children without hydrating when there is no profile", async () => {
    createClientMock.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "unauthenticated" },
    });
    const children = <span>hello world</span>;

    const element = await PrefetchDashboard({ children });

    expect(createClient).toHaveBeenCalled();
    expect(element.type).toBe(HydrationBoundary);
    expect(element.props.children).toBe(children);
    expect(
      capturedClientHolder.client?.getQueryData(profileKeys.current()),
    ).toBeUndefined();
    expect(getDashboardData).not.toHaveBeenCalled();
  });

  it("hydrates only the profile when the profile has no organization", async () => {
    const qb = getQb();
    qb.maybeSingle
      .mockResolvedValueOnce({ data: profileRow, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    await PrefetchDashboard({ children: <span>hello world</span> });

    const profile = capturedClientHolder.client?.getQueryData(
      profileKeys.current(),
    );
    expect(profile).toEqual({
      id: "test-user-id",
      email: "",
      username: "owner",
      phone: "+97699112233",
      fullName: "Org Owner",
      avatarUrl: null,
      organizationId: null,
      organizationName: null,
      branchId: null,
      roleId: null,
      roleName: null,
      permissionNames: [],
    });
    expect(getDashboardData).not.toHaveBeenCalled();
  });

  it("prefetches subscription, feature flags and dashboard data for a profile with orgId", async () => {
    seedProfileWithOrg();

    await PrefetchDashboard({ children: <span>hello world</span> });

    expect(
      capturedClientHolder.client?.getQueryData(profileKeys.current()),
    ).toMatchObject({ organizationId: "org-1", fullName: "Org Owner" });

    expect(
      capturedClientHolder.client?.getQueryData([
        "org",
        "org-1",
        "subscription",
      ]),
    ).toEqual({
      id: "sub-1",
      organizationId: "org-1",
      planType: "pro",
      status: "active",
      startedAt: "2025-01-01T00:00:00Z",
      expiresAt: "2026-01-01T00:00:00Z",
      gracePeriodEnd: null,
      trial: false,
    });

    expect(
      capturedClientHolder.client?.getQueryData(["org", "org-1", "features"]),
    ).toEqual(featureFlags);

    expect(
      capturedClientHolder.client?.getQueryData(
        dashboardKeys.summary("org-1", "month"),
      ),
    ).toEqual(dashboardData);

    expect(getDashboardData).toHaveBeenCalledWith(
      createClientMock,
      "org-1",
      "month",
    );
  });

  it("defaults feature flags to an empty array when the query errors", async () => {
    seedProfileWithOrg();
    createClientMock.__qb.resolveWith({
      data: null,
      error: { message: "permission denied" },
    });

    await PrefetchDashboard({ children: <span>hello world</span> });

    expect(
      capturedClientHolder.client?.getQueryData(["org", "org-1", "features"]),
    ).toEqual([]);
  });

  it("still renders children when the dashboard fetch fails", async () => {
    seedProfileWithOrg();
    vi.mocked(getDashboardData).mockRejectedValue(new Error("rpc failed"));

    const element = await PrefetchDashboard({ children: <span>hello</span> });

    expect(element.type).toBe(HydrationBoundary);
    expect(
      capturedClientHolder.client?.getQueryData(
        dashboardKeys.summary("org-1", "month"),
      ),
    ).toBeUndefined();
    expect(
      capturedClientHolder.client?.getQueryData([
        "org",
        "org-1",
        "subscription",
      ]),
    ).toBeDefined();
  });
});
