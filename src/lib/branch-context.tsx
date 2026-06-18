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

  const [selectedBranchId, setSelectedBranchIdState] = React.useState<
    string | null
  >(() => {
    if (isBranchScoped) return userBranchId;

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && branches.some((b) => b.id === stored)) {
        return stored;
      }
    }
    return null;
  });

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
