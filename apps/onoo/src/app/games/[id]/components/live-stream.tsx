"use client";

import { Badge } from "@/components/ui";

interface LiveStreamProps {
  streamUrl: string | null;
  isLive: boolean;
}

export function LiveStream({ streamUrl, isLive }: LiveStreamProps) {
  if (!streamUrl) return null;

  const embedUrl = getEmbedUrl(streamUrl);

  // If we can't embed (unknown platform), show as a link
  if (!embedUrl) {
    return (
      <a
        href={streamUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        {isLive && (
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        )}
        🎥 Шууд үзэх
      </a>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted mb-4">
      <iframe
        src={embedUrl}
        title="Шууд дамжуулалт"
        className="absolute inset-0 w-full h-full"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
      {isLive && (
        <Badge className="absolute top-2 left-2 bg-red-600 hover:bg-red-700">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse mr-1.5" />
          ШУУД
        </Badge>
      )}
    </div>
  );
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const v =
        u.searchParams.get("v") ||
        u.pathname.slice(1).split("/")[0] ||
        u.pathname.slice(1);
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1`;
    }
    if (
      u.hostname.includes("facebook.com") ||
      u.hostname.includes("fb.watch")
    ) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
    }
    return null;
  } catch {
    return null;
  }
}
