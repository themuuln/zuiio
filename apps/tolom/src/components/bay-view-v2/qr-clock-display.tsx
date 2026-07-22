"use client";

import {
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  Smartphone,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Typography } from "@/components/ui/typography";
import { reportServerError } from "@/lib/sentry-report-server";
import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────

interface ClockToken {
  rawToken: string;
  sessionId: string;
  expiresAt: string;
}

interface QrClockDisplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  mechanicId: string;
  mechanicName: string;
}

type QrState = "loading" | "active" | "refreshing" | "confirmed" | "error";

// ── Constants ──────────────────────────────────────────────────────────────

const QR_REFRESH_INTERVAL_MS = 45_000;
const AUTO_CLOSE_DELAY_MS = 3_000;

// ── Component ──────────────────────────────────────────────────────────────

export function QrClockDisplay({
  open,
  onOpenChange,
  orgId,
  mechanicId: _mechanicId,
  mechanicName,
}: QrClockDisplayProps) {
  const t = (useTranslations as any)("clock") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const [state, setState] = useState<QrState>("loading");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(QR_REFRESH_INTERVAL_MS / 1000);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for lifecycle-safe cleanup
  const abortRef = useRef<AbortController | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  // Track mount state
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  // ── Cleanup helper ─────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    if (autoCloseRef.current) {
      clearTimeout(autoCloseRef.current);
      autoCloseRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  // ── Reset all state (dialog close) ────────────────────────────────────

  const resetState = useCallback(() => {
    cleanup();
    setState("loading");
    setQrDataUrl(null);
    setSessionId(null);
    setError(null);
    setCountdown(QR_REFRESH_INTERVAL_MS / 1000);
    setConfirmedAt(null);
  }, [cleanup]);

  // ── Generate token + QR code ──────────────────────────────────────────

  const generateQr = useCallback(
    async (actionType: "clock_in" | "clock_out" = "clock_in") => {
      if (unmountedRef.current) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      setState("loading");
      setQrDataUrl(null);
      setSessionId(null);
      setError(null);

      try {
        const res = await fetch(`/api/organizations/${orgId}/clock/qr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionType }),
          signal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(
            errBody?.error?.message ?? "Failed to generate QR code",
          );
        }

        const json = await res.json();
        const token: ClockToken = json.data;

        if (!token.rawToken || !token.sessionId) {
          throw new Error("Invalid token response from server");
        }

        // Generate base64 PNG data URL
        const url = await QRCode.toDataURL(
          JSON.stringify({ t: token.rawToken, s: token.sessionId }),
          {
            width: 280,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" },
          },
        );

        if (signal.aborted || unmountedRef.current) return;

        setSessionId(token.sessionId);
        setQrDataUrl(url);
        setState("active");
        setCountdown(QR_REFRESH_INTERVAL_MS / 1000);

        // Start countdown ticker
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        // Schedule auto-refresh
        refreshTimeoutRef.current = setTimeout(() => {
          if (!unmountedRef.current) {
            setState("refreshing");
            generateQr(actionType);
          }
        }, QR_REFRESH_INTERVAL_MS);
      } catch (err) {
        reportServerError("Unexpected error", err);
        if (signal.aborted || unmountedRef.current) return;

        setError(err instanceof Error ? err.message : "Something went wrong");
        setState("error");

        // Auto-retry once after 3s for transient failures
        retryTimeoutRef.current = setTimeout(() => {
          if (!unmountedRef.current) {
            generateQr(actionType);
          }
        }, 3000);
      }
    },
    [orgId],
  );

  // ── Open: start generation ────────────────────────────────────────────

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }
    generateQr();
  }, [open, generateQr, resetState]);

  // ── Realtime subscription for confirmation ────────────────────────────

  useEffect(() => {
    if (!open || !sessionId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`qr-clock:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clock_in_tokens",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (unmountedRef.current) return;

          // Check if claimed_at transitioned from null → timestamp
          const newRow = payload.new as Record<string, unknown> | null;
          const oldRow = payload.old as Record<string, unknown> | null;

          const wasUnclaimed = oldRow?.claimed_at === null;
          const isNowClaimed = newRow?.claimed_at !== null;
          const isInsert = payload.eventType === "INSERT";
          const insertedClaimed = isInsert && newRow?.claimed_at !== null;

          if ((wasUnclaimed && isNowClaimed) || insertedClaimed) {
            // Stop all timers — token is spent
            cleanup();

            setConfirmedAt((newRow?.claimed_at as string) ?? null);
            setState("confirmed");

            // Auto-close after delay
            autoCloseRef.current = setTimeout(() => {
              if (!unmountedRef.current) {
                onOpenChange(false);
              }
            }, AUTO_CLOSE_DELAY_MS);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, sessionId, cleanup, onOpenChange]);

  // ── Format ISO string to HH:MM ────────────────────────────────────────

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "\u2014";
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm"
        showCloseButton={state !== "confirmed"}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <QrCode className="size-4 text-teal-500" />
            {t("qrTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* ── Loading ── */}
          {state === "loading" && (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="size-8 animate-spin text-muted-foreground/50" />
              <Typography.Muted className="text-sm">
                {t("qrGenerating")}
              </Typography.Muted>
            </div>
          )}

          {/* ── Active ── */}
          {state === "active" && qrDataUrl && (
            <div className="flex flex-col items-center gap-2">
              {/* QR Code */}
              <div className="rounded-xl border border-border/60 bg-white p-3 shadow-sm">
                {/* biome-ignore lint/performance/noImgElement: data URI, Next.js Image doesn't support base64 */}
                <img
                  src={qrDataUrl}
                  alt="Clock-in QR code"
                  className="size-52"
                  width={208}
                  height={208}
                />
              </div>

              {/* Instruction */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Smartphone className="size-4" />
                <span>{t("qrScanInstructions")}</span>
              </div>

              {/* Countdown */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                <RefreshCw className="size-3" />
                <span className="tabular-nums">
                  {t("qrRefreshesIn", { seconds: countdown })}
                </span>
              </div>
            </div>
          )}

          {/* ── Refreshing ── */}
          {state === "refreshing" && (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="size-8 animate-spin text-muted-foreground/50" />
              <Typography.Muted className="text-sm">
                {t("qrRefreshing")}
              </Typography.Muted>
            </div>
          )}

          {/* ── Confirmed ── */}
          {state === "confirmed" && (
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <Typography.Text className="text-sm font-semibold">
                  {t("qrClockedIn", { name: mechanicName })}
                </Typography.Text>
                {confirmedAt && (
                  <Typography.Muted className="mt-1 text-xs">
                    {t("qrAt", { time: formatTime(confirmedAt) })}
                  </Typography.Muted>
                )}
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {state === "error" && (
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                <X className="size-6 text-red-500" />
              </div>
              <Typography.Muted className="text-sm text-center">
                {error ?? t("qrFailed")}
              </Typography.Muted>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateQr()}
                className="gap-2 rounded-lg"
              >
                <RefreshCw className="size-4" />
                {t("qrTryAgain")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
