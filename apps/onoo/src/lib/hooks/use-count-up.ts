"use client";

import { useEffect, useState } from "react";

interface UseCountUpOptions {
  /** Animation duration in ms. Default 800. */
  duration?: number;
}

/**
 * rAF-based count-up from 0 → target.
 * Jumps straight to target when prefers-reduced-motion is active.
 */
export function useCountUp(
  target: number,
  options?: UseCountUpOptions,
): number {
  const duration = options?.duration ?? 800;
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Zero or reduced-motion → instant
    if (target === 0) {
      setValue(0);
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }

    let raf: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic — fast start, gentle settle
      const eased = 1 - (1 - t) ** 3;
      setValue(eased * target);
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
