"use client";

import { useState } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";

/**
 * Main image + thumbnail strip for the public product page. Rendered only
 * when a product has multiple images; the backend returns image_url as the
 * first entry of `images`, so index 0 is the primary image. Plain React
 * state — no external deps.
 */
export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
        <OptimizedImage
          src={active}
          alt={alt}
          className="h-full w-full"
          width={800}
          priority
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <fieldset
          aria-label="Бүтээгдэхүүний зургууд"
          className="flex gap-2 overflow-x-auto border-0 p-0"
        >
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Зураг ${i + 1}`}
              aria-pressed={i === activeIndex}
              className={cn(
                "size-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                i === activeIndex
                  ? "border-primary"
                  : "border-transparent hover:border-border",
              )}
            >
              <OptimizedImage
                src={url}
                alt={`Зураг ${i + 1}`}
                className="h-full w-full"
                width={128}
              />
            </button>
          ))}
        </fieldset>
      )}
    </div>
  );
}
