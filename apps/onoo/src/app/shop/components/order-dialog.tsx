"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrDisplay } from "./qr-display";

const formSchema = z.object({
  customerName: z.string().trim().min(1, "Нэрээ оруулна уу"),
  phone: z
    .string()
    .trim()
    .min(1, "Утасны дугаараа оруулна уу")
    .regex(/^\d{8}$/, "Утасны дугаар 8 оронтой байх ёстой"),
});

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variantIndex: number;
  priceMnt: number;
  productName: string;
  variantSize: string;
}

interface OrderResult {
  orderId: string;
  totalMnt: number;
  qrImage: string;
  qrText: string;
  merchantInvoiceId: string;
  expiresIn: number;
}

export function OrderDialog({
  open,
  onOpenChange,
  productId,
  variantIndex,
  priceMnt,
  productName,
  variantSize,
}: OrderDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  async function handleSubmit() {
    const parsed = formSchema.safeParse({ customerName: name, phone });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantIndex,
          customerName: name.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Захиалга үүсгэхэд алдаа гарлаа");
        return;
      }
      setOrderResult(data);
    } catch {
      toast.error("Сүлжээний алдаа. Дахиж оролдоно уу.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOrderResult(null);
    setName("");
    setPhone("");
    setErrors({});
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Захиалга баталгаажуулах</DialogTitle>
        </DialogHeader>

        {orderResult ? (
          <QrDisplay
            qrImage={orderResult.qrImage}
            qrText={orderResult.qrText}
            merchantInvoiceId={orderResult.merchantInvoiceId}
            expiresIn={orderResult.expiresIn}
            totalMnt={orderResult.totalMnt}
            onClose={handleClose}
          />
        ) : (
          <div className="space-y-4">
            {/* Order recap */}
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-sports)]/10">
                    <ShoppingBag className="h-5 w-5 text-[var(--brand-sports)]" />
                  </div>
                  <div>
                    <p className="font-medium">{productName}</p>
                    <p className="text-xs text-muted-foreground">
                      Хэмжээ: {variantSize}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 font-display text-lg font-bold text-[var(--brand-sports)]">
                  ₮{priceMnt.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="order-name">Нэр</Label>
                <Input
                  id="order-name"
                  placeholder="Таны нэр"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.customerName && (
                  <p className="text-sm text-destructive">
                    {errors.customerName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-phone">Утас</Label>
                <Input
                  id="order-phone"
                  placeholder="9999-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>

            <p className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Нийт дүн</span>
              <span className="font-semibold">
                ₮{priceMnt.toLocaleString()}
              </span>
            </p>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Түр хүлээнэ үү..." : "QPay-гаар төлөх"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
