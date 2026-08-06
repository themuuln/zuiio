"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { reportServerError } from "@/lib/sentry-report-server";
import { SettingsBlock } from "./_settings-layout";

/** Brand glyphs — lucide-react dropped brand icons, so inline SVG. */
function FacebookMark({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.6 1.6-1.6h1.3V4.8c-.3 0-1.1-.1-2-.1-2.1 0-3.5 1.3-3.5 3.6V11H8.5v3h2.4v7h2.6z" />
    </svg>
  );
}

function InstagramMark({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface FacebookConnection {
  channel: "messenger" | "instagram";
  pageId: string;
  pageName: string | null;
  connectedAt: string | null;
  webhookSubscribedAt: string | null;
  tokenExpiresAt: string | null;
}

interface FacebookConnectResponse {
  data?: {
    redirectUrl?: string;
  };
  error?: {
    message?: string;
  };
}

export function FacebookSection() {
  const [connecting, setConnecting] = useState(false);
  const t = useTranslations("settings") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  const connectionsQuery = useQuery({
    queryKey: ["facebook-connections"],
    queryFn: async (): Promise<FacebookConnection[]> => {
      const res = await fetch("/api/facebook/connections", {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        data?: { connections?: FacebookConnection[] };
        error?: { message?: string };
      };
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? "Failed to fetch connections");
      }
      return json.data?.connections ?? [];
    },
  });

  async function connect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/facebook/connect", { method: "POST" });
      const json: FacebookConnectResponse = await res.json();
      if (!res.ok || json.error || !json.data?.redirectUrl) {
        throw new Error(json.error?.message ?? "Failed to start connection");
      }
      // Full-page navigation — the OAuth state cookie lives on the gateway origin.
      window.location.href = json.data.redirectUrl;
    } catch (err) {
      reportServerError("Facebook connect failed", err);
      toast.error(err instanceof Error ? err.message : t("facebookError"));
      setConnecting(false);
    }
  }

  const connections = connectionsQuery.data ?? [];

  return (
    <SettingsBlock className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-4">
      <div className="flex flex-col gap-2">
        <Typography.Muted className="text-xs leading-relaxed text-muted-foreground">
          {t("facebookCardDesc")}
        </Typography.Muted>
        <Typography.Muted className="text-xs text-muted-foreground">
          {t("facebookWindowNote")}
        </Typography.Muted>
      </div>

      <div className="flex flex-col gap-3">
        <Typography.Text className="text-sm font-medium">
          {t("connectFacebook")}
        </Typography.Text>

        <ol className="flex flex-col gap-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              1
            </span>
            <span>{t("facebookStep1")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              2
            </span>
            <span>{t("facebookStep2")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              3
            </span>
            <span>{t("facebookStep3")}</span>
          </li>
        </ol>

        {connections.length > 0 ? (
          <div className="flex flex-col gap-2">
            {connections.map((conn) => (
              <div
                key={`${conn.channel}-${conn.pageId}`}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2"
              >
                <div className="flex items-center gap-2 text-sm">
                  {conn.channel === "instagram" ? (
                    <InstagramMark className="size-4 text-pink-600" />
                  ) : (
                    <FacebookMark className="size-4 text-[#1877F2]" />
                  )}
                  <span className="font-medium">
                    {conn.pageName ?? conn.pageId}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {conn.channel === "instagram" ? "Instagram" : "Messenger"}
                  </span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  ✅ {t("facebookConnected")}
                </span>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={connect}
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                  {t("facebookConnecting")}
                </>
              ) : (
                <>
                  <FacebookMark className="mr-1.5 size-3.5" />
                  {t("facebookConnectAnother")}
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={connect} disabled={connecting}>
            {connecting ? (
              <>
                <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                {t("facebookConnecting")}
              </>
            ) : (
              <>
                <MessageCircle className="mr-1.5 size-3.5" />
                {t("connectFacebook")}
              </>
            )}
          </Button>
        )}
      </div>
    </SettingsBlock>
  );
}
