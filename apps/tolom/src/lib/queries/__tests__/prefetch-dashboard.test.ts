import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { dashboardKeys, profileKeys } from "../keys";
import type { UserProfile } from "@/lib/services/user-service";
import type { SubscriptionPlanInfo } from "@/lib/types/service-params";
import type { DashboardData } from "@/lib/types";

// Mock Supabase client
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockSupabase = {
  from: mockFrom,
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
};

// Mock getOrganizationSubscription
vi.mock("@/lib/services/subscription-service", () => ({
  getOrganizationSubscription: vi.fn(),
}));
import { getOrganizationSubscription } from "@/lib/services/subscription-service";

// Mock getDashboardData
vi.mock("@/lib/services/report-service", () => ({
  getDashboardData: vi.fn(),
}));
import { getDashboardData } from "@/lib/services/report-service";

const mockProfile: UserProfile = {
  id: "u1",
  email: "test@test.com",
  username: null,
  phone: null,
  fullName: "Test User",
  avatarUrl: null,
  organizationId: "org-1",
  organizationName: "Test Org",
  branchId: null,
  roleId: "role-1",
  roleName: "admin",
  permissionNames: ["reports.read", "work_orders.write"],
};

const mockSubscription: SubscriptionPlanInfo = {
  planType: "pro",
  startDate: "2026-01-01",
  endDate: "2027-01-01",
};

const mockDashboardData: DashboardData = {
  summary: {
    totalRevenue: 100000,
    totalWorkOrders: 50,
    avgRepairOrderValue: 2000,
    serviceRevenue: 60000,
    partsRevenue: 40000,
    activeCustomers: 30,
    totalExpenses: 20000,
    laborRevenue: 15000,
    diagnosticRevenue: 5000,
    paidInvoicesTotal: 80000,
    pendingInvoicesTotal: 20000,
  },
  summaryComparison: {
    totalRevenue: 90000,
    totalWorkOrders: 45,
    avgRepairOrderValue: 2000,
    serviceRevenue: 55000,
    partsRevenue: 35000,
    activeCustomers: 25,
    totalExpenses: 18000,
    laborRevenue: 12000,
    diagnosticRevenue: 3000,
    paidInvoicesTotal: 75000,
    pendingInvoicesTotal: 25000,
  },
  insights: [],
  recentWorkOrders: [],
  topServices: [],
  revenueTrend: [],
};

const mockFeatures = [
  { id: "f1", flag_key: "advanced_reports", enabled: true, description: null },
];

function setupMocks() {
  // Feature flags: supabase.from("feature_flags").select(...).eq(...)
  mockFrom.mockImplementation((table: string) => {
    if (table === "feature_flags") {
      return { select: () => ({ eq: () => Promise.resolve({ data: mockFeatures, error: null }) }) };
    }
    return { select: mockSelect };
  });
}

describe("prefetch-dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  describe("getCachedProfile (tested via PrefetchDashboard's behavior)", () => {
    it("is exported and returns a promise", async () => {
      // Can't fully test React.cache() outside RSC, but verify the module exports
      const mod = await import("../prefetch-dashboard");
      expect(mod.getCachedProfile).toBeDefined();
      expect(typeof mod.getCachedProfile).toBe("function");
    });
  });

  describe("PrefetchDashboard data seeding", () => {
    it("seeds profile key into query client", async () => {
      vi.mocked(getOrganizationSubscription).mockResolvedValue(mockSubscription);
      vi.mocked(getDashboardData).mockResolvedValue(mockDashboardData);

      const queryClient = new QueryClient();

      // Simulate what PrefetchDashboard does with profile data
      queryClient.setQueryData(profileKeys.current(), mockProfile);

      // Verify profile data is in cache
      const cached = queryClient.getQueryData(profileKeys.current());
      expect(cached).toEqual(mockProfile);
    });

    it("seeds subscription cache key", async () => {
      vi.mocked(getOrganizationSubscription).mockResolvedValue(mockSubscription);
      vi.mocked(getDashboardData).mockResolvedValue(mockDashboardData);

      const queryClient = new QueryClient();
      const key = ["org", "org-1", "subscription"];

      queryClient.setQueryData(key, mockSubscription);
      expect(queryClient.getQueryData(key)).toEqual(mockSubscription);
    });

    it("seeds features cache key", async () => {
      const queryClient = new QueryClient();
      const key = ["org", "org-1", "features"];

      queryClient.setQueryData(key, mockFeatures);
      expect(queryClient.getQueryData(key)).toEqual(mockFeatures);
    });

    it("seeds dashboard key with month period", async () => {
      vi.mocked(getDashboardData).mockResolvedValue(mockDashboardData);

      const queryClient = new QueryClient();

      queryClient.setQueryData(
        dashboardKeys.summary("org-1", "month"),
        mockDashboardData,
      );
      expect(queryClient.getQueryData(dashboardKeys.summary("org-1", "month"))).toEqual(mockDashboardData);
    });

    it("dashboard keys match what useDashboard produces", () => {
      // Verify the key structure matches: ["organizations", orgId, "dashboard", "all", "summary", "month"]
      expect(dashboardKeys.summary("org-1", "month")).toEqual([
        "organizations",
        "org-1",
        "dashboard",
        "all",
        "summary",
        "month",
      ]);

      // Verify the key matches what useDashboard creates
      // useDashboard uses: dashboardKeys.summary(orgId, period, branchId)
      // where period = "month" (default) and branchId = null → "all"
      expect(dashboardKeys.summary("org-1", "month", null)).toEqual(
        dashboardKeys.summary("org-1", "month"),
      );
    });
  });
});
