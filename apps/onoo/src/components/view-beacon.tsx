"use client";

import { useEffect, useRef } from "react";

interface ViewBeaconProps {
  entityType: string;
  entityId: string;
}

/**
 * Client component that fires a `navigator.sendBeacon` POST to `/api/track`
 * exactly once per mount, recording a page view for the given entity.
 *
 * Skips tracking when `document.visibilityState === 'prerender'` to avoid
 * counting prerender/preview hits.
 */
export function ViewBeacon({ entityType, entityId }: ViewBeaconProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if ((document.visibilityState as string) === "prerender") return;

    fired.current = true;

    const payload = JSON.stringify({ entityType, entityId });
    navigator.sendBeacon("/api/track", payload);
  }, [entityType, entityId]);

  return null;
}
