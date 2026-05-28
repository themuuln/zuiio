"use client";

import { Loader2, Mail, Phone, User, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Typography } from "@/components/ui/typography";

interface Props {
  onClose: () => void;
  onRegistered?: (email: string, fullName: string, phone?: string) => void;
}

export function MechanicRegistrationDialog({ onClose, onRegistered }: Props) {
  const t = useTranslations("bayView");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    if (onRegistered) {
      // Optimistic: close immediately and hand off to parent
      onRegistered(email.trim(), fullName.trim(), phone.trim() || undefined);
      onClose();
      return;
    }

    // Fallback: dialog handles the server call itself
    setSaving(true);
    setError(null);

    try {
      const { registerMechanic } = await import(
        "@/lib/services/bay-view-actions"
      );
      await registerMechanic({
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      toast.success(t("mechanicRegistered", { name: fullName.trim() }));
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to register mechanic",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-purple-500/10 shrink-0">
              <Wrench className="size-5 text-purple-500" />
            </div>
            <div>
              <Typography.H2 className="text-lg font-semibold">
                {t("registerMechanicBtn")}
              </Typography.H2>
              <Typography.Muted className="text-xs text-muted-foreground font-normal">
                {t("registerMechanicDesc")}
              </Typography.Muted>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t("fullName")}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                ref={nameRef}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("namePlaceholder")}
                required
                className="w-full h-11 rounded-xl border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t("email")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                className="w-full h-11 rounded-xl border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t("phone")}{" "}
              <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("phonePlaceholder")}
                className="w-full h-11 rounded-xl border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          {error && <Typography.Text className="text-sm text-destructive">{error}</Typography.Text>}

          <Button
            type="submit"
            className="w-full"
            disabled={!email.trim() || !fullName.trim()}
            size="default"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <User className="size-4" />
            )}
            {t("registerMechanicBtn")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
