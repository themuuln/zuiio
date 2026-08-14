"use client";

import { FacebookLogo, InstagramLogo, SpinnerGap } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type FacebookConnectionInfo,
  getFacebookConnections,
  startFacebookOAuth,
} from "./facebook-actions";

const CHANNEL_LABELS: Record<FacebookConnectionInfo["channel"], string> = {
  messenger: "Messenger",
  instagram: "Instagram",
};

/**
 * Facebook/Instagram page connection card (settings > AI туслах).
 *
 * - Lists the org's connected Messenger/Instagram pages (read via server
 *   action — channel_connections is service-role only).
 * - "Холбох" starts the gateway OAuth flow (token-verified) and redirects
 *   the user to the Facebook dialog in a new tab; the gateway stores the
 *   connection and returns them to the product app (returnUrl).
 */
export function FacebookLinkCard() {
  const [connections, setConnections] = useState<FacebookConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getFacebookConnections().then((rows) => {
      if (!cancelled) {
        setConnections(rows);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = async () => {
    setConnecting(true);
    setError(null);
    const result = await startFacebookOAuth();
    if ("error" in result) {
      setError(result.error);
      setConnecting(false);
      return;
    }
    // Full-page navigation to the gateway origin — the OAuth state cookie
    // is set there and must round-trip to the Facebook dialog.
    window.location.href = result.redirectUrl;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#1877F2]">
          <FacebookLogo className="size-5" weight="fill" />
          Facebook / Instagram холболт
        </CardTitle>
        <CardDescription>
          Facebook хуудас, Instagram бизнес хаягаа холбож харилцагчдын мессежид
          AI автоматаар хариулах
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ) : connections.length > 0 ? (
          <div className="space-y-2">
            {connections.map((conn) => (
              <div
                key={`${conn.channel}-${conn.pageId}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-2 text-sm">
                  {conn.channel === "instagram" ? (
                    <InstagramLogo className="size-4 text-pink-600" />
                  ) : (
                    <FacebookLogo className="size-4 text-[#1877F2]" />
                  )}
                  <span className="font-medium">
                    {conn.pageName ?? conn.pageId}
                  </span>
                  <span className="text-muted-foreground">
                    {CHANNEL_LABELS[conn.channel]}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  ✅ Холбогдсон
                </span>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={connect}
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <SpinnerGap className="size-4 animate-spin" /> Холбогдож
                  байна...
                </>
              ) : (
                "Өөр хуудас холбох"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Холбогдсон хуудас байхгүй. Facebook хуудсаа холбоход харилцагч
              танаас мессеж бичихэд AI туслах шуурхай хариулах болно.
            </p>
            <Button onClick={connect} disabled={connecting}>
              {connecting ? (
                <>
                  <SpinnerGap className="size-4 animate-spin" /> Холбогдож
                  байна...
                </>
              ) : (
                <>
                  <FacebookLogo className="size-4" weight="fill" /> Холбох
                </>
              )}
            </Button>
          </div>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
