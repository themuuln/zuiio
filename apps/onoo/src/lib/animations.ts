"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Triggers once when the element enters the viewport.
 * Uses the native IntersectionObserver API — no animation library needed.
 */
export function useInView(
  ref: RefObject<Element | null>,
  options?: { once?: boolean; margin?: string },
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rootMargin = options?.margin ?? "0px";
    const once = options?.once ?? true;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, options?.once, options?.margin]);

  return inView;
}
