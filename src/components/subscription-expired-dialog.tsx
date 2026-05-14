"use client";

import { AlertTriangle, Building2, Copy, Landmark, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubscriptionStatus } from "@/lib/types";

interface BankOption {
  id: string;
  label: string;
  account: string;
}

function KhanbankLogo() {
  return (
    <img
      src="/khanbank-logo.png"
      alt="Khanbank"
      className="size-5 shrink-0 rounded"
    />
  );
}

function TdbLogo() {
  return (
    <img
      src="/tdb-logo.png"
      alt="TDB"
      className="size-5 shrink-0 rounded"
    />
  );
}

const BANKS: BankOption[] = [
  {
    id: "khanbank",
    label: "Khanbank",
    account: "MN110005005431666225",
  },
  {
    id: "tdb",
    label: "TDB",
    account: "MN960004000423063343",
  },
];

interface Props {
  orgId: string;
  orgName: string;
}

export function SubscriptionExpiredDialog({ orgId, orgName }: Props) {
  const t = useTranslations("subscription");
  const appT = useTranslations("app");
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState<BankOption>(BANKS[0]);
  const [copied, setCopied] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
  const [renewed, setRenewed] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/subscription/status`,
        );
        const body = await res.json();
        if (body.data) setStatus(body.data as SubscriptionStatus);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [orgId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-primary shadow-sm">
              <Wrench className="size-7 text-primary-foreground" />
            </div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!status?.expired) return null;

  const graceEnd = status.grace_period_end
    ? new Date(status.grace_period_end).toLocaleDateString()
    : null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentBank = BANKS.find((b) => b.id === selectedBank.id) ?? BANKS[0];

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
      setRenewError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRenewing(false);
    }
  };

  if (renewed) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-background/95 backdrop-blur-sm p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-xl text-emerald-600">{t("renewedTitle")}</CardTitle>
            <CardDescription>{t("renewedDescription")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-background/95 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg shadow-xl border-destructive/20">
        <CardHeader className="items-center text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary shadow-sm">
            <Wrench className="size-7 text-primary-foreground" />
          </div>

          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>

          <CardTitle className="text-xl">{t("expiredTitle")}</CardTitle>
          <CardDescription className="text-balance">
            {t("expiredDescription")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
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

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t("selectBank")}
                </label>
                <div className="flex gap-2">
                  {BANKS.map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`flex items-center justify-center gap-2 flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                        selectedBank.id === bank.id
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : "border-input bg-background text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                      }`}
                    >
                      {bank.id === "khanbank" ? <KhanbankLogo /> : <TdbLogo />}
                      {bank.label}
                    </button>
                  ))}
                </div>
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
                    <button
                      type="button"
                      onClick={() => handleCopy(currentBank.account)}
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="border-t" />

                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("description")}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-medium truncate max-w-[180px]">
                      <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                      {orgName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(orgName)}
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
              {t("instruction")}
            </div>
          </div>

          {copied && (
            <p className="text-center text-xs font-medium text-emerald-600">
              {t("copied")}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-3 pb-6">
          {renewError && (
            <p className="text-center text-xs font-medium text-destructive">{renewError}</p>
          )}

          <button
            type="button"
            onClick={handleRenew}
            disabled={renewing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {renewing ? (
              <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Landmark className="size-4" />
            )}
            {t("renewButton")}
          </button>

          <p className="text-balance text-center text-xs leading-relaxed text-muted-foreground">
            {t("afterPayment")}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {appT("name")} &middot; {appT("tagline")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
