import { capture } from "@zuiio/capture";

/**
 * Client-side seam for the ESC/POS bridge. The register calls this after a
 * completed sale; the server route resolves the org's printer config,
 * builds the bytes, and sends them over raw TCP. Hardware failures are
 * captured but never surfaced to the cashier — a dead printer must not
 * block the next sale (the CSS-print fallback remains for receipts).
 */
export async function sendEscPosCommand(
  command: "print" | "drawer",
  saleId?: string,
): Promise<void> {
  try {
    const res = await fetch("/api/hardware/escpos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        command === "print" ? { command, sale_id: saleId } : { command },
      ),
    });
    if (!res.ok) {
      // 400 = printer not configured; 502 = unreachable — both are
      // operational states, logged for the staff dashboard, not errors
      // the cashier can fix mid-sale.
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      capture(
        new Error(body?.error ?? `escpos ${command} failed: ${res.status}`),
        {
          context: "hardware: escpos bridge",
        },
      );
    }
  } catch (err) {
    capture(err, { context: "hardware: escpos fetch" });
  }
}
