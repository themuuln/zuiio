"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

const TickContext = createContext(Date.now());

/**
 * Provides a shared `tick` value that updates every 30 seconds.
 * All ElapsedTimer instances read from this single interval instead of
 * each creating their own setInterval. Reduces N timer effects to 1.
 */
export function BayViewTickProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tick, setTick] = useState(Date.now);

  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return <TickContext.Provider value={tick}>{children}</TickContext.Provider>;
}

export function useBayViewTick() {
  return useContext(TickContext);
}
