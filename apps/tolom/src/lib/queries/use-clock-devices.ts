"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import { createOrgQuery } from "./factory";

// ── Types ──────────────────────────────────────────────────────────

export interface ClockDevice {
  deviceId: string;
  mechanicId: string;
  mechanicName: string | null;
  deviceName: string | null;
  deviceFingerprint: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
  isActive: boolean;
}

// ── Keys ───────────────────────────────────────────────────────────

export const clockDeviceKeys = {
  all: (orgId: string) => ["organizations", orgId, "clock-devices"] as const,
  list: (orgId: string) => [...clockDeviceKeys.all(orgId), "list"] as const,
};

// ── Fetchers ───────────────────────────────────────────────────────

const fetchClockDevices = createOrgQuery<ClockDevice[]>("/clock/devices");

// ── Hooks ──────────────────────────────────────────────────────────

export function useClockDevices(
  orgId: string | undefined,
): UseQueryResult<ClockDevice[], Error> {
  return useQuery({
    queryKey: clockDeviceKeys.list(orgId ?? ""),
    queryFn: () => fetchClockDevices(orgId as string),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────

export function useDeleteClockDevice(orgId: string | undefined) {
  return useOrgMutation<unknown, { deviceId: string }>({
    endpoint: `/api/organizations/${orgId}/clock/devices`,
    method: "DELETE",
    queryKey: clockDeviceKeys.all(orgId ?? ""),
    bodyFn: (vars) => ({ deviceId: vars.deviceId }),
    successMessage: "Device removed",
  });
}
