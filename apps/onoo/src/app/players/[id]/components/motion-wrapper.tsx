"use client";

import * as React from "react";
import { type ReactNode, useRef } from "react";
import { motion, useInView } from "framer-motion";
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
    <motion.span
      ref={ref}
      className={cn("tabular-nums", className)}
      initial={{ opacity: 0, y: 6 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {formatted}{suffix}
    </motion.span>
  );
}

/**
 * Staggered fade-in container. Children animate in sequence with a small delay.
 */
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.06,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
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
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.35, ease: "easeOut" },
        },
      }}
    >
      {children}
    </motion.div>
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
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
