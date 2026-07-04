import {
  findTransferBankById,
  type ResolvedTransferBank,
} from "@/lib/payments/org-bank-accounts";
import { formatMNT } from "@/lib/utils";

/**
 * Create invoice (if needed) and record full payment when marking ready.
 * Client-side helper — calls API routes via fetch.
 */
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