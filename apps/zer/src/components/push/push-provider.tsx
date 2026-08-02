"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Web push subscription manager.
 *
 * Mounted once in the dashboard shell. Reads the opt-in flag from
 * localStorage ("zer-push-enabled") and restores the browser subscription
 * on mount. /sw.js is registered by the root layout — this provider only
 * waits for `navigator.serviceWorker.ready`.
 */

const STORAGE_KEY = "zer-push-enabled";

type PushPermission = NotificationPermission | "unsupported";

interface PushContextValue {
  /** True when push is available and VAPID keys are configured. */
  supported: boolean;
  /** True when the user is opted in and subscribed. */
  enabled: boolean;
  permission: PushPermission;
  /** Request permission + subscribe + register the endpoint. Returns success. */
  enable: () => Promise<boolean>;
  /** Unsubscribe + remove the endpoint + clear the opt-in flag. */
  disable: () => Promise<void>;
}

const PushContext = createContext<PushContextValue | null>(null);

/** Decode a base64url VAPID public key into a Uint8Array for pushManager. */
export function urlBase64ToUint8Array(
  base64String: string,
): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushProvider({ children }: { children: React.ReactNode }) {
  const supported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
    );
  }, []);

  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<PushPermission>(() =>
    typeof Notification !== "undefined"
      ? Notification.permission
      : "unsupported",
  );

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
          ),
        });
      }

      const json = subscription.toJSON();
      const endpoint = json.endpoint;
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;
      if (!endpoint || !p256dh || !auth) return false;

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, p256dh, auth }),
      });
      if (!response.ok) return false;

      localStorage.setItem(STORAGE_KEY, "true");
      setEnabled(true);
      return true;
    } catch {
      return false;
    }
  }, [supported]);

  // Restore the subscription when the user opted in before.
  useEffect(() => {
    if (!supported) return;
    setPermission(Notification.permission);
    if (localStorage.getItem(STORAGE_KEY) !== "true") return;

    if (Notification.permission === "granted") {
      void subscribe();
    } else {
      // Permission was revoked since opt-in — clear the flag.
      localStorage.removeItem(STORAGE_KEY);
      setEnabled(false);
    }
  }, [supported, subscribe]);

  const enable = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;
    if (Notification.permission === "denied") return false;
    if (Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return false;
    }
    return subscribe();
  }, [supported, subscribe]);

  const disable = useCallback(async (): Promise<void> => {
    if (!supported) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const endpoint = subscription?.toJSON().endpoint ?? null;
      if (subscription) {
        await subscription.unsubscribe();
      }
      if (endpoint) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
    } catch {
      // Best effort — always clear the local opt-in below.
    }
    localStorage.removeItem(STORAGE_KEY);
    setEnabled(false);
  }, [supported]);

  const value = useMemo(
    () => ({ supported, enabled, permission, enable, disable }),
    [supported, enabled, permission, enable, disable],
  );

  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
}

export function usePush(): PushContextValue {
  const ctx = useContext(PushContext);
  if (!ctx) {
    throw new Error("usePush must be used within a <PushProvider>");
  }
  return ctx;
}
