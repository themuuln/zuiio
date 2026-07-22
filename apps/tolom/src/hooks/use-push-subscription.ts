"use client";

import { capture } from "@zuiio/capture";
import { useCallback, useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────

interface UsePushSubscriptionReturn {
  /** Whether the browser supports push notifications */
  isSupported: boolean;
  /** Current permission state */
  permission: NotificationPermission;
  /** Whether we have an active subscription */
  isSubscribed: boolean;
  /** Whether a subscription/unsubscription is in progress */
  isLoading: boolean;
  /** Request permission and subscribe to push */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
}

// ── Helpers ────────────────────────────────────────────────────

function urlBase64ToBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }
  return bytes.buffer;
}

// ── Hook ───────────────────────────────────────────────────────

export function usePushSubscription(): UsePushSubscriptionReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check support and existing subscription on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    // Check for existing subscription
    (async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription =
          await registration.pushManager.getSubscription();
        setIsSubscribed(!!existingSubscription);
      } catch {
        // SW not ready yet or other error — ignore silently
      }
    })();
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);

    try {
      // 1. Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") return false;

      // 2. Get VAPID public key from server
      const res = await fetch("/api/push/vapid-key");
      if (!res.ok) throw new Error(`VAPID key fetch failed: ${res.status}`);

      const { publicKey } = (await res.json()) as { publicKey: string };

      // 3. Subscribe via the PushManager
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBuffer(publicKey),
      });

      // 4. Send subscription to server
      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys) {
        throw new Error("Invalid subscription shape");
      }

      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      if (!saveRes.ok) {
        throw new Error(`Subscription save failed: ${saveRes.status}`);
      }

      setIsSubscribed(true);
      return true;
    } catch (error) {
      capture(error, { context: "push_subscribe" });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        return true;
      }

      const endpoint = subscription.endpoint;

      // 1. Unsubscribe from the browser
      await subscription.unsubscribe();

      // 2. Remove from server
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      setIsSubscribed(false);
      return true;
    } catch (error) {
      capture(error, { context: "push_unsubscribe" });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
