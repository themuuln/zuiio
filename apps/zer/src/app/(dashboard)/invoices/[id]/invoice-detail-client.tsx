"use client";

import { ArrowsClockwise, Prohibit, ShareNetwork } from "@phosphor-icons/react";
import { useRef, useState } from "react";
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
import {
  createInvoiceShareLink,
  revokeInvoiceShareLink,
  rotateInvoiceShareLink,
} from "../actions";

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
  tokenHash,
  expiresAt,
  revokedAt,
  status,
}: {
  invoiceId: string;
  tokenHash: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  status: string;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareResult, setShareResult] = useState<{
    token?: string;
    error?: string;
    success?: boolean;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasExistingLink = !!tokenHash && !revokedAt;
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  const isRevoked = !!revokedAt;

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

  async function handleRotateLink() {
    setPending(true);
    const formData = new FormData();
    formData.append("invoice_id", invoiceId);
    const result = await rotateInvoiceShareLink(undefined, formData);
    setPending(false);
    setShareResult(result);
  }

  async function handleRevokeLink() {
    setPending(true);
    const formData = new FormData();
    formData.append("invoice_id", invoiceId);
    const result = await revokeInvoiceShareLink(undefined, formData);
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

  function formatExpiry(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
          if (next) setShareResult(null);
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

          {/* Show newly created URL — one-time display */}
          {shareUrl ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                Энэ холбоосыг дахин харах боломжгүй. Хуулж хадгална уу.
              </div>
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
          ) : hasExistingLink ? (
            /* Show existing link management */
            <div className="flex flex-col gap-4">
              {expiresAt && (
                <p className="text-sm text-muted-foreground">
                  {isExpired
                    ? `Хугацаа дууссан: ${formatExpiry(expiresAt)}`
                    : `Хүчинтэй хугацаа: ${formatExpiry(expiresAt)} хүртэл`}
                </p>
              )}
              {isRevoked && (
                <p className="text-sm text-destructive">Цуцлагдсан</p>
              )}
              {shareResult?.error && (
                <p className="text-sm text-destructive">{shareResult.error}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotateLink}
                  disabled={pending}
                  className="gap-1"
                >
                  <ArrowsClockwise className="size-3.5" />
                  {pending ? "Шинэчлэж байна..." : "Шинэчлэх"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRevokeLink}
                  disabled={pending}
                  className="gap-1"
                >
                  <Prohibit className="size-3.5" />
                  Цуцлах
                </Button>
              </div>
            </div>
          ) : (
            /* No link exists — show create button */
            <div className="flex flex-col gap-4">
              {shareResult?.error && (
                <p className="text-sm text-destructive">{shareResult.error}</p>
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
