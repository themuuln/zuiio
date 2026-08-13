"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OfflineIndicator } from "@/components/pos/offline-indicator";
import type { PosCategory } from "@/components/pos/pos-product-grid";
import {
  type PosOpenSession,
  PosRegister,
} from "@/components/pos/pos-register";
import type { PosProduct } from "@/lib/pos";

/**
 * Dedicated POS terminal (kiosk) — the register rendered fullscreen,
 * outside the dashboard chrome, for a shop floor machine.
 *
 * Terminal extras on top of the plain register:
 *  - Chrome-less fullscreen shell (no sidebar, no page header).
 *  - Live clock + org name in a slim top bar (the register itself stays
 *    the whole focus).
 *  - Screen wake lock: a terminal left alone must not fall asleep or dim.
 *  - Barcode scanning works with zero focus (the wedge hook listens on
 *    window), so a scanner can drive the whole sale.
 *
 * Hardware behavior is inherited from the org settings via props
 * (hasCashDrawer / escposEnabled on PosRegister).
 */
export function PosTerminal({
  organizationName,
  products,
  categories,
  openSession,
  hardware,
}: {
  organizationName: string;
  products: PosProduct[];
  categories: PosCategory[];
  openSession: PosOpenSession | null;
  hardware: {
    hasReceiptPrinter: boolean;
    hasCashDrawer: boolean;
    escposEnabled: boolean;
  };
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Keep the terminal screen awake. No-op when the API is unavailable
  // (older Safari, test env) — never an error.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }
    let released = false;
    let lock: { release: () => Promise<void> } | null = null;

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        lock = null;
      }
    };
    const release = () => {
      if (lock) {
        void lock.release().catch(() => {});
        lock = null;
      }
    };

    void acquire();
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !released) {
        release();
        void acquire();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      released = true;
      release();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <Link
          href="/pos"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Касс руу буцах"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="truncate text-sm font-semibold">
          {organizationName}
        </span>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Терминал
        </span>
        <div className="ml-auto flex items-center gap-3">
          <OfflineIndicator />
          <time
            className="tabular-nums text-sm text-muted-foreground"
            dateTime={now.toISOString()}
          >
            {now.toLocaleTimeString("mn-MN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
      </header>
      <main className="min-h-0 flex-1">
        <PosRegister
          products={products}
          categories={categories}
          openSession={openSession}
          hasReceiptPrinter={hardware.hasReceiptPrinter}
          hasCashDrawer={hardware.hasCashDrawer}
          escposEnabled={hardware.escposEnabled}
        />
      </main>
    </div>
  );
}
