"use client";

import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  onClose: () => void;
}

export function PinSettingsDialog({ onClose }: Props) {
  const t = useTranslations("bayView");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const currentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    currentRef.current?.focus();
  }, []);

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
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-rose-500" />
            {t("bayPinSettings")}
          </DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex items-center justify-center size-12 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-center">{t("pinUpdated")}</p>
            <Button onClick={onClose} size="default">
              {t("done")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2.5 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {t("currentPin")}
              </label>
              <input
                ref={currentRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,6}"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder={t("enterCurrentPin")}
                required
                disabled={saving}
                maxLength={6}
                className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {t("newPin")}
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,6}"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder={t("enterDigits")}
                required
                disabled={saving}
                maxLength={6}
                className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {t("confirmNewPin")}
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,6}"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder={t("repeatNewPin")}
                required
                disabled={saving}
                maxLength={6}
                className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
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
