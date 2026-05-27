"use client";

import {
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  User,
  Wrench,
} from "lucide-react";
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

export function MechanicRegistrationDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("bayView");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    nameRef.current?.focus();
  }, [open]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setEmail("");
      setFullName("");
      setPhone("");
      setSaving(false);
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { registerMechanic } = await import(
        "@/lib/services/bay-view-actions"
      );
      await registerMechanic({
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to register mechanic",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wrench className="size-4 text-purple-500" />
            {t("registerMechanicBtn")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("registerMechanicDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className=" bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2.5 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className=" bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-2.5 text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{t("mechanicRegistered", { name: fullName })}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("fullName")}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={nameRef}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("namePlaceholder")}
                required
                disabled={success}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("email")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                disabled={success}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("phone")}{" "}
              <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("phonePlaceholder")}
                disabled={success}
                className="pl-10"
              />
            </div>
          </div>

          {!success && (
            <Button
              type="submit"
              className="w-full"
              disabled={saving || !email.trim() || !fullName.trim()}
              size="default"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <User className="size-4" />
              )}
              {saving ? t("registering") : t("registerMechanicBtn")}
            </Button>
          )}

          {success && (
            <Button
              type="button"
              className="w-full"
              onClick={() => onOpenChange(false)}
              size="default"
            >
              <CheckCircle2 className="size-4" />
              {t("done")}
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
