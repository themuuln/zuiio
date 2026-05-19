import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  getCompletionData,
  getRecommendations,
  getWorkOrderServicesWithIntervals,
} from "./post-service-service";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  vi.clearAllMocks();
  (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);
});

describe("getWorkOrderServicesWithIntervals", () => {
  function mockServicesResult(data: unknown[]) {
    const builder = mockClient.from("work_order_services");
    builder.order.mockReturnThis();
    builder.select.mockReturnThis();
    builder.eq.mockReturnThis();
    // Make the chain then-able so await works
    Object.defineProperty(builder, "then", {
      value: vi.fn((resolve: (v: unknown) => unknown) =>
        resolve({ data, error: null }),
      ),
      writable: true,
    });
    return builder;
  }

  it("returns services with catalog intervals joined", async () => {
    mockServicesResult([
      {
        id: "svc-1",
        service_name: "Oil Change",
        service_catalog_id: "cat-1",
        service_catalog: { interval_months: 6, interval_km: 10000 },
      },
      {
        id: "svc-2",
        service_name: "Brake Inspection",
        service_catalog_id: "cat-2",
        service_catalog: { interval_months: 12, interval_km: null },
      },
    ]);

    const result = await getWorkOrderServicesWithIntervals("wo-1");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "svc-1",
      service_name: "Oil Change",
      service_catalog_id: "cat-1",
      catalog_interval_months: 6,
      catalog_interval_km: 10000,
    });
    expect(result[1].catalog_interval_months).toBe(12);
    expect(result[1].catalog_interval_km).toBeNull();
  });

  it("returns empty array when no services", async () => {
    mockServicesResult([]);

    const result = await getWorkOrderServicesWithIntervals("wo-empty");
    expect(result).toEqual([]);
  });

  it("handles null catalog gracefully", async () => {
    mockServicesResult([
      {
        id: "svc-3",
        service_name: "Custom Job",
        service_catalog_id: null,
        service_catalog: null,
      },
    ]);

    const result = await getWorkOrderServicesWithIntervals("wo-3");
    expect(result[0].catalog_interval_months).toBeNull();
    expect(result[0].catalog_interval_km).toBeNull();
    expect(result[0].service_catalog_id).toBeNull();
  });
});

describe("getRecommendations", () => {
  function mockRecsResult(data: unknown[]) {
    const builder = mockClient.from("service_recommendations");
    builder.order.mockReturnThis();
    builder.select.mockReturnThis();
    builder.eq.mockReturnThis();
    builder.is.mockReturnThis();
    Object.defineProperty(builder, "then", {
      value: vi.fn((resolve: (v: unknown) => unknown) =>
        resolve({ data, error: null }),
      ),
      writable: true,
    });
    return builder;
  }

  it("returns recommendations sorted by priority", async () => {
    const builder = mockRecsResult([
      {
        id: "rec-1",
        organization_id: "org-1",
        work_order_id: "wo-1",
        work_order_service_id: "svc-1",
        service_name: "Oil Change",
        priority: "important",
        recommended_interval_months: 6,
        recommended_interval_km: 10000,
        next_due_date: "2026-11-18",
        next_due_km: 95000,
        notes: "Use synthetic",
        deleted_at: null,
      },
    ]);

    const result = await getRecommendations("wo-1");

    expect(result).toHaveLength(1);
    expect(result[0].service_name).toBe("Oil Change");
    expect(result[0].priority).toBe("important");
    expect(result[0].next_due_date).toBe("2026-11-18");
    expect(result[0].next_due_km).toBe(95000);
  });

  it("excludes soft-deleted recommendations", async () => {
    const builder = mockRecsResult([]);

    await getRecommendations("wo-1");

    expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
  });
});

describe("getCompletionData", () => {
  function mockCompletionResult(data: unknown) {
    const builder = mockClient.from("service_completion_data");
    builder.select.mockReturnThis();
    builder.eq.mockReturnThis();
    builder.single.mockResolvedValue({ data, error: null });
    return builder;
  }

  it("returns completion data for a work order", async () => {
    mockCompletionResult({
      id: "comp-1",
      work_order_id: "wo-1",
      odometer_reading: 85000,
      customer_satisfaction: 5,
      customer_feedback: "Great service!",
    });

    const result = await getCompletionData("wo-1");
    expect(result).not.toBeNull();
    expect(result?.odometer_reading).toBe(85000);
    expect(result?.customer_satisfaction).toBe(5);
  });

  it("returns null when no completion data exists (PGRST116)", async () => {
    const builder = mockClient.from("service_completion_data");
    builder.select.mockReturnThis();
    builder.eq.mockReturnThis();
    builder.single.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "No rows found", details: "", hint: "" },
    });

    const result = await getCompletionData("wo-404");
    expect(result).toBeNull();
  });
});
