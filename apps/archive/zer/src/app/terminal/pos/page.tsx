import { Suspense } from "react";
import { PosTerminal } from "@/components/pos/pos-terminal";
import { loadPosRegisterData } from "@/lib/pos-server";

/**
 * /terminal/pos — dedicated POS terminal (kiosk mode).
 *
 * Same register as /pos but rendered fullscreen without the dashboard
 * chrome: sidebar, page header, and browser focus all yield to the
 * register. Intended to stay open on a shop-floor machine with a barcode
 * wedge, ESC/POS receipt printer, and cash drawer (all driven by org
 * settings + the /api/hardware/escpos bridge).
 *
 * Auth: same requireAppContext guard as the dashboard — the cashier signs
 * in once, then the terminal stays logged in.
 */
export default async function TerminalPosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center text-muted-foreground">
          Терминал ачааллаж байна…
        </div>
      }
    >
      <TerminalFetcher />
    </Suspense>
  );
}

async function TerminalFetcher() {
  const data = await loadPosRegisterData();
  return (
    <PosTerminal
      organizationName={data.organizationName}
      products={data.products}
      categories={data.categories}
      openSession={data.openSession}
      hardware={data.hardware}
    />
  );
}
