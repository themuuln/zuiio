"use client";

import { useState, useEffect, useRef } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconnectingBannerProps {
  /** Unique identifier for the connection context (e.g., room code or game session ID) */
  connectionId: string;
  /** Called when connection is restored, for re-syncing state */
  onReconnected?: () => void;
  /** Optional class name override */
  className?: string;
}

type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

/**
 * A banner that shows when the browser loses network connectivity.
 * Uses the browser's online/offline events.
 *
 * When connection is lost:
 * 1. Shows "Connection lost" banner immediately
 * 2. After 3 seconds, shows "Reconnecting..." with spinner
 * 3. When connection returns, calls onReconnected and auto-hides
 */
export function ReconnectingBanner({
  connectionId,
  onReconnected,
  className,
}: ReconnectingBannerProps) {
  const [status, setStatus] = useState<ConnectionStatus>("connected");
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasDisconnectedRef = useRef(false);

  useEffect(() => {
    if (!connectionId) return;

    const goOffline = () => {
      setStatus("disconnected");
      wasDisconnectedRef.current = true;

      // After 3 seconds of disconnection, show "Reconnecting..."
      reconnectTimerRef.current = setTimeout(() => {
        setStatus("reconnecting");
      }, 3000);
    };

    const goOnline = () => {
      if (wasDisconnectedRef.current) {
        // Clear reconnect timer
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }

        // Connection restored - call callback and reset
        setStatus("connected");
        wasDisconnectedRef.current = false;
        onReconnected?.();
      }
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    // Also check current online status
    if (!navigator.onLine) {
      goOffline();
    }

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connectionId, onReconnected]);

  if (status === "connected") return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        className
      )}
    >
      {status === "disconnected" && (
        <div className="flex items-center justify-center gap-2 bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
          <WifiOff className="h-4 w-4" />
          <span>Connection lost</span>
        </div>
      )}

      {status === "reconnecting" && (
        <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Reconnecting...</span>
        </div>
      )}
    </div>
  );
}
