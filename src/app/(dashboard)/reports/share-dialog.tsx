"use client";

import { ShareNetwork } from "@phosphor-icons/react";
import { useActionState, useRef, useState } from "react";
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
import { createShareLink } from "./actions";

export function ShareDialog({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(
    createShareLink,
    undefined,
  );

  const shareUrl =
    state?.token && !state?.error
      ? `${window.location.origin}/r/${state.token}`
      : null;

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <ShareNetwork data-icon="inline-start" />
        Хуваалцах
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Тайлан хуваалцах</DialogTitle>
          <DialogDescription>
            Хуваалцах холбоос үүсгэж, хэн ч нэвтрэхгүйгээр тайланг үзэх
            боломжтой.
          </DialogDescription>
        </DialogHeader>

        {shareUrl ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="share-url">Хуваалцах холбоос</Label>
              <div className="flex gap-2">
                <Input
                  id="share-url"
                  ref={inputRef}
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  size="sm"
                  className="shrink-0"
                >
                  {copied ? "Хуулав!" : "Хуулах"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Энэ холбоосыг хуваалцсан хэн ч тайланг үзэх боломжтой.
            </p>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="date_from" value={dateFrom} />
            <input type="hidden" name="date_to" value={dateTo} />
            {state?.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Үүсгэж байна..." : "Холбоос үүсгэх"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
