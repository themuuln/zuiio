"use client";

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
import { Card, CardContent } from "@/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Typography } from "@/components/ui/typography";

function SectionHeading() {
  const t = useTranslations("settings");
  return (
    <Item variant="default" className="border-0 p-0 gap-3">
      <ItemMedia
        variant="icon"
        className="size-10 rounded-lg bg-muted [&_svg]:size-5 [&_svg]:text-muted-foreground"
      >
        <MessageCircle />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="text-base tracking-tight">
          {t("telegramBotTitle")}
        </ItemTitle>
        <ItemDescription>{t("telegramBotSectionDesc")}</ItemDescription>
      </ItemContent>
    </Item>
  );
}

export function TelegramSection() {
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const t = useTranslations("settings");

  async function generateLink() {
    setLoading(true);
    try {
      const res = await fetch("/api/telegram/link-token", { method: "POST" });
      const json = await res.json();

      if (json.error) {
        toast.error(json.error.message);
        return;
      }

      const link = json.data.bot_deep_link;
      setDeepLink(link);
      setQrDataUrl(null);
      const dataUrl = await QRCode.toDataURL(link, {
        width: 220,
        margin: 2,
      });
      setQrDataUrl(dataUrl);
      toast.success(t("linkTokenGenerated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToGenerate"));
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!deepLink) return;
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      toast.success(t("copiedToClipboard"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("failedToCopy"));
    }
  }

  return (
    <section>
      <SectionHeading />
      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-sky-500/10">
                <MessageCircle className="size-6 text-sky-500" />
              </div>
              <div>
                <Typography.Text className="font-semibold">
                  {t("telegramBotTitle")}
                </Typography.Text>
                <Typography.Muted className="text-xs text-muted-foreground">
                  {t("telegramBotCardDesc")}
                </Typography.Muted>
              </div>
            </div>
            <Typography.Muted className="text-sm leading-relaxed text-muted-foreground">
              {t("telegramBotAfterGenerate")}
            </Typography.Muted>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-4 pt-6">
            <Typography.Text className="font-semibold text-sm">
              {t("connectTelegram")}
            </Typography.Text>

            <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  1
                </span>
                <span>{t("telegramStep1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  2
                </span>
                <span>
                  {t("telegramStep2")} <strong>t.me/tolom_bot</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  3
                </span>
                <span>
                  {t("telegramStep3")}{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    /start &lt;your_token&gt;
                  </code>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  4
                </span>
                <span>{t("telegramStep4")}</span>
              </li>
            </ol>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button onClick={generateLink} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 size-4" />
                    {t("generateLink")}
                  </>
                )}
              </Button>

              {deepLink && (
                <>
                  <Button variant="outline" onClick={copyLink}>
                    {copied ? (
                      <Check className="mr-2 size-4 text-green-500" />
                    ) : (
                      <Copy className="mr-2 size-4" />
                    )}
                    {copied ? t("copiedLabel") : t("copyLink")}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => window.open(deepLink, "_blank")}
                  >
                    <ExternalLink className="mr-2 size-4" />
                    {t("openInTelegram")}
                  </Button>
                </>
              )}
            </div>

            {deepLink && qrDataUrl && (
              <div className="mt-2 flex flex-col gap-4 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-start">
                {/* QR Code */}
                <div className="flex shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                  {/* biome-ignore lint/performance/noImgElement: QR codes use inline data URIs, next/Image is not suitable */}
                  <img
                    src={qrDataUrl}
                    alt={t("qrCodeAlt")}
                    className="size-32"
                  />
                </div>
                {/* Deep link text */}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Typography.Muted className="text-xs text-muted-foreground">
                    {t("scanQrHint")}
                  </Typography.Muted>
                  <code className="block break-all rounded-md bg-muted px-3 py-2 text-xs font-mono">
                    {deepLink}
                  </code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
