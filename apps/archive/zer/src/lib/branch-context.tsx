"use client";

import * as React from "react";

export interface BranchOption {
  id: string;
  name: string;
  slug: string;
  is_default: boolean | null;
}

interface BranchContextValue {
  /** Currently selected branch ID, or null for "all branches" */
  selectedBranchId: string | null;
  /** All branches the user can access */
  branches: BranchOption[];
  /** Select a branch (null = all branches / org-wide) */
  setSelectedBranchId: (id: string | null) => void;
  /** Whether the user is scoped to a single branch */
  isBranchScoped: boolean;
  /** The user's profile branch_id (null = admin, UUID = scoped) */
  userBranchId: string | null;
}

const BranchContext = React.createContext<BranchContextValue | null>(null);

const STORAGE_KEY = "zer-selected-branch";

export function BranchProvider({
  children,
  branches,
  userBranchId,
}: {
  children: React.ReactNode;
  branches: BranchOption[];
  userBranchId: string | null;
}) {
  const isBranchScoped = userBranchId !== null;

  // During SSR, always start with null (or userBranchId for scoped users).
  // After hydration, useEffect syncs from localStorage for admin users.
  const [selectedBranchId, setSelectedBranchIdState] = React.useState<
    string | null
  >(() => {
    if (isBranchScoped) return userBranchId;
    return null;
  });

  // Read localStorage after hydration to restore persisted selection.
  // This fixes VAL-USER-006: context lost on full page reloads.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only run once after hydration
  React.useEffect(() => {
    if (!isBranchScoped && typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && branches.some((b) => b.id === stored)) {
        setSelectedBranchIdState(stored);
      }
    }
    // Only run once after hydration.
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only run once after hydration
  }, []);

  const setSelectedBranchId = React.useCallback(
    (id: string | null) => {
      if (isBranchScoped) return;
      setSelectedBranchIdState(id);
      if (typeof window !== "undefined") {
        if (id) {
          localStorage.setItem(STORAGE_KEY, id);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    },
    [isBranchScoped],
  );

  const value = React.useMemo(
    () => ({
      selectedBranchId,
      branches,
      setSelectedBranchId,
      isBranchScoped,
      userBranchId,
    }),
    [
      selectedBranchId,
      branches,
      setSelectedBranchId,
      isBranchScoped,
      userBranchId,
    ],
  );

  return (
    <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
  );
}

export function useBranchContext(): BranchContextValue {
  const ctx = React.useContext(BranchContext);
  if (!ctx) {
    throw new Error("useBranchContext must be used within a BranchProvider");
  }
  return ctx;
}
