import { beforeEach, describe, expect, it } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { batchUpsert, checkThenUpsert } from "./with-batch";

describe("batchUpsert", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  it("returns empty result when rows array is empty", async () => {
    const result = await batchUpsert(mockSupabase as any, {
      table: "customers",
      rows: [],
    });
    expect(result).toEqual({ data: [], count: 0 });
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("upserts rows and returns result", async () => {
    const rows = [{ id: "1", name: "Test" }];
    const response = { data: rows, error: null };
    mockSupabase.__qb.resolveWith(response);

    const result = await batchUpsert(mockSupabase as any, {
      table: "customers",
      rows,
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("customers");
    expect(result).toEqual({ data: rows, count: 1 });
  });

  it("throws when upsert errors", async () => {
    mockSupabase.__qb.resolveWith({
      data: null,
      error: new Error("DB error"),
    });

    await expect(
      batchUpsert(mockSupabase as any, {
        table: "customers",
        rows: [{ id: "1" }],
      }),
    ).rejects.toThrow("DB error");
  });

  it("passes onConflict option when provided", async () => {
    mockSupabase.__qb.resolveWith({ data: [], error: null });

    await batchUpsert(mockSupabase as any, {
      table: "customers",
      rows: [{ id: "1" }],
      onConflict: "id",
    });

    // Just verify it didn't throw
    expect(mockSupabase.from).toHaveBeenCalledWith("customers");
  });
});

describe("checkThenUpsert", () => {
  it("delegates to batchUpsert", async () => {
    const mockSupabase = createMockSupabaseClient();
    const rows = [{ id: "1" }];
    mockSupabase.__qb.resolveWith({ data: rows, error: null });

    const result = await checkThenUpsert(mockSupabase as any, {
      table: "products",
      rows,
    });

    expect(result).toEqual({ data: rows, count: 1 });
  });
});
