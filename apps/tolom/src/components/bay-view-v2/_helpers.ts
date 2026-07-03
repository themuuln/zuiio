import {
  findTransferBankById,
  type ResolvedTransferBank,
} from "@/lib/payments/org-bank-accounts";
import { formatMNT } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────

/** Elapsed minutes since a timestamp */
export function elapsedMinutes(
  startedAt: string | null | undefined,
): number | null {
  if (!startedAt) return null;
  const ms = Date.now() - new Date(startedAt).getTime();
  const mins = Math.round(ms / 60_000);
  return mins >= 0 ? mins : null;
}

export function computeNextDueDate(months: number | null): string | null {
  if (!months) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export function computeNextDueKm(
  km: number | null,
  odometer: number | null,
): number | null {
  if (!km || !odometer) return null;
  return odometer + km;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatKm(km: number): string {
  return km.toLocaleString("en-US");
}

/** Create invoice (if needed) and record full payment when marking ready. */
export async function createInvoiceAndRecordPayment(
  orgId: string,
  workOrderId: string,
  method: string,
  feePercent = 0,
  transferBanks: ResolvedTransferBank[] = [],
  transferBankId?: string | null,
): Promise<void> {
  const invRes = await fetch(`/api/organizations/${orgId}/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ work_order_id: workOrderId }),
  });
  const invJson = await invRes.json();
  if (invJson.error) {
    throw new Error(invJson.error.message ?? "Failed to create invoice");
  }

  const invoice = invJson.data as {
    id: string;
    balance_due?: number;
    total?: number;
  };
  const balanceDue = Number(invoice.balance_due ?? invoice.total ?? 0);
  if (balanceDue <= 0) return;

  const feeAmount =
    feePercent > 0 ? Math.round((balanceDue * feePercent) / 100) : 0;
  const paymentAmount = balanceDue + feeAmount;

  const transferBank =
    method === "bank_transfer"
      ? findTransferBankById(transferBanks, transferBankId)
      : null;

  const noteParts: string[] = [];
  if (feeAmount > 0) {
    noteParts.push(`Processing fee (${feePercent}%): ${formatMNT(feeAmount)}`);
  }
  if (transferBank) {
    noteParts.push(
      `${transferBank.nameEn} — ${transferBank.accountNumber}${
        transferBank.accountHolder ? ` (${transferBank.accountHolder})` : ""
      }`,
    );
  }
  const notes = noteParts.length > 0 ? noteParts.join(" · ") : undefined;
  const reference = transferBank?.accountNumber ?? undefined;

  const payRes = await fetch(
    `/api/organizations/${orgId}/invoices/${invoice.id}/payments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: paymentAmount,
        method,
        notes,
        reference,
      }),
    },
  );
  const payJson = await payRes.json();
  if (!payRes.ok || payJson.error) {
    throw new Error(payJson.error?.message ?? "Failed to record payment");
  }
}
