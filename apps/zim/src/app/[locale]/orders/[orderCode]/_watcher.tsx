"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/**
 * While the order is provisioning, refresh the page every few seconds
 * so async (webhook) delivery appears without a manual reload.
 */
export function ProvisioningWatcher({ orderCode }: { orderCode: string }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payments/status?code=${encodeURIComponent(orderCode)}`,
        );
        if (res.ok) {
          const data = (await res.json()) as { status: string };
          if (!["paid", "provisioning"].includes(data.status)) {
            router.refresh();
          }
        }
      } catch {
        // retry next tick
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [orderCode, router]);

  return null;
}
