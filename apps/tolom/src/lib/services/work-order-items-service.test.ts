import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";
import {
  updateWorkOrderPartPrice,
  updateWorkOrderServicePrice,
} from "./work-order-items-service";
import { recalculateWorkOrderTotals } from "./work-order-service";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
}));
vi.mock("./work-order-service", () => ({
  recalculateWorkOrderTotals: vi.fn(),
}));

describe("work-order item price updates", () => {
  let db: MockSupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
    db = createMockSupabaseClient();
  });

  it("persists service unit_price and recalculates final_price from quantity and discounts", async () => {
    db.__qb.resolveWith({
      data: {
        quantity: 3,
        discount_amount: 50,
        discount_percentage: 10,
      },
      error: null,
    });

    await updateWorkOrderServicePrice(
      db as unknown as SupabaseClient,
      "service-1",
      "wo-1",
      { unit_price: 200 },
      "org-1",
    );

    expect(db.from("work_order_services").update).toHaveBeenCalledWith({
      unit_price: 200,
      final_price: 490,
    });
    expect(recalculateWorkOrderTotals).toHaveBeenCalledWith(db, "wo-1");
  });

  it("derives service history unit_price from a final_price override", async () => {
    db.__qb.resolveWith({
      data: {
        quantity: 2,
        unit_price: 600,
        service_catalog_id: "svc-1",
        service_name: "Alignment",
        final_price: 1000,
      },
      error: null,
    });

    await updateWorkOrderServicePrice(
      db as unknown as SupabaseClient,
      "service-1",
      "wo-1",
      { final_price: 1000 },
      "org-1",
    );

    expect(db.from("service_price_history").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 2,
        unit_price: 500,
        final_price: 1000,
      }),
    );
  });

  it("persists part unit_price and recalculates final_price from quantity and discounts", async () => {
    db.__qb.resolveWith({
      data: {
        quantity: 4,
        discount_amount: 25,
        discount_percentage: 5,
      },
      error: null,
    });

    await updateWorkOrderPartPrice(
      db as unknown as SupabaseClient,
      "part-line-1",
      "wo-1",
      { unit_price: 125 },
      "org-1",
    );

    expect(db.from("work_order_parts").update).toHaveBeenCalledWith({
      unit_price: 125,
      final_price: 450,
    });
    expect(recalculateWorkOrderTotals).toHaveBeenCalledWith(db, "wo-1");
  });

  it("derives part history unit_price from a final_price override", async () => {
    db.__qb.resolveWith({
      data: {
        quantity: 2,
        unit_price: 600,
        part_name: "Oil Filter",
        part_number: "OF-1",
        final_price: 1000,
      },
      error: null,
    });

    await updateWorkOrderPartPrice(
      db as unknown as SupabaseClient,
      "part-line-1",
      "wo-1",
      { final_price: 1000 },
      "org-1",
    );

    expect(db.from("part_price_history").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 2,
        unit_price: 500,
        final_price: 1000,
      }),
    );
  });
});
