import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { createBranch, getBranches, updateBranch, deleteBranch } from "./branch-service";
import { revalidateTag } from "next/cache";
import { NotFoundError, ValidationError } from "@/lib/errors";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({ withCache: vi.fn((_key, fn) => fn()) }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

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
	then: vi.fn((resolve: (v: typeof resolved) => void) => resolve(resolved)),
  };
}

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(mockClient as unknown as Awaited<ReturnType<typeof createClient>>);
});

describe("createBranch", () => {
  it("creates with valid name", async () => {
    mockClient.from = vi.fn().mockReturnValue(makeBuilder({ id: "b-1", name: "Branch 2" }));
    const result = await createBranch("org-1", { name: "Branch 2" });
    expect(result.id).toBe("b-1");
    expect(revalidateTag).toHaveBeenCalled();
  });

  it("rejects empty name", async () => {
    await expect(createBranch("org-1", { name: "" })).rejects.toThrow(ValidationError);
  });
});

describe("getBranches", () => {
  it("returns filtered branches", async () => {
    const builder = makeBuilder([{ id: "b-1", name: "Main" }]);
    builder.then = vi.fn((resolve: (v: unknown) => void) => resolve({ data: [{ id: "b-1", name: "Main" }], error: null }));
    mockClient.from = vi.fn().mockReturnValue(builder);
    const result = await getBranches("org-1");
    expect(result).toHaveLength(1);
  });

  it("returns empty array", async () => {
    const builder = makeBuilder([]);
    builder.then = vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null }));
    mockClient.from = vi.fn().mockReturnValue(builder);
    expect(await getBranches("org-1")).toEqual([]);
  });
});

describe("updateBranch", () => {
  it("updates and revalidates", async () => {
    mockClient.from = vi.fn().mockReturnValue(makeBuilder({ id: "b-1", name: "Updated" }));
    const result = await updateBranch("b-1", "org-1", { name: "Updated" });
    expect(result.name).toBe("Updated");
    expect(revalidateTag).toHaveBeenCalled();
  });

  it("throws NotFoundError on missing branch", async () => {
    const builder = makeBuilder();
    builder.single = vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } });
    mockClient.from = vi.fn().mockReturnValue(builder);
    await expect(updateBranch("nonexistent", "org-1", { name: "X" })).rejects.toThrow(NotFoundError);
  });
});

describe("deleteBranch", () => {
  it("soft deletes and revalidates", async () => {
    const builder = makeBuilder();
    builder.then = vi.fn((resolve: (v: unknown) => void) => resolve({ data: null, error: null }));
    mockClient.from = vi.fn().mockReturnValue(builder);
    await deleteBranch("b-1", "org-1");
    expect(revalidateTag).toHaveBeenCalled();
  });
});
