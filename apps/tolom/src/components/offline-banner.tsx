"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";

/**
 * Fixed banner that appears when the browser is offline.
 * Auto-dismisses 3 seconds after connectivity is restored.
 *
 * Add to layout: <OfflineBanner />
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [visible, setVisible] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
      setJustReconnected(false);
    } else if (visible) {
      // Was showing the banner, now back online — keep visible briefly then hide
      setJustReconnected(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setJustReconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        justReconnected
          ? "translate-y-0 opacity-100"
          : "translate-y-0 opacity-100"
      }`}
    >
      <Alert
        variant={justReconnected ? "default" : "destructive"}
        className="rounded-none border-x-0 border-t-0"
      >
        <WifiOff className="size-4" />
        <AlertTitle>
          {justReconnected ? "Back online" : "You're offline"}
        </AlertTitle>
        <AlertDescription>
          {justReconnected
            ? "Syncing your data…"
            : "Changes will be saved locally and synced when you reconnect."}
        </AlertDescription>
      </Alert>
    </div>
  );
}
