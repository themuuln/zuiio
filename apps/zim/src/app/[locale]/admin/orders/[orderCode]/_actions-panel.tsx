"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/supabase/types";
import { markRefundedAction, retryProvisioningAction } from "../actions";

export function OrderActions({
  orderCode,
  status,
}: {
  orderCode: string;
  status: OrderStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmRefund, setConfirmRefund] = useState(false);

  const canRetry = ["failed", "partially_failed", "provisioning"].includes(
    status,
  );
  const canRefund = [
    "paid",
    "provisioning",
    "delivered",
    "failed",
    "partially_failed",
  ].includes(status);

  return (
    <div className="flex gap-2">
      {canRetry && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(() => retryProvisioningAction(orderCode))
          }
        >
          {pending ? "Working…" : "Retry provisioning"}
        </Button>
      )}
      {canRefund &&
        (confirmRefund ? (
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => startTransition(() => markRefundedAction(orderCode))}
          >
            Confirm refund (QPay refund is manual!)
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmRefund(true)}
          >
            Mark refunded
          </Button>
        ))}
    </div>
  );
}
