"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

const TickContext = createContext<number | null>(null);

/**
 * Provides a shared `tick` value that updates every 30 seconds.
 * All ElapsedTimer instances read from this single interval instead of
 * each creating their own setInterval. Reduces N timer effects to 1.
 *
 * Initializes with null to avoid hydration mismatch (Date.now() differs
 * between server and client). Components should handle null gracefully.
 */
export function BayViewTickProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tick, setTick] = useState<number | null>(null);

  useEffect(() => {
    setTick(Date.now());
    const interval = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return <TickContext.Provider value={tick}>{children}</TickContext.Provider>;
}

export function useBayViewTick() {
  return useContext(TickContext);
}
