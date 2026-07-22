"use client";

import { useMutation } from "@tanstack/react-query";
import {
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { reportServerError } from "@/lib/sentry-report-server";
import { SettingsBlock } from "./_settings-layout";

interface TelegramLinkResponse {
  data: {
    bot_deep_link: string;
    link_code?: string;
  };
  error?: {
    message?: string;
  };
}

const BOT_USERNAME = "zuiio_bot";
export function TelegramSection() {
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const t = useTranslations("settings") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/telegram/link-token", {
        method: "POST",
      });
      const json: TelegramLinkResponse = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? "Failed to generate link");
      }
      return json.data;
    },
    onSuccess: async (data) => {
      setDeepLink(data.bot_deep_link);
      setLinkCode(data.link_code ?? null);
      setQrDataUrl(null);
      const dataUrl = await QRCode.toDataURL(data.bot_deep_link, {
        width: 220,
        margin: 2,
      });
      setQrDataUrl(dataUrl);
      toast.success(t("linkTokenGenerated"));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t("failedToGenerate"));
    },
  });

  async function copyLink() {
    if (!deepLink) return;
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      toast.success(t("copiedToClipboard"));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      reportServerError("Unexpected error", error);
      toast.error(t("failedToCopy"));
    }
  }

  return (
    <SettingsBlock className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-4">
      <div className="flex flex-col gap-2">
        <Typography.Muted className="text-xs leading-relaxed text-muted-foreground">
          {t("telegramBotAfterGenerate")}
        </Typography.Muted>
        <Typography.Muted className="text-xs text-muted-foreground">
          {t("telegramBotCardDesc")}
        </Typography.Muted>
      </div>

      <div className="flex flex-col gap-3">
        <Typography.Text className="text-sm font-medium">
          {t("connectTelegram")}
        </Typography.Text>

        <ol className="flex flex-col gap-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              1
            </span>
            <span>{t("telegramStep1")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              2
            </span>
            <span>
              {t("telegramStep2")} <strong>t.me/{BOT_USERNAME}</strong>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              3
            </span>
            <span>
              {t("telegramStep3")}{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                /start &lt;your_token&gt;
              </code>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              4
            </span>
            <span>{t("telegramStep4")}</span>
          </li>
        </ol>
        {linkCode ? (
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <Typography.Muted className="text-xs text-muted-foreground mb-1.5">
              Холбох код:
            </Typography.Muted>
            <code className="block text-lg font-mono font-bold tracking-widest text-foreground">
              {linkCode}
            </code>
            <Typography.Muted className="text-[10px] text-muted-foreground mt-1">
              Telegram-д /start бичиж, дээрх кодоо оруулна уу
            </Typography.Muted>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => generateLinkMutation.mutate()}
            disabled={generateLinkMutation.isPending}
          >
            {generateLinkMutation.isPending ? (
              <>
                <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <MessageCircle className="mr-1.5 size-3.5" />
                {t("generateLink")}
              </>
            )}
          </Button>

          {deepLink ? (
            <>
              <Button variant="outline" size="sm" onClick={copyLink}>
                {copied ? (
                  <Check className="mr-1.5 size-3.5 text-green-500" />
                ) : (
                  <Copy className="mr-1.5 size-3.5" />
                )}
                {copied ? t("copiedLabel") : t("copyLink")}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(deepLink, "_blank")}
              >
                <ExternalLink className="mr-1.5 size-3.5" />
                {t("openInTelegram")}
              </Button>
            </>
          ) : null}
        </div>

        {deepLink && qrDataUrl ? (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-start">
            <div className="flex shrink-0 items-center justify-center rounded-md bg-background p-1">
              <img src={qrDataUrl} alt={t("qrCodeAlt")} className="size-28" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Typography.Muted className="text-xs text-muted-foreground">
                {t("scanQrHint")}
              </Typography.Muted>
              <code className="block break-all rounded-md bg-muted px-2.5 py-1.5 font-mono text-[11px]">
                {deepLink}
              </code>
            </div>
          </div>
        ) : null}
      </div>
    </SettingsBlock>
  );
}
