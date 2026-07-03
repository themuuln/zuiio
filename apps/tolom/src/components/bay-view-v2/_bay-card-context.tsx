"use client";

import React, { createContext, useContext } from "react";
import type { BayCardMechanic } from "./_bay-card-types";

export interface BayCardContextValue {
  woId: string;
  status: string;
  isPending: boolean;
  isKanbanMode: boolean;
  mechanics: BayCardMechanic[];
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay?: (woId: string) => void;
  onOpenDetail: (woId: string) => void;
  onRemoveHelper?: (woId: string, mechanicId: string) => void;
  onAssignMechanic?: (woId: string, mechanicId: string) => Promise<void>;
  onRemoveMechanic?: (woId: string) => Promise<void>;
  onAddHelper?: (woId: string, mechanicId: string) => Promise<void>;
  onReorderMechanics?: (
    woId: string,
    orderedMechanicIds: string[],
  ) => Promise<void>;
  onPauseTimer?: (woId: string) => void;
  onAddNote?: (woId: string) => void;
  onQuickAddService?: (woId: string) => void;
  onQuickAddParts?: (woId: string) => void;
}

const BayCardCtx = createContext<BayCardContextValue | null>(null);

export function useBayCardContext() {
  const ctx = useContext(BayCardCtx);
  if (!ctx)
    throw new Error("useBayCardContext must be used within BayCardProvider");
  return ctx;
}

export function BayCardProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: BayCardContextValue;
}) {
  return <BayCardCtx.Provider value={value}>{children}</BayCardCtx.Provider>;
}
