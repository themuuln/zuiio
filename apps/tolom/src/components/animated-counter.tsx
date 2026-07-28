"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  /** Duration in ms. Default: 1500 */
  duration?: number;
}

export function AnimatedCounter({
  end,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
  duration = 1500,
}: AnimatedCounterProps) {
  const [count, setCount] = useState<number | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated || end === 0) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    const startValue = 0;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth finish
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(startValue + (end - startValue) * eased);

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [hasAnimated, end, duration]);

  const formatted =
    count !== null
      ? count.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : "";

  return (
    <div ref={ref} className={cn("", className)}>
      {count !== null && (
        <>
          {prefix}
          {formatted}
          {suffix}
        </>
      )}
    </div>
  );
}
