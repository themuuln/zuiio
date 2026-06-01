"use client";

import { useEffect, useState } from "react";

/**
 * Returns a Date that is only set on the client, not during SSR.
 * This prevents hydration mismatches caused by `new Date()` in JSX.
 */
export function useClientNow(): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setNow(new Date());

    // Tick every second so elapsed-time displays don't freeze
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}
