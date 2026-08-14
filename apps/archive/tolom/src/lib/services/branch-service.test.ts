import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  createBranch,
  deleteBranch,
  getBranches,
  updateBranch,
} from "./branch-service";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key: unknown, fn: () => unknown) => fn()),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
  logAuditAfter: vi.fn(),
}));

function makeBuilder<T = unknown>(data?: T) {
  const resolved = { data: data ?? null, error: null };
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolved),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
    then: vi.fn((resolve: (v: typeof resolved) => void) => resolve(resolved)),
  };
}

let mockClient: ReturnType<typeof createMockSupabaseClient>;

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createMockSupabaseClient();
  vi.mocked(createClient).mockResolvedValue(
    mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
  );
});

describe("createBranch", () => {
  it("creates with valid name", async () => {
    // Org query for branch_limit
    const orgBuilder = makeBuilder({ branch_limit: 5 });
    // Branch count query — use same builder for both count and crud
    const branchesBuilder = makeBuilder({ id: "b-1", name: "Branch 2" });
    branchesBuilder.then = vi.fn((resolve: (v: unknown) => void) =>
      resolve({ data: [], count: 1, error: null }),
    );
    const tableMocks: Record<string, unknown> = {
      organizations: orgBuilder,
      branches: branchesBuilder,
    };
    mockClient.from = vi.fn(
      (table: string) => tableMocks[table] ?? makeBuilder(),
    );
    const result = await createBranch(mockClient as any, "org-1", {
      name: "Branch 2",
    });
    expect(result.id).toBe("b-1");
    expect(revalidateTag).toHaveBeenCalled();
  });

  it("rejects empty name", async () => {
    const orgBuilder = makeBuilder({ branch_limit: 5 });
    const branchesBuilder = makeBuilder([]);
    branchesBuilder.then = vi.fn((resolve: (v: unknown) => void) =>
      resolve({ data: [], count: 0, error: null }),
    );
    const tableMocks: Record<string, unknown> = {
      organizations: orgBuilder,
      branches: branchesBuilder,
    };
    mockClient.from = vi.fn(
      (table: string) => tableMocks[table] ?? makeBuilder(),
    );
    await expect(
      createBranch(mockClient as any, "org-1", { name: "" }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects when branch_limit reached", async () => {
    const orgBuilder = makeBuilder({ branch_limit: 2 });
    const branchesBuilder = makeBuilder([]);
    branchesBuilder.then = vi.fn((resolve: (v: unknown) => void) =>
      resolve({ data: [], count: 2, error: null }),
    );
    const tableMocks: Record<string, unknown> = {
      organizations: orgBuilder,
      branches: branchesBuilder,
    };
    mockClient.from = vi.fn(
      (table: string) => tableMocks[table] ?? makeBuilder(),
    );
    await expect(
      createBranch(mockClient as any, "org-1", { name: "Branch 3" }),
    ).rejects.toThrow("Branch limit reached");
  });
});

describe("getBranches", () => {
  it("returns filtered branches", async () => {
    const builder = makeBuilder([{ id: "b-1", name: "Main" }]);
    builder.then = vi.fn((resolve: (v: unknown) => void) =>
      resolve({ data: [{ id: "b-1", name: "Main" }], error: null }),
    );
    mockClient.from = vi.fn().mockReturnValue(builder);
    const result = await getBranches(mockClient as any, "org-1");
    expect(result).toHaveLength(1);
  });

  it("returns empty array", async () => {
    const builder = makeBuilder([]);
    builder.then = vi.fn((resolve: (v: unknown) => void) =>
      resolve({ data: [], error: null }),
    );
    mockClient.from = vi.fn().mockReturnValue(builder);
    expect(await getBranches(mockClient as any, "org-1")).toEqual([]);
  });
});

describe("updateBranch", () => {
  it("updates and revalidates", async () => {
    mockClient.from = vi
      .fn()
      .mockReturnValue(makeBuilder({ id: "b-1", name: "Updated" }));
    const result = await updateBranch(mockClient as any, "b-1", "org-1", {
      name: "Updated",
    });
    expect(result.name).toBe("Updated");
    expect(revalidateTag).toHaveBeenCalled();
  });

  it("throws NotFoundError on missing branch", async () => {
    const builder = makeBuilder();
    builder.single = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Not found" } });
    mockClient.from = vi.fn().mockReturnValue(builder);
    await expect(
      updateBranch(mockClient as any, "nonexistent", "org-1", { name: "X" }),
    ).rejects.toThrow(NotFoundError);
  });
});

describe("deleteBranch", () => {
  it("soft deletes and revalidates", async () => {
    // Factory's softDelete prefetches the record, so single() must return data
    const builder = makeBuilder({ id: "b-1" });
    builder.then = vi.fn((resolve: (v: unknown) => void) =>
      resolve({ data: null, error: null }),
    );
    mockClient.from = vi.fn().mockReturnValue(builder);
    await deleteBranch(mockClient as any, "b-1", "org-1");
    expect(revalidateTag).toHaveBeenCalled();
  });
});
