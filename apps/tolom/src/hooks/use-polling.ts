"use client";

import { useEffect, useRef } from "react";

export function usePolling(
  callback: () => void,
  intervalMs: number,
  enabled = true,
) {
  const isPaused = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      if (!isPaused.current) callback();
    }, intervalMs);
    return () => clearInterval(id);
  }, [callback, intervalMs, enabled]);

  return {
    pause: () => {
      isPaused.current = true;
    },
    resume: () => {
      isPaused.current = false;
    },
  };
}
