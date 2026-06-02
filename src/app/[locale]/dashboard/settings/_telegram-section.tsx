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
  return (
    <Item variant="default" className="border-0 p-0 gap-3">
      <ItemMedia
        variant="icon"
        className="size-10 rounded-lg bg-muted [&_svg]:size-5 [&_svg]:text-muted-foreground"
      >
        <MessageCircle />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="text-base tracking-tight">Telegram Bot</ItemTitle>
        <ItemDescription>
          Connect your Telegram account to receive service reminder summaries,
          revenue impact reports, and urgent alerts directly in your chat.
        </ItemDescription>
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
                  Telegram Bot
                </Typography.Text>
                <Typography.Muted className="text-xs text-muted-foreground">
                  Get notified about service reminders and revenue impact
                </Typography.Muted>
              </div>
            </div>
            <Typography.Muted className="text-sm leading-relaxed text-muted-foreground">
              After generating a link token, send it to the TOLOM bot on
              Telegram to start receiving daily and weekly summaries.
            </Typography.Muted>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-4 pt-6">
            <Typography.Text className="font-semibold text-sm">
              Connect Telegram
            </Typography.Text>

            <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  1
                </span>
                <span>
                  Click <strong>&quot;Generate Link&quot;</strong> below to
                  create a one-time connection token (valid for 15 minutes)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  2
                </span>
                <span>
                  Open Telegram and start the bot:{" "}
                  <strong>t.me/tolom_bot</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  3
                </span>
                <span>
                  Send the <strong>/start</strong> command with your token:{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    /start &lt;your_token&gt;
                  </code>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  4
                </span>
                <span>
                  Done! You&apos;ll start receiving daily and weekly service
                  reminder summaries with revenue impact.
                </span>
              </li>
            </ol>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button onClick={generateLink} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 size-4" />
                    Generate Link
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
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => window.open(deepLink, "_blank")}
                  >
                    <ExternalLink className="mr-2 size-4" />
                    Open in Telegram
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
                    alt="Telegram bot deep link QR code"
                    className="size-32"
                  />
                </div>
                {/* Deep link text */}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Typography.Muted className="text-xs text-muted-foreground">
                    Scan with your phone or copy the link to connect
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
