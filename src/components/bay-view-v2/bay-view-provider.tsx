"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { BayViewData, ShiftReport } from "@/lib/services/bay-view-service";
import {
  getBayViewDataFresh,
  getShiftReport,
} from "@/lib/services/bay-view-service";
import { useSelectedBranchId } from "@/lib/stores";
import { useBayViewStore } from "@/lib/stores/bay-view-store";

// ─── Context Type ──────────────────────────────────────────────

interface BayViewContextValue {
  data: BayViewData | null;
  setData: React.Dispatch<React.SetStateAction<BayViewData | null>>;
  shiftReport: ShiftReport | null;
  setShiftReport: React.Dispatch<React.SetStateAction<ShiftReport | null>>;
  loading: boolean;
  error: string | null;
  fetchData: (showLoader?: boolean) => Promise<void>;
  currentProfile: { id: string; full_name: string | null } | null;
  activeDrag: {
    type: "vehicle" | "mechanic";
    label: string;
    previewBay?: unknown;
  } | null;
  setActiveDrag: (
    d: {
      type: "vehicle" | "mechanic";
      label: string;
      previewBay?: unknown;
    } | null,
  ) => void;
}

const BayViewContext = createContext<BayViewContextValue | null>(null);

export function useBayViewContext() {
  const ctx = useContext(BayViewContext);
  if (!ctx) {
    throw new Error("useBayViewContext must be used within BayViewProvider");
  }
  return ctx;
}

// ─── Provider ──────────────────────────────────────────────────

export function BayViewProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: orgInfo } = useCurrentOrg();
  const selectedBranchId = useSelectedBranchId();
  const isPollingPaused = useBayViewStore((s) => s.isPollingPaused);

  const branchFilter =
    selectedBranchId === "all" ? undefined : selectedBranchId;

  // ── Local state (data-heavy, stays in useState) ──
  const [data, setData] = useState<BayViewData | null>(null);
  const [shiftReport, setShiftReport] = useState<ShiftReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<{
    id: string;
    full_name: string | null;
  } | null>(null);
  const [activeDrag, setActiveDrag] = useState<{
    type: "vehicle" | "mechanic";
    label: string;
    previewBay?: unknown;
  } | null>(null);

  const fetchGenerationRef = useRef(0);

  // ── Data fetching ──
  const fetchData = useCallback(
    async (showLoader = false) => {
      const gen = ++fetchGenerationRef.current;
      if (showLoader) setLoading(true);
      try {
        setError(null);
        const [result, report] = await Promise.all([
          getBayViewDataFresh(branchFilter),
          getShiftReport(branchFilter).catch(() => null),
        ]);
        // Ignore stale responses from older fetch generations
        if (gen !== fetchGenerationRef.current) return;
        setData(result);
        if (report) setShiftReport(report);
      } catch (err) {
        if (gen !== fetchGenerationRef.current) return;
        setError(
          err instanceof Error ? err.message : "Failed to load bay view data",
        );
      } finally {
        if (gen === fetchGenerationRef.current) {
          setLoading(false);
        }
      }
    },
    [branchFilter],
  );

  // ── Initial fetch ──
  useEffect(() => {
    const abort = new AbortController();
    fetchData(true);

    // Fetch profile
    fetch("/api/profile", { signal: abort.signal })
      .then((r) => r.json())
      .then((d) => {
        if (abort.signal.aborted) return;
        const profile = d?.profile ?? d?.data;
        if (profile?.id) {
          setCurrentProfile({
            id: profile.id,
            full_name: profile.full_name ?? null,
          });
        }
      })
      .catch(() => {});

    return () => {
      abort.abort();
    };
  }, [fetchData]);

  // ── Polling (respects pause state) ──
  useEffect(() => {
    if (isPollingPaused) return;
    const interval = setInterval(() => {
      fetchData(false);
    }, 30_000);
    return () => clearInterval(interval);
  }, [isPollingPaused, fetchData]);

  const value: BayViewContextValue = {
    data,
    setData,
    shiftReport,
    setShiftReport,
    loading,
    error,
    fetchData,
    currentProfile,
    activeDrag,
    setActiveDrag,
  };

  return (
    <BayViewContext.Provider value={value}>{children}</BayViewContext.Provider>
  );
}
