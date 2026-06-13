"use client";

import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatMNT } from "@/lib/utils";

interface RefundReceiptProps {
  refund: {
    id: string;
    amount: number;
    method: string;
    reason: string | null;
    reference: string | null;
    notes: string | null;
    refunded_at: string;
  };
  invoice: {
    invoice_number: string;
    total: number;
    customer_name: string | null;
  };
  orgName: string;
}

export function RefundReceipt({
  refund,
  invoice,
  orgName,
}: RefundReceiptProps) {
  const t = useTranslations();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Refund Receipt - ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .org-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .title { font-size: 14px; color: #666; }
            .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .label { color: #666; }
            .value { font-weight: 500; }
            .total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #999; }
            .status { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #dcfce7; color: #166534; font-size: 12px; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: t("payment.cash"),
      card: t("payment.card"),
      bank_transfer: t("payment.bankTransfer"),
      store_credit: t("invoice.storeCredit"),
    };
    return labels[method] ?? method;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="size-4 mr-2" />
          {t("common.print")}
        </Button>
      </div>

      <div ref={printRef} className="border rounded-lg p-6 bg-white text-black">
        <div className="header">
          <div className="org-name">{orgName}</div>
          <div className="title">{t("refund.receiptTitle")}</div>
        </div>

        <div className="divider" />

        <div className="row">
          <span className="label">{t("common.invoiceNumber")}</span>
          <span className="value">#{invoice.invoice_number}</span>
        </div>

        <div className="row">
          <span className="label">{t("common.customer")}</span>
          <span className="value">{invoice.customer_name ?? "—"}</span>
        </div>

        <div className="row">
          <span className="label">{t("refund.receiptDate")}</span>
          <span className="value">
            {new Date(refund.refunded_at).toLocaleDateString()}
          </span>
        </div>

        <div className="row">
          <span className="label">{t("refund.receiptNumber")}</span>
          <span className="value">
            REF-{refund.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        <div className="divider" />

        <div className="row">
          <span className="label">{t("invoice.refundMethod")}</span>
          <span className="value">{getMethodLabel(refund.method)}</span>
        </div>

        {refund.reason && (
          <div className="row">
            <span className="label">{t("invoice.refundReason")}</span>
            <span className="value">{refund.reason}</span>
          </div>
        )}

        {refund.reference && (
          <div className="row">
            <span className="label">{t("invoice.refundReference")}</span>
            <span className="value">{refund.reference}</span>
          </div>
        )}

        {refund.notes && (
          <div className="row">
            <span className="label">{t("common.notes")}</span>
            <span className="value">{refund.notes}</span>
          </div>
        )}

        <div className="divider" />

        <div className="row total">
          <span>{t("refund.refundAmount")}</span>
          <span>{formatMNT(Number(refund.amount))}</span>
        </div>

        <div className="footer">
          <span className="status">{t("refund.statusCompleted")}</span>
          <p style={{ marginTop: "10px" }}>{t("refund.receiptFooter")}</p>
        </div>
      </div>
    </div>
  );
}
