"use client";

import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { useOnlineStatus } from "@zuiio/hooks";
import type { PreloadProgress } from "@/lib/offline/preload-engine";

interface PreloadScreenProps {
  progress: PreloadProgress | null;
}

/**
 * Full-screen preload overlay shown after login.
 * Displays a progress bar and current loading step.
 *
 * Usage:
 * ```tsx
 * const { progress, isPreloading } = usePreloadStatus(orgId);
 * if (isPreloading && !progress?.complete) return <PreloadScreen progress={progress} />;
 * ```
 */
export function PreloadScreen({ progress }: PreloadScreenProps) {
  const isOnline = useOnlineStatus();
  const [showErrors, setShowErrors] = useState(false);
  const percent = progress
    ? Math.round((progress.done / Math.max(progress.total, 1)) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 px-6">
        {/* Logo / brand */}
        <div className="flex items-center gap-2 text-2xl font-bold">
          <span className="text-primary">T</span>
          <span>TOLOM</span>
        </div>

        {/* Status icon */}
        {isOnline ? (
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        ) : (
          <WifiOff className="size-8 text-destructive" />
        )}

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <Progress value={percent} className="h-2" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {progress?.complete
                ? "Ready"
                : progress?.current
                  ? `Loading ${progress.current}…`
                  : "Preparing your workspace…"}
            </span>
            <span>{percent}%</span>
          </div>
        </div>

        {/* Stats */}
        {progress && progress.done > 0 && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{progress.succeeded} loaded</span>
            {progress.failed > 0 && (
              <span className="text-destructive">{progress.failed} failed</span>
            )}
            <span>{progress.total - progress.done} remaining</span>
          </div>
        )}

        {/* Failed endpoints detail */}
        {progress && progress.errors.length > 0 && (
          <div className="w-full">
            <button
              type="button"
              onClick={() => setShowErrors(!showErrors)}
              className="flex w-full items-center gap-1 text-xs text-destructive hover:underline"
            >
              {showErrors ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              {progress.errors.length} failed{" — "}
              tap to {showErrors ? "hide" : "show"}
            </button>
            {showErrors && (
              <ul className="mt-1 space-y-0.5 pl-4">
                {progress.errors.map((err, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    {err}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Offline warning */}
        {!isOnline && (
          <p className="text-center text-sm text-muted-foreground">
            You're offline. Loading cached data only.
          </p>
        )}

        {/* Connection indicator */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isOnline ? (
            <>
              <Wifi className="size-3 text-green-500" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="size-3 text-destructive" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
