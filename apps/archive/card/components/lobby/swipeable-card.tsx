"use client";

import { useState, useRef, useCallback, type ReactNode, type TouchEvent, type MouseEvent } from "react";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  disabled?: boolean;
  threshold?: number;
}

/**
 * A swipeable card component for the game picker.
 * Swipe right = want to play, swipe left = skip.
 * Uses touch events for mobile and mouse events for desktop.
 */
export function SwipeableCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  disabled = false,
  threshold = 80,
}: SwipeableCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback((clientX: number) => {
    if (disabled) return;
    startX.current = clientX;
    currentX.current = clientX;
    setSwiping(true);
  }, [disabled]);

  const handleMove = useCallback((clientX: number) => {
    if (!swiping || disabled) return;
    currentX.current = clientX;
    const diff = currentX.current - startX.current;
    setOffsetX(diff);
  }, [swiping, disabled]);

  const handleEnd = useCallback(() => {
    if (!swiping || disabled) return;
    setSwiping(false);

    const diff = currentX.current - startX.current;

    if (Math.abs(diff) >= threshold) {
      if (diff > 0) {
        // Swiped right
        onSwipeRight();
      } else {
        // Swiped left
        onSwipeLeft();
      }
    }

    setOffsetX(0);
  }, [swiping, disabled, threshold, onSwipeRight, onSwipeLeft]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    handleStart(e.touches[0].clientX);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    handleStart(e.clientX);
  }, [handleStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const handleMouseLeave = useCallback(() => {
    if (swiping) {
      handleEnd();
    }
  }, [swiping, handleEnd]);

  // Calculate rotation based on offset (max ±15deg)
  const rotation = Math.min(Math.max(offsetX / 15, -15), 15);
  const opacity = Math.max(1 - Math.abs(offsetX) / 500, 0.5);

  return (
    <div
      ref={cardRef}
      className="relative select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        cursor: disabled ? "default" : "grab",
      }}
    >
      {/* Swipe indicator overlay */}
      {swiping && (
        <>
          {/* Right swipe indicator */}
          <div
            className="absolute inset-y-0 left-0 z-10 flex w-20 items-center justify-center rounded-l-xl bg-green-500/80 transition-opacity"
            style={{
              opacity: Math.min(Math.max(offsetX / threshold, 0), 1),
              pointerEvents: "none",
            }}
          >
            <span className="text-2xl font-bold text-white">👍</span>
          </div>
          {/* Left swipe indicator */}
          <div
            className="absolute inset-y-0 right-0 z-10 flex w-20 items-center justify-center rounded-r-xl bg-red-500/80 transition-opacity"
            style={{
              opacity: Math.min(Math.max(-offsetX / threshold, 0), 1),
              pointerEvents: "none",
            }}
          >
            <span className="text-2xl font-bold text-white">👎</span>
          </div>
        </>
      )}

      {/* Card content */}
      <div
        className="transition-shadow"
        style={{
          transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
          transition: swiping ? "none" : "transform 0.3s ease-out",
          opacity,
        }}
      >
        {children}
      </div>
    </div>
  );
}
