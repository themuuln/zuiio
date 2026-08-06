"use client";

import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { OrderStatus } from "@/lib/supabase/types";

interface StatusResponse {
  status: OrderStatus;
  token: string | null;
}

export function PayPanel({
  orderCode,
  initialStatus,
  expiresAt,
  qrImage,
  qrText,
  shortUrl,
  isMockInvoice,
}: {
  orderCode: string;
  initialStatus: OrderStatus;
  expiresAt: string;
  qrImage: string | null;
  qrText: string | null;
  shortUrl: string | null;
  isMockInvoice: boolean;
}) {
  const t = useTranslations("pay");
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const redirected = useRef(false);

  const handleResponse = useCallback(
    (data: StatusResponse) => {
      setStatus(data.status);
      if (data.token && !redirected.current) {
        redirected.current = true;
        router.push(`/orders/${orderCode}?t=${data.token}`);
      }
    },
    [orderCode, router],
  );

  useEffect(() => {
    if (status !== "pending_payment") return;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/payments/status?code=${encodeURIComponent(orderCode)}`,
        );
        if (res.ok) handleResponse((await res.json()) as StatusResponse);
      } catch {
        // network hiccup — next tick retries
      }
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [status, orderCode, handleResponse]);

  useEffect(() => {
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setMinutesLeft(Math.max(0, Math.ceil(ms / 60_000)));
    };
    tick();
    const interval = setInterval(tick, 15_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const mockPay = async () => {
    const res = await fetch("/api/payments/mock-pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: orderCode }),
    });
    if (res.ok) {
      const statusRes = await fetch(
        `/api/payments/status?code=${encodeURIComponent(orderCode)}`,
      );
      if (statusRes.ok) {
        handleResponse((await statusRes.json()) as StatusResponse);
      }
    }
  };

  if (status === "expired") {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-center text-destructive">
        {t("expired")}
      </p>
    );
  }

  if (status !== "pending_payment") {
    return (
      <p className="rounded-lg border border-green-600/40 bg-green-600/10 p-4 text-center font-medium text-green-700">
        ✓ {t("paid")}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-center text-muted-foreground">{t("scanQr")}</p>

      <div className="rounded-xl border bg-white p-4">
        {qrImage ? (
          <img
            src={`data:image/png;base64,${qrImage}`}
            alt="QPay QR"
            width={240}
            height={240}
          />
        ) : qrText ? (
          <QRCodeSVG value={qrText} size={240} />
        ) : null}
      </div>

      {shortUrl && (
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href={shortUrl} target="_blank" rel="noreferrer" />}
        >
          {t("openBankApp")}
        </Button>
      )}

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-block size-2 animate-pulse rounded-full bg-amber-500" />
        {t("waiting")}
        {minutesLeft !== null &&
          ` · ${t("expiresIn", { minutes: minutesLeft })}`}
      </p>

      {isMockInvoice && (
        <Button variant="secondary" onClick={mockPay}>
          {t("mockPay")}
        </Button>
      )}
    </div>
  );
}
