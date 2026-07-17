"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SwipeableCardProps {
  children: React.ReactNode;
  /** Called when swiped left past threshold. */
  onSwipeLeft?: () => void;
  /** Called when swiped right past threshold. */
  onSwipeRight?: () => void;
  /** Swipe threshold in pixels. Default 80. */
  threshold?: number;
  /** Left action label (revealed on right swipe). */
  leftAction?: React.ReactNode;
  /** Right action label (revealed on left swipe). */
  rightAction?: React.ReactNode;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Swipeable card wrapper using native touch events.
 *
 * Supports left/right swipe gestures with configurable threshold.
 * Reveals action hints during swipe. No external dependencies.
 * Respects prefers-reduced-motion — disables swipe.
 */
export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  leftAction,
  rightAction,
  className,
}: SwipeableCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (reducedMotion) return;
      const touch = e.touches[0];
      if (!touch) return;
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      currentXRef.current = touch.clientX;
      isDraggingRef.current = false;
    },
    [reducedMotion],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (reducedMotion) return;
      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;

      // Only start swiping if horizontal movement dominates
      if (!isDraggingRef.current) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
          isDraggingRef.current = true;
          setIsSwiping(true);
        } else if (Math.abs(deltaY) > 10) {
          return; // vertical scroll — bail out
        }
      }

      if (isDraggingRef.current) {
        e.preventDefault();
        currentXRef.current = touch.clientX;
        setOffset(deltaX);
      }
    },
    [reducedMotion],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;

    const deltaX = currentXRef.current - startXRef.current;

    if (Math.abs(deltaX) >= threshold) {
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    setOffset(0);
    setIsSwiping(false);
    isDraggingRef.current = false;
  }, [threshold, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Visual feedback during swipe
  const progress = Math.min(Math.abs(offset) / threshold, 1);
  const transform =
    offset !== 0 ? `translateX(${offset * 0.6}px)` : undefined;

  return (
    <div
      ref={containerRef}
      className={cn("relative touch-pan-y select-none", className)}
      style={{
        transform,
        transition: isSwiping ? "none" : "transform 0.3s ease-out",
      }}
    >
      {/* Left action hint (revealed on right swipe) */}
      {leftAction && offset > 20 && (
        <div
          className="absolute inset-y-0 left-0 flex w-20 items-center justify-center"
          style={{ opacity: progress }}
          aria-hidden="true"
        >
          {leftAction}
        </div>
      )}

      {/* Right action hint (revealed on left swipe) */}
      {rightAction && offset < -20 && (
        <div
          className="absolute inset-y-0 right-0 flex w-20 items-center justify-center"
          style={{ opacity: progress }}
          aria-hidden="true"
        >
          {rightAction}
        </div>
      )}

      {children}
    </div>
  );
}
