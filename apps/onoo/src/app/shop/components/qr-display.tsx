"use client";

import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrDisplayProps {
  qrImage: string;
  qrText: string;
  merchantInvoiceId: string;
  expiresIn: number;
  totalMnt: number;
  onClose: () => void;
}

export function QrDisplay({
  qrImage,
  qrText,
  merchantInvoiceId,
  expiresIn,
  totalMnt,
  onClose,
}: QrDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium">QPay-аар төлөх</p>
          <p className="text-muted-foreground">
            Доорх QR кодыг QPay апп-аар уншуулж, ₮
            {totalMnt.toLocaleString()} төлбөрийг төлнө үү. QR код{" "}
            {Math.floor(expiresIn / 60)} минутын дотор хүчингүй болно.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white p-2">
        <img
          src={qrImage}
          alt="QPay QR код"
          className="h-64 w-64 object-contain"
        />
      </div>

      <p className="max-w-sm break-all text-center text-xs text-muted-foreground">
        {qrText}
      </p>

      <p className="text-sm text-muted-foreground">
        Захиалга: {merchantInvoiceId}
      </p>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>
          Хаах
        </Button>
      </div>
    </div>
  );
}

export function PaymentSuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full gap-2 rounded-lg border border-green-500/30 bg-green-50 p-3 text-sm dark:bg-green-950/20">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
        <div>
          <p className="font-medium">Төлбөр төлөгдсөн</p>
          <p className="text-muted-foreground">
            Таны төлбөр амжилттай төлөгдлөө. Захиалга баталгаажсан.
          </p>
        </div>
      </div>
      <Button onClick={onClose}>Хаах</Button>
    </div>
  );
}

export function PaymentErrorView({
  message,
  onRetry,
  onClose,
}: {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div>
          <p className="font-medium">Төлбөр амжилтгүй</p>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>
          Хаах
        </Button>
        <Button onClick={onRetry}>Дахин оролдох</Button>
      </div>
    </div>
  );
}
