"use client";

import { Loader2, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ShareStatCardButtonProps {
  /** API endpoint that returns a stat card PNG (e.g., /api/cards/player/[id]) */
  endpoint: string;
  /** Filename for download (e.g., "player-stat-card.png") */
  filename: string;
  /** Accessible label */
  label?: string;
  className?: string;
}

export function ShareStatCardButton({
  endpoint,
  filename,
  label = "Хуваалцах",
  className,
}: ShareStatCardButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to fetch card");

      const blob = await response.blob();

      // Try native share with file
      if (navigator.canShare?.({ files: [new File([], "")] })) {
        const file = new File([blob], filename, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: filename.replace(".png", ""),
        });
      } else {
        // Fallback: download the PNG
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      // Fallback to download if share fails
      console.error("Share failed, downloading instead", error);
      try {
        const response = await fetch(endpoint);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } catch (fallbackError) {
        console.error("Download also failed", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleShare}
      disabled={loading}
      variant="outline"
      size="sm"
      className={cn("gap-2", className)}
      aria-label={loading ? "Уншиж байна..." : label}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Share2 className="size-4" aria-hidden="true" />
      )}
      {loading ? "Уншиж байна..." : label}
    </Button>
  );
}
