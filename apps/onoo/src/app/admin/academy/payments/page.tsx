"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  PaymentErrorView,
  PaymentSuccessView,
  QrDisplay,
} from "@/app/shop/components/qr-display";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Дүн эерэг байх ёстой"),
  description: z.string().optional(),
});

type PaymentState =
  | { step: "form" }
  | { step: "loading" }
  | {
      step: "qr";
      qrImage: string;
      qrText: string;
      merchantInvoiceId: string;
      expiresIn: number;
      totalMnt: number;
    }
  | { step: "checking" }
  | { step: "success" }
  | { step: "error"; message: string };

export default function AcademyPaymentsPage() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<PaymentState>({ step: "form" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = paymentSchema.safeParse({ amount, description });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Өгөгдөл буруу байна");
      return;
    }

    setState({ step: "loading" });

    try {
      const res = await fetch("/admin/api/academy/payments", {
        method: "POST",
        body: JSON.stringify({
          amount: parsed.data.amount,
          description: parsed.data.description || "Академийн төлбөр",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Алдаа гарлаа" }));
        throw new Error(err.error ?? "Төлбөр үүсгэхэд алдаа гарлаа");
      }

      const invoice = await res.json();
      setState({
        step: "qr",
        qrImage: invoice.qr_image,
        qrText: invoice.qr_text,
        merchantInvoiceId: invoice.merchant_invoice_id,
        expiresIn: invoice.expires_in,
        totalMnt: parsed.data.amount,
      });

      // Start polling for payment
      pollPayment(invoice.invoice_id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Төлбөр үүсгэхэд алдаа гарлаа";
      setState({ step: "error", message });
    }
  }

  async function pollPayment(invoiceId: string) {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 5000);
      await promise;
      try {
        const res = await fetch(
          `/admin/api/academy/payments?invoice_id=${invoiceId}`,
        );
        if (!res.ok) continue;
        const status = await res.json();
        if (status.paid) {
          setState({ step: "success" });
          toast.success("Төлбөр төлөгдлөө!");
          return;
        }
        if (status.status === "EXPIRED") {
          setState({ step: "error", message: "Төлбөрийн хугацаа дууссан" });
          return;
        }
      } catch {
        // Retry on network error
      }
    }
    setState({
      step: "error",
      message: "Төлбөр баталгаажуулах хугацаа дууссан",
    });
  }

  function handleClose() {
    setAmount("");
    setDescription("");
    setState({ step: "form" });
  }

  function handleRetry() {
    setState({ step: "form" });
  }

  return (
    <AdminPageLayout title="Төлбөр" isEmpty={false}>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            QPay төлбөр
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Дүн (₮)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Тайлбар (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Академийн төлбөр"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full">
                QPay-р төлөх
              </Button>
            </form>
          )}

          {state.step === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <p className="text-sm text-muted-foreground">
                Төлбөр үүсгэж байна...
              </p>
            </div>
          )}

          {state.step === "qr" && (
            <QrDisplay
              qrImage={state.qrImage}
              qrText={state.qrText}
              merchantInvoiceId={state.merchantInvoiceId}
              expiresIn={state.expiresIn}
              totalMnt={state.totalMnt}
              onClose={handleClose}
            />
          )}

          {state.step === "checking" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <p className="text-sm text-muted-foreground">
                Төлбөр шалгаж байна...
              </p>
            </div>
          )}

          {state.step === "success" && (
            <PaymentSuccessView onClose={handleClose} />
          )}

          {state.step === "error" && (
            <PaymentErrorView
              message={state.message}
              onRetry={handleRetry}
              onClose={handleClose}
            />
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
