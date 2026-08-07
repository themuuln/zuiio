"use client";

import * as React from "react";
import { createContext, useContext, useRef } from "react";
import { useInView } from "@/lib/animations";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// All animations are intentionally subtle: small opacity + translateY shifts,
// short durations, gentle easing. Nothing flashy.
// ---------------------------------------------------------------------------

/**
 * Counts up from 0 to `target` with easing. Triggered when scrolled into view.
 * Subtle: fades in + slight upward slide, then counts.
 */
export function AnimatedCounter({
  target,
  duration = 1.2,
  decimals = 0,
  suffix = "",
  className,
}: {
  target: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (!isInView) return;
    const start = performance.now();
    const from = 0;
    const to = target;

    function tick(now: number) {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [isInView, target, duration]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();

  return (
    <span
      ref={ref}
      className={cn(
        "tabular-nums transition-all ease-out",
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5",
        className,
      )}
      style={{ transitionDuration: "0.4s" }}
    >
      {formatted}
      {suffix}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stagger animation via React context — container provides visibility + delay,
// each item reads its index to compute transition-delay.
// ---------------------------------------------------------------------------

const StaggerCtx = createContext<{
  visible: boolean;
  delay: number;
  index: number;
}>({ visible: false, delay: 0, index: 0 });

/**
 * Staggered fade-in container. Children animate in sequence with a small delay.
 */
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: "-30px" });
  const items = React.Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {items.map((child, i) => (
        <StaggerCtx.Provider
          // biome-ignore lint/suspicious/noArrayIndexKey: children order is the stagger identity; no stable per-item key
          key={i}
          value={{ visible, delay: staggerDelay, index: i }}
        >
          {child}
        </StaggerCtx.Provider>
      ))}
    </div>
  );
}

/**
 * StaggerItem — use as direct child of StaggerContainer.
 * Fades in + slides up slightly.
 */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { visible, delay, index } = useContext(StaggerCtx);

  return (
    <div
      className={cn(
        "transition-all ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2.5",
        className,
      )}
      style={{
        transitionDuration: "0.35s",
        transitionDelay: `${index * delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * ScrollReveal — fades in + slides up when scrolled into view.
 * Use for sections/cards that should appear as user scrolls.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all ease-out",
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        className,
      )}
      style={{
        transitionDuration: "0.4s",
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
