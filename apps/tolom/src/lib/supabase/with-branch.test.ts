import { describe, expect, it, vi } from "vitest";
import { withBranchFilter, resolveBranchId } from "./with-branch";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

describe("withBranchFilter", () => {
  it("applies eq filter when branchId is provided", () => {
    const eq = vi.fn().mockReturnValue("filtered-query");
    const result = withBranchFilter({ eq } as any, "branch-1");
    expect(eq).toHaveBeenCalledWith("branch_id", "branch-1");
    expect(result).toBe("filtered-query");
  });

  it("returns query unchanged when branchId is null", () => {
    const eq = vi.fn();
    const query = { eq };
    const result = withBranchFilter(query, null);
    expect(eq).not.toHaveBeenCalled();
    expect(result).toBe(query);
  });

  it("returns query unchanged when branchId is 'all'", () => {
    const eq = vi.fn();
    const query = { eq };
    const result = withBranchFilter(query, "all");
    expect(eq).not.toHaveBeenCalled();
    expect(result).toBe(query);
  });
});

describe("resolveBranchId", () => {
  it("returns the branchId when provided and not 'all'", async () => {
    const mockSupabase = createMockSupabaseClient();

    const result = await resolveBranchId(
      mockSupabase as any,
      "org-1",
      "branch-42",
    );
    expect(result).toBe("branch-42");
  });

  it("queries main branch when branchId is null and found", async () => {
    const mockSupabase = createMockSupabaseClient();
    // The chain: from("branches") -> select("id") -> eq -> eq -> maybeSingle()
    mockSupabase.from("branches").maybeSingle.mockResolvedValueOnce({
      data: { id: "main-branch-1" },
      error: null,
    });

    const result = await resolveBranchId(mockSupabase as any, "org-1", null);
    expect(result).toBe("main-branch-1");
    expect(mockSupabase.from).toHaveBeenCalledWith("branches");
  });

  it("queries main branch when branchId is 'all' and found", async () => {
    const mockSupabase = createMockSupabaseClient();
    mockSupabase.from("branches").maybeSingle.mockResolvedValueOnce({
      data: { id: "main-branch-1" },
      error: null,
    });

    const result = await resolveBranchId(mockSupabase as any, "org-1", "all");
    expect(result).toBe("main-branch-1");
  });

  it("throws ValidationError when no main branch found (strict mode)", async () => {
    const mockSupabase = createMockSupabaseClient();
    mockSupabase.from("branches").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      resolveBranchId(mockSupabase as any, "org-1", null),
    ).rejects.toThrow("No main branch found");
  });

  it("returns null when no main branch found in non-strict mode", async () => {
    const mockSupabase = createMockSupabaseClient();
    mockSupabase.from("branches").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await resolveBranchId(
      mockSupabase as any,
      "org-1",
      null,
      { strict: false },
    );
    expect(result).toBeNull();
  });
});
