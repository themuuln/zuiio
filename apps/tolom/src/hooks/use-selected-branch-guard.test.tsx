import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBranches } from "@/lib/queries/use-branches";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import type { Branch } from "@/lib/types";
import { useSelectedBranchGuard } from "./use-selected-branch-guard";

vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: vi.fn(),
  useSetSelectedBranchId: vi.fn(),
}));

vi.mock("@/lib/queries/use-branches", () => ({
  useBranches: vi.fn(),
}));

const createBranches = (): Branch[] => [
  { id: "branch-1", name: "Main St", orgId: "org-1", isActive: true },
  { id: "branch-2", name: "Downtown", orgId: "org-1", isActive: true },
];

describe("useSelectedBranchGuard", () => {
  const setSelectedBranchId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSetSelectedBranchId).mockReturnValue(setSelectedBranchId);
  });

  it("does nothing when selected branch is 'all'", async () => {
    vi.mocked(useSelectedBranchId).mockReturnValue("all");
    vi.mocked(useBranches).mockReturnValue({
      data: createBranches(),
      isLoading: false,
      error: null,
    } as never);

    renderHook(() => useSelectedBranchGuard("org-1"));

    await waitFor(() => {
      expect(useBranches).toHaveBeenCalledWith("org-1");
    });

    expect(setSelectedBranchId).not.toHaveBeenCalled();
  });

  it("does nothing when selected branch exists in branches list", async () => {
    vi.mocked(useSelectedBranchId).mockReturnValue("branch-2");
    vi.mocked(useBranches).mockReturnValue({
      data: createBranches(),
      isLoading: false,
      error: null,
    } as never);

    renderHook(() => useSelectedBranchGuard("org-1"));

    await waitFor(() => {
      expect(useBranches).toHaveBeenCalledWith("org-1");
    });

    expect(setSelectedBranchId).not.toHaveBeenCalled();
  });

  it("resets to 'all' when selected branch no longer exists", async () => {
    vi.mocked(useSelectedBranchId).mockReturnValue("branch-gone");
    vi.mocked(useBranches).mockReturnValue({
      data: createBranches(),
      isLoading: false,
      error: null,
    } as never);

    renderHook(() => useSelectedBranchGuard("org-1"));

    await waitFor(() => {
      expect(setSelectedBranchId).toHaveBeenCalledWith("all");
    });
  });

  it("handles undefined orgId (does not call useBranches)", async () => {
    vi.mocked(useSelectedBranchId).mockReturnValue("all");

    renderHook(() => useSelectedBranchGuard(undefined));

    expect(useBranches).toHaveBeenCalledWith(undefined);
    expect(setSelectedBranchId).not.toHaveBeenCalled();
  });
});
