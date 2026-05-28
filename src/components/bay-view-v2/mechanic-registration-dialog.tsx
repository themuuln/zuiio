"use client";

import { Mail, Phone, User, Wrench } from "lucide-react";
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
  onRegistered: (email: string, fullName: string, phone?: string) => void;
}

export function MechanicRegistrationDialog({
  open,
  onOpenChange,
  onRegistered,
}: Props) {
  const t = useTranslations("bayView");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

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
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    // Optimistic: close immediately and hand off to parent
    onRegistered(email.trim(), fullName.trim(), phone.trim() || undefined);
    onOpenChange(false);
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
                className="pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!email.trim() || !fullName.trim()}
            size="default"
          >
            <User className="size-4" />
            {t("registerMechanicBtn")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
