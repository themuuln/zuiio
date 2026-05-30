"use client";

import {
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateLink() {
    setLoading(true);
    try {
      const res = await fetch("/api/telegram/link-token", { method: "POST" });
      const json = await res.json();

      if (json.error) {
        toast.error(json.error.message);
        return;
      }

      setDeepLink(json.data.bot_deep_link);
      toast.success("Link token generated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate link",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!deepLink) return;
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
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

            {deepLink && (
              <div className="mt-2 rounded-lg border bg-muted/30 p-3">
                <Typography.Muted className="text-xs text-muted-foreground">
                  Your deep link
                </Typography.Muted>
                <code className="mt-1 block break-all rounded bg-muted px-2 py-1 text-xs font-mono">
                  {deepLink}
                </code>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
