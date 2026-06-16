"use client";

import { ShareNetwork } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { createInvoiceShareLink } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  paid: "Төлөгдсөн",
  partially_paid: "Хэсэгчилсэн",
  overdue: "Хугацаа хэтэрсэн",
  cancelled: "Цуцлагдсан",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  paid: "default",
  partially_paid: "outline",
  overdue: "destructive",
  cancelled: "outline",
};

export function InvoiceDetailClient({
  invoiceId,
  token,
  status,
}: {
  invoiceId: string;
  token: string | null;
  status: string;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareResult, setShareResult] = useState<{
    token?: string;
    error?: string;
  } | null>(token ? { token } : null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const shareUrl =
    shareResult?.token && !shareResult?.error
      ? `${window.location.origin}/r/invoice/${shareResult.token}`
      : null;

  async function handleGenerateShareLink() {
    setPending(true);
    const formData = new FormData();
    formData.append("invoice_id", invoiceId);
    const result = await createInvoiceShareLink(undefined, formData);
    setPending(false);
    setShareResult(result);
  }

  function handleCopy() {
    if (inputRef.current) {
      inputRef.current.select();
      navigator.clipboard.writeText(inputRef.current.value).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={STATUS_VARIANTS[status] ?? "outline"}>
        {STATUS_LABELS[status] ?? status}
      </Badge>

      <Dialog
        open={shareOpen}
        onOpenChange={(next) => {
          setShareOpen(next);
          if (next && token && !shareResult)
            setShareResult({ token });
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" type="button">
            <ShareNetwork data-icon="inline-start" />
            Хуваалцах
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Нэхэмжлэл хуваалцах</DialogTitle>
            <DialogDescription>
              Холбоос үүсгэж, хэн ч нэвтрэхгүйгээр үзэх боломжтой.
            </DialogDescription>
          </DialogHeader>
          {shareUrl ? (
            <div className="flex flex-col gap-4">
              <Label htmlFor="share-url">Холбоос</Label>
              <div className="flex gap-2">
                <Input
                  id="share-url"
                  ref={inputRef}
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? "Хуулав!" : "Хуулах"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {shareResult?.error && (
                <p className="text-sm text-destructive">
                  {shareResult.error}
                </p>
              )}
              <Button onClick={handleGenerateShareLink} disabled={pending}>
                {pending ? "Үүсгэж байна..." : "Холбоос үүсгэх"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
