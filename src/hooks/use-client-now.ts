"use client";

import { useEffect, useState } from "react";

/**
 * Returns a Date that is only set on the client, not during SSR.
 * This prevents hydration mismatches caused by `new Date()` in JSX.
 */
export function useClientNow(): Date {
  // Use a fixed epoch date for SSR so server and client match initially.
  // The useEffect updates to the real time on the client.
  const [now, setNow] = useState<Date>(() => new Date(0));

  useEffect(() => {
    setNow(new Date());

    // Tick every second so elapsed-time displays don't freeze
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}
