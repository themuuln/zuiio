"use client";

import { useEffect, useRef, useState } from "react";
import { reportServerError } from "@/lib/sentry-report-server";
import type { PartLine } from "./use-part-lines";
import type { ServiceLine } from "./use-service-lines";

interface WizardDraft {
  selectedCustomerId: string | null;
  selectedVehicleId: string | null;
  complaint: string;
  diagnosisLabelId: string | null;
  description: string;
  selectedMechanicId: string | null;
  serviceLines: ServiceLine[];
  partLines: PartLine[];
  savedAt: number;
}

const DRAFT_KEY = (orgId: string) => `wizard-draft-${orgId}`;

export function useDraftSave(
  orgId: string | undefined,
  deps: {
    selectedCustomerId: string | null | undefined;
    selectedVehicleId: string | null | undefined;
    complaint: string;
    diagnosisLabelId: string | null;
    description: string;
    selectedMechanicId: string;
    serviceLines: ServiceLine[];
    partLines: PartLine[];
  },
) {
  const [draftData, setDraftData] = useState<WizardDraft | null>(null);
  const draftCheckedRef = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Check for existing draft on mount
  useEffect(() => {
    if (!orgId || draftCheckedRef.current) return;
    draftCheckedRef.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY(orgId));
      if (!raw) return;
      const draft = JSON.parse(raw) as WizardDraft;
      if (!draft || typeof draft.savedAt !== "number") return;
      setDraftData(draft);
    } catch {
      reportServerError("Unexpected error");
      // ignore
    }
  }, [orgId]);

  // Debounced auto-save
  useEffect(() => {
    if (!orgId) return;
    const draft: WizardDraft = {
      selectedCustomerId: deps.selectedCustomerId ?? null,
      selectedVehicleId: deps.selectedVehicleId ?? null,
      complaint: deps.complaint,
      diagnosisLabelId: deps.diagnosisLabelId,
      description: deps.description,
      selectedMechanicId: deps.selectedMechanicId || null,
      serviceLines: deps.serviceLines,
      partLines: deps.partLines,
      savedAt: Date.now(),
    };
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY(orgId), JSON.stringify(draft));
      } catch {
        reportServerError("Unexpected error");
        // localStorage full
      }
    }, 2000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    orgId,
    deps.selectedCustomerId,
    deps.selectedVehicleId,
    deps.complaint,
    deps.diagnosisLabelId,
    deps.description,
    deps.selectedMechanicId,
    deps.serviceLines,
    deps.partLines,
  ]);

  const discardDraft = () => {
    if (!orgId) return;
    try {
      localStorage.removeItem(DRAFT_KEY(orgId));
    } catch {
      reportServerError("Unexpected error");
      /* ignore */
    }
    setDraftData(null);
  };

  return { draftData, discardDraft };
}
