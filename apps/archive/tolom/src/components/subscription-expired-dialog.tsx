"use client";

import {
  AlertTriangle,
  Building2,
  Copy,
  Landmark,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Typography } from "@/components/ui/typography";
import { reportServerError } from "@/lib/sentry-report-server";
import type { SubscriptionStatus } from "@/lib/types";

interface BankOption {
  id: string;
  label: string;
  account: string;
}

function KhanbankLogo() {
  return (
    <Image
      src="/khanbank-logo.png"
      alt="Khanbank"
      width={20}
      height={20}
      className="size-5 shrink-0 rounded"
    />
  );
}

function TdbLogo() {
  return (
    <Image
      src="/tdb-logo.png"
      alt="TDB"
      width={20}
      height={20}
      className="size-5 shrink-0 rounded"
    />
  );
}

const BANKS: BankOption[] = [
  { id: "khanbank", label: "Khanbank", account: "MN110005005431666225" },
  { id: "tdb", label: "TDB", account: "MN960004000423063343" },
];

interface Props {
  orgId: string;
  orgName: string;
  subscriptionStatus: SubscriptionStatus;
}

export function SubscriptionExpiredDialog({
  orgId,
  orgName,
  subscriptionStatus,
}: Props) {
  const t = useTranslations("subscription");
  const appT = useTranslations("app");
  const [status] = useState<SubscriptionStatus>(subscriptionStatus);
  const [selectedBank, setSelectedBank] = useState<BankOption>(BANKS[0]);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
  const [renewed, setRenewed] = useState(false);
  const [startedTrial, setStartedTrial] = useState(false);

  if (!status.expired) return null;

  const isNewSubscription = status.status === "none";
  const graceEnd = status.grace_period_end
    ? new Date(status.grace_period_end).toLocaleDateString()
    : null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("copied"));
  };

  const currentBank = BANKS.find((b) => b.id === selectedBank.id) ?? BANKS[0];

  const handleStartTrial = async () => {
    setRenewing(true);
    setRenewError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start-trial" }),
      });
      const body = await res.json();
      if (!res.ok)
        throw new Error(body.error?.message ?? "Failed to start trial");
      setStartedTrial(true);
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      reportServerError("Unexpected error", e);
      const message = e instanceof Error ? e.message : "Something went wrong";
      setRenewError(message);
      toast.error(message);
    } finally {
      setRenewing(false);
    }
  };

  const handleRenew = async () => {
    setRenewing(true);
    setRenewError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "renew" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? "Renewal failed");
      setRenewed(true);
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      reportServerError("Unexpected error", e);
      const message = e instanceof Error ? e.message : "Something went wrong";
      setRenewError(message);
      toast.error(message);
    } finally {
      setRenewing(false);
    }
  };

  const dialogContent = (children: React.ReactNode) => (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
        {children}
      </DialogContent>
    </Dialog>
  );

  // ── Trial started success state ──
  if (startedTrial) {
    return dialogContent(
      <Card className="w-full max-w-md border-0 ">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-xl text-emerald-600">
            {t("trialStartedTitle")}
          </CardTitle>
          <CardDescription>{t("trialStartedDescription")}</CardDescription>
        </CardHeader>
      </Card>,
    );
  }

  // ── Renewed (bank transfer claimed) success state ──
  if (renewed) {
    return dialogContent(
      <Card className="w-full max-w-md border-0 ">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-xl text-emerald-600">
            {t("renewedTitle")}
          </CardTitle>
          <CardDescription>{t("renewedDescription")}</CardDescription>
        </CardHeader>
      </Card>,
    );
  }

  // ── NEW subscription: "Start 14-Day Free Trial" ──
  if (isNewSubscription) {
    return dialogContent(
      <Card className="w-full max-w-md border-0 ">
        <CardHeader className="items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
            <Sparkles className="size-7 text-primary" />
          </div>
          <CardTitle className="text-xl">{t("welcomeTitle")}</CardTitle>
          <CardDescription className="text-balance">
            {t("welcomeDescription")}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-center text-sm">
            <span className="text-muted-foreground">{t("trialLength")}</span>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-3 pb-6">
          {renewError && (
            <Typography.Text className="text-center text-xs font-medium text-destructive">
              {renewError}
            </Typography.Text>
          )}
          <Button
            variant="default"
            className="w-full"
            onClick={handleStartTrial}
            disabled={renewing}
          >
            {renewing ? <Spinner /> : <Sparkles className="size-4" />}
            {t("startTrialButton")}
          </Button>
          <Typography.Muted className="text-xs text-muted-foreground/60">
            {appT("name")} &middot; {appT("tagline")}
          </Typography.Muted>
        </CardFooter>
      </Card>,
    );
  }

  // ── EXPIRED (previously had trial/subscription) → Bank transfer CTA ──
  return dialogContent(
    <Card className="w-full max-w-lg border-0  border-destructive/20">
      <CardHeader className="items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center justify-self-center rounded-xl bg-destructive/10 shadow-sm">
          <AlertTriangle className="size-7 text-destructive" />
        </div>

        <CardTitle className="text-xl">{t("expiredTitle")}</CardTitle>
        <CardDescription className="text-balance">
          {t("expiredDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {graceEnd && (
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-center text-sm">
            <span className="text-muted-foreground">{t("graceEnds")}</span>
            <span className="ml-1 font-medium">{graceEnd}</span>
          </div>
        )}

        <div className="rounded-lg border border-destructive/20 bg-destructive/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-destructive">
            <Landmark className="size-4" />
            {t("bankTransfer")}
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t("selectBank")}
              </label>
              <ToggleGroup
                value={[selectedBank.id]}
                onValueChange={(vals) => {
                  const val = vals[0];
                  if (!val) {
                    setSelectedBank(selectedBank);
                    return;
                  }
                  const bank = BANKS.find((b) => b.id === val);
                  if (bank) setSelectedBank(bank);
                  else setSelectedBank(selectedBank);
                }}
                className="w-full"
              >
                {BANKS.map((bank) => (
                  <ToggleGroupItem
                    key={bank.id}
                    value={bank.id}
                    className="flex-1 gap-1.5"
                  >
                    {bank.id === "khanbank" ? <KhanbankLogo /> : <TdbLogo />}
                    {bank.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="rounded-lg border bg-background">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("account")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold tracking-wider">
                    {currentBank.account}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleCopy(currentBank.account)}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("description")}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-medium truncate max-w-[180px]">
                    <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                    {orgName}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleCopy(orgName)}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
            {t("instruction")}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3 pb-6">
        {renewError && (
          <Typography.Text className="text-center text-xs font-medium text-destructive">
            {renewError}
          </Typography.Text>
        )}
        <Button
          variant="default"
          className="w-full"
          onClick={handleRenew}
          disabled={renewing}
        >
          {renewing ? <Spinner /> : <Landmark className="size-4" />}
          {t("renewButton")}
        </Button>
        <Typography.Muted className="text-balance text-center text-xs leading-relaxed text-muted-foreground">
          {t("afterPayment")}
        </Typography.Muted>
        <Typography.Muted className="text-xs text-muted-foreground/60">
          {appT("name")} &middot; {appT("tagline")}
        </Typography.Muted>
      </CardFooter>
    </Card>,
  );
}
