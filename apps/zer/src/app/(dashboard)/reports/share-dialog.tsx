"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShareNetwork } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { createShareLink, type ShareLinkState } from "./actions";

const shareSchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
});

type ShareValues = z.infer<typeof shareSchema>;

export function ShareDialog({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareResult, setShareResult] = useState<ShareLinkState | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue } = useForm<ShareValues>({
    resolver: zodResolver(shareSchema),
    defaultValues: {
      date_from: dateFrom,
      date_to: dateTo,
    },
  });

  // Sync form values when props change (e.g. user navigated to a new date range)
  useEffect(() => {
    setValue("date_from", dateFrom);
    setValue("date_to", dateTo);
  }, [dateFrom, dateTo, setValue]);

  // Reset share result when dialog opens so user can generate a fresh link
  useEffect(() => {
    if (open) {
      setShareResult(null);
      setCopied(false);
      setPending(false);
    }
  }, [open]);

  const shareUrl =
    shareResult?.token && !shareResult?.error
      ? `${window.location.origin}/r/${shareResult.token}`
      : null;

  const onSubmit = async (data: ShareValues) => {
    setPending(true);

    const formData = new FormData();
    formData.append("date_from", data.date_from);
    formData.append("date_to", data.date_to);

    const result = await createShareLink(undefined, formData);
    setPending(false);
    setShareResult(result);
  };

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
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <ShareNetwork data-icon="inline-start" />
            Хуваалцах
          </Button>
        }
      />
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
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <input type="hidden" {...register("date_from")} />
            <input type="hidden" {...register("date_to")} />
            {shareResult?.error ? (
              <p className="text-sm text-destructive">{shareResult.error}</p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Үүсгэж байна..." : "Холбоос үүсгэх"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
