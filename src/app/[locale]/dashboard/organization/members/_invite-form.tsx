"use client";

import { Loader2, MailPlus, X } from "lucide-react";
import type { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InviteFormProps {
  email: string;
  onEmailChange: (v: string) => void;
  sending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslations<"organization.members">>;
}

export function InviteForm({
  email,
  onEmailChange,
  sending,
  onSubmit,
  onClose,
  t,
}: InviteFormProps) {
  return (
    <Card className="border-primary/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{t("inviteNew")}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label
              htmlFor="inviteEmail"
              className="text-sm font-medium text-foreground"
            >
              {t("emailLabel")}
            </label>
            <input
              id="inviteEmail"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder={t("emailPlaceholder")}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <Button type="submit" disabled={sending || !email.trim()}>
            {sending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <MailPlus className="mr-2 size-4" />
            )}
            {t("sendInvite")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
