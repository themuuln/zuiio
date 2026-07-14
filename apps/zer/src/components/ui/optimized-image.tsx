"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  /** Display width in pixels — used for Supabase transform URL */
  width?: number;
  /** Display height — used for aspect ratio container */
  height?: number;
  className?: string;
  imgClassName?: string;
  /** If true, loads immediately instead of lazy */
  priority?: boolean;
  /** Aspect ratio as string e.g. "4/3", "1/1", "16/9" — overrides width/height ratio if set */
  aspectRatio?: string;
  /** Format to request from Supabase (default: webp) */
  format?: "webp" | "avif";
}

/**
 * Check if the URL is from Supabase storage (can apply transform params).
 */
function isSupabaseStorageUrl(url: string): boolean {
  return url.includes("supabase.co/storage/v1/object/public");
}

/**
 * Append Supabase image transformation query params to optimize delivery.
 */
function getOptimizedSrc(src: string, width: number, format: string): string {
  if (!isSupabaseStorageUrl(src)) return src;
  try {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    url.searchParams.set("format", format);
    url.searchParams.set("quality", "80");
    return url.toString();
  } catch {
    return src;
  }
}

// --- Shared IntersectionObserver singleton ---
// All OptimizedImage instances share one observer instead of creating 50+.
const imageCallbacks = new Map<Element, () => void>();

let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver(): IntersectionObserver {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const cb = imageCallbacks.get(entry.target);
          if (cb) {
            cb();
            sharedObserver?.unobserve(entry.target);
            imageCallbacks.delete(entry.target);
          }
        }
      }
    },
    { rootMargin: "200px" },
  );
  return sharedObserver;
}

/**
 * Smart image component optimized for Supabase storage images.
 *
 * Features:
 * - Shared IntersectionObserver (1 observer for all images, not 1 per image)
 * - Skeleton placeholder while loading
 * - Supabase image transformation (WebP/AVIF, resize)
 * - Aspect-ratio container to prevent layout shift
 */
export function OptimizedImage({
  src,
  alt,
  width = 400,
  height,
  className,
  imgClassName,
  priority = false,
  aspectRatio,
  format = "webp",
}: OptimizedImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);

  const onVisible = useCallback(() => setIsVisible(true), []);

  // Register with shared observer
  useEffect(() => {
    if (priority || !src) {
      setIsVisible(true);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    imageCallbacks.set(el, onVisible);
    getSharedObserver().observe(el);

    return () => {
      getSharedObserver().unobserve(el);
      imageCallbacks.delete(el);
    };
  }, [priority, src, onVisible]);

  if (!src) return null;

  const optimizedSrc = isVisible
    ? getOptimizedSrc(src, width, format)
    : undefined;
  const aspectRatioStyle = aspectRatio
    ? { aspectRatio }
    : height
      ? { aspectRatio: `${width}/${height}` }
      : undefined;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={aspectRatioStyle}
    >
      {!isLoaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      {isVisible && (
        // biome-ignore lint/performance/noImgElement: Custom lazy-loading with shared IntersectionObserver
        <img
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
    </div>
  );
}
