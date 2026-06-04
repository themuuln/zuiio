"use client";

import { useEffect, useState } from "react";

/**
 * Track browser online/offline status via navigator.onLine + event listeners.
 *
 * Returns `true` when the browser believes it has network connectivity.
 * Note: `navigator.onLine` is not perfectly reliable — it only checks if the
 * device has *any* network interface (WiFi, ethernet, etc.), not whether the
 * internet is actually reachable. For TOLOM's use case (mechanic workshop with
 * spotty WiFi), this is sufficient.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return isOnline;
}
