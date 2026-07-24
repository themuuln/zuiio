"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
}: OrderDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = () => onOpenChange(false);
    el.addEventListener("close", handler);
    return () => el.removeEventListener("close", handler);
  }, [onOpenChange]);

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
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-lg border bg-background p-6 shadow-xl backdrop:bg-black/50 open:flex open:flex-col"
    >
      <h2 className="mb-4 text-lg font-semibold">Захиалга баталгаажуулах</h2>
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
          <div className="space-y-2">
            <Label htmlFor="name">Нэр</Label>
            <Input
              id="name"
              placeholder="Таны нэр"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.customerName && (
              <p className="text-sm text-destructive">{errors.customerName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Утас</Label>
            <Input
              id="phone"
              placeholder="9999-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>
          <p className="text-lg font-bold">Дүн: ₮{priceMnt.toLocaleString()}</p>
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Түр хүлээнэ үү..." : "QPay-гаар төлөх"}
          </Button>
        </div>
      )}
    </dialog>
  );
}
