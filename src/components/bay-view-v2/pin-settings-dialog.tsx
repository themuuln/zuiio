"use client";

import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PinSettingsDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("bayView");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const currentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    currentRef.current?.focus();
  }, [open]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setSaving(false);
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPin || !newPin || !confirmPin) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { updateBayViewPin } = await import(
        "@/lib/services/bay-view-service"
      );
      await updateBayViewPin(currentPin, newPin, confirmPin);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update PIN");
    } finally {
      setSaving(false);
    }
  };

  const isValid = /^[0-9]{4,6}$/.test(newPin) && newPin === confirmPin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4 text-rose-500" />
            {t("bayPinSettings")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("bayPinSettings")}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex items-center justify-center size-12  bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-center">{t("pinUpdated")}</p>
            <Button onClick={() => onOpenChange(false)} size="default">
              {t("done")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className=" bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2.5 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("currentPin")}
              </Label>
              <Input
                ref={currentRef}
                type="password"
                inputMode="numeric"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder={t("enterCurrentPin")}
                required
                disabled={saving}
                maxLength={6}
                className="font-mono tracking-widest"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("newPin")}
              </Label>
              <Input
                type="password"
                inputMode="numeric"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder={t("enterDigits")}
                required
                disabled={saving}
                maxLength={6}
                className="font-mono tracking-widest"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("confirmNewPin")}
              </Label>
              <Input
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder={t("repeatNewPin")}
                required
                disabled={saving}
                maxLength={6}
                className="font-mono tracking-widest"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={saving || !isValid}
              size="default"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              {saving ? t("updating") : t("updatePin")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
