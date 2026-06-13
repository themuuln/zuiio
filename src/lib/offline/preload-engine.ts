"use client";

import { syncApiResponse } from "./idb-sync";
import { getEndpointsByPriority, type PreloadEndpoint } from "./preload-config";

// ─── Types ────────────────────────────────────────────────────

export interface PreloadProgress {
  /** Total endpoints to preload */
  total: number;
  /** Number completed (success or failed) */
  done: number;
  /** Current endpoint label */
  current: string;
  /** Whether preload is finished */
  complete: boolean;
  /** Number of successful endpoints */
  succeeded: number;
  /** Number of failed endpoints */
  failed: number;
  /** Failed endpoint paths */
  errors: string[];
}

type ProgressCallback = (progress: PreloadProgress) => void;

// ─── Constants ────────────────────────────────────────────────

/** Max concurrent requests per priority group */
const CONCURRENCY: Record<string, number> = {
  critical: 5,
  high: 3,
  medium: 2,
  low: 1,
};

/** Request timeout in ms */
const TIMEOUT_MS = 10_000;

// ─── Engine ───────────────────────────────────────────────────

/**
 * Preload all critical data for an organization into IndexedDB.
 *
 * Strategy:
 * - Critical endpoints: parallel (5 at a time)
 * - High endpoints: parallel (3 at a time)
 * - Medium endpoints: parallel (2 at a time)
 * - Low endpoints: sequential (1 at a time)
 *
 * Each endpoint gets a 10s timeout. Failures are logged but don't block others.
 */
export async function preloadAll(
  orgId: string,
  onProgress?: ProgressCallback,
): Promise<PreloadProgress> {
  const groups = getEndpointsByPriority();
  const total = groups.reduce((sum, g) => sum + g.length, 0);

  const progress: PreloadProgress = {
    total,
    done: 0,
    current: "",
    complete: false,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  const report = () => onProgress?.({ ...progress });

  for (const group of groups) {
    if (group.length === 0) continue;

    const concurrency = CONCURRENCY[group[0].priority] ?? 1;

    // Process in batches of `concurrency`
    for (let i = 0; i < group.length; i += concurrency) {
      const batch = group.slice(i, i + concurrency);

      await Promise.allSettled(
        batch.map(async (endpoint) => {
          progress.current = endpoint.label ?? endpoint.path;
          report();

          try {
            await preloadEndpoint(orgId, endpoint);
            progress.succeeded++;
          } catch (_err) {
            progress.failed++;
            progress.errors.push(endpoint.path);
            // Don't throw — continue with other endpoints
          } finally {
            progress.done++;
            report();
          }
        }),
      );
    }
  }

  progress.complete = true;
  progress.current = "";
  report();

  return progress;
}

/**
 * Preload a single endpoint into IndexedDB.
 */
async function preloadEndpoint(
  orgId: string,
  endpoint: PreloadEndpoint,
): Promise<void> {
  const url = buildUrl(orgId, endpoint);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${endpoint.path}`);
    }

    const json = await res.json();

    if (json.error) {
      throw new Error(json.error.message ?? `API error for ${endpoint.path}`);
    }

    // Sync the response to IndexedDB
    await syncApiResponse(
      endpoint.store,
      orgId,
      endpoint.path,
      endpoint.params,
      json,
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Build the full URL for a preload endpoint.
 */
function buildUrl(orgId: string, endpoint: PreloadEndpoint): string {
  let url = `/api/organizations/${orgId}${endpoint.path}`;
  if (endpoint.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(endpoint.params)) {
      searchParams.set(key, value);
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

/**
 * Check if preload has already been done for this org in this session.
 * Uses sessionStorage (cleared on tab close) so each new session re-preloads.
 */
export function isPreloaded(orgId: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(`preload:${orgId}`) === "done";
}

/**
 * Mark preload as complete for this org + session.
 */
export function markPreloaded(orgId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`preload:${orgId}`, "done");
}
