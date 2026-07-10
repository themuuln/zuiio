"use client";

import { useMutation } from "@tanstack/react-query";
import { reportServerError } from "@/lib/sentry-report-server";
import { Camera, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useCurrentUserRole } from "@/hooks/use-current-user-role";
import { redirectToLogin } from "@/lib/auth-redirect";
import { useQrScanner } from "@/lib/hooks/use-qr-scanner";

type ScanState =
  | "loading"
  | "scanning"
  | "confirming"
  | "processing"
  | "success"
  | "error";

export default function ClockPage() {
  const t = useTranslations();
  const { profile, loading: roleLoading } = useCurrentUserRole();
  const {
    startScanning,
    stopScanning,
    isScanning,
    error: scannerError,
  } = useQrScanner();

  const [scanState, setScanState] = useState<ScanState>("loading");
  const [scannerInitAttempted, setScannerInitAttempted] = useState(false);
  const [clockDirection, setClockDirection] = useState<"in" | "out">("in");
  const [token, setToken] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [mechanicName, setMechanicName] = useState<string | null>(null);

  const scannerId = "qr-scanner-element";

  const verifyClock = useMutation({
    mutationFn: async (inputToken: string) => {
      const res = await fetch(
        `/api/organizations/${profile?.organizationId}/clock/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawToken: inputToken }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? t("clock.error"));
      }
      return json.data as { direction: string; mechanicName: string | null };
    },
  });

  const clockInOut = useMutation({
    mutationFn: async ({
      endpoint,
      token: tk,
    }: {
      endpoint: string;
      token: string;
    }) => {
      const res = await fetch(
        `/api/organizations/${profile?.organizationId}/me/time/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tk }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? t("clock.error"));
      }
      return json;
    },
  });

  // ── Callback shared by QR scan and manual entry ──────────────

  const verifyToken = useCallback(
    async (inputToken: string) => {
      setScanState("processing");
      setToken(inputToken);

      try {
        const data = await verifyClock.mutateAsync(inputToken);
        setClockDirection((data.direction ?? "in") as "in" | "out");
        setMechanicName(data.mechanicName ?? null);
        setScanState("confirming");
      } catch (err) {
    reportServerError("Unexpected error", err);
        setApiError(err instanceof Error ? err.message : t("clock.error"));
        setScanState("error");
      }
    },
    [verifyClock, t],
  );

  const handleScanResult = useCallback(
    (decodedText: string) => {
      // Stop camera immediately
      stopScanning();
      verifyToken(decodedText.trim());
    },
    [stopScanning, verifyToken],
  );

  // ── Auto-start camera on mount ───────────────────────────────

  useEffect(() => {
    if (!profile?.organizationId || scannerInitAttempted) return;
    setScannerInitAttempted(true);

    const timeout = setTimeout(async () => {
      setScanState("loading");
      await startScanning(scannerId, handleScanResult);
    }, 500);

    return () => {
      clearTimeout(timeout);
      stopScanning();
    };
    // Only when orgId becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profile?.organizationId,
    handleScanResult,
    scannerInitAttempted,
    startScanning,
    stopScanning,
  ]);

  // Derive "scanning" state from hook
  useEffect(() => {
    if (isScanning && scanState === "loading") {
      setScanState("scanning");
    }
  }, [isScanning, scanState]);

  // Handle camera / permission errors
  useEffect(() => {
    if (
      scannerError &&
      scanState !== "success" &&
      scanState !== "confirming" &&
      scanState !== "processing"
    ) {
      setScanState("error");
      setApiError(scannerError);
    }
  }, [scannerError, scanState]);

  // ── Actions ──────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!token || !profile?.organizationId) return;

    setScanState("processing");

    try {
      const endpoint = clockDirection === "in" ? "clock-in" : "clock-out";
      await clockInOut.mutateAsync({ endpoint, token });

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setResultMessage(
        clockDirection === "in"
          ? t("clock.clockedInAt", { time: timeStr })
          : t("clock.clockedOutAt", { time: timeStr }),
      );
      setScanState("success");
    } catch {
      setApiError(t("clock.error"));
      setScanState("error");
    }
  };

  const handleCancel = () => {
    setScanState("loading");
    setToken(null);
    setManualToken("");
    setApiError(null);
    setMechanicName(null);

    // Restart scanner
    startScanning(scannerId, handleScanResult);
  };

  const handleRetry = () => {
    setScanState("loading");
    setToken(null);
    setManualToken("");
    setApiError(null);

    startScanning(scannerId, handleScanResult);
  };

  const handleManualSubmit = () => {
    if (!manualToken.trim()) return;
    verifyToken(manualToken.trim());
  };

  // ── Redirect to login if not authenticated ────────────────
  useEffect(() => {
    if (!roleLoading && !profile) {
      redirectToLogin();
    }
  }, [roleLoading, profile]);

  // ── Loading / no-profile guard ───────────────────────────────

  if (roleLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="mx-auto h-6 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <Skeleton className="size-64 rounded-xl" />
            <Skeleton className="h-4 w-56" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!roleLoading && !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <Typography.Muted>Redirecting to login...</Typography.Muted>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile?.organizationId) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <XCircle className="size-8 text-destructive" />
            <Typography.Muted>{t("clock.noOrganization")}</Typography.Muted>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-lg">
            {t("clock.pageTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {/* ── Camera / Scanner ──────────────────────────────── */}
          {(scanState === "loading" || scanState === "scanning") && (
            <>
              <div className="relative flex items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30">
                <div id={scannerId} className="size-64" />
                {scanState === "loading" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    <Typography.Muted>{t("clock.scanning")}</Typography.Muted>
                  </div>
                )}
              </div>
              <Typography.Muted className="text-center text-sm leading-relaxed">
                {t("clock.scanInstructions")}
              </Typography.Muted>
            </>
          )}

          {/* ── Confirmation ─────────────────────────────────── */}
          {scanState === "confirming" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Camera className="size-8 text-primary" />
              </div>
              <Typography.H3>
                {clockDirection === "in"
                  ? t("clock.confirmClockIn")
                  : t("clock.confirmClockOut")}
              </Typography.H3>
              {mechanicName && (
                <Typography.Muted>
                  {t("clock.confirmAs", { name: mechanicName })}
                </Typography.Muted>
              )}
              <div className="flex w-full gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  {t("clock.cancel")}
                </Button>
                <Button onClick={handleConfirm} className="flex-1">
                  {t("clock.confirm")}
                </Button>
              </div>
            </div>
          )}

          {/* ── Processing ────────────────────────────────────── */}
          {scanState === "processing" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <Typography.Muted>{t("common.loading")}</Typography.Muted>
            </div>
          )}

          {/* ── Success ──────────────────────────────────────── */}
          {scanState === "success" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
              </div>
              <Typography.H3 className="text-green-600 dark:text-green-400">
                {t("clock.success")}
              </Typography.H3>
              <Typography.Muted>{resultMessage}</Typography.Muted>
            </div>
          )}

          {/* ── Error ─────────────────────────────────────────── */}
          {scanState === "error" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="size-8 text-red-600 dark:text-red-400" />
              </div>
              <Typography.Muted className="text-destructive">
                {apiError ?? t("clock.error")}
              </Typography.Muted>
              <Button variant="outline" onClick={handleRetry}>
                {t("clock.retry")}
              </Button>
            </div>
          )}

          {/* ── Manual fallback ───────────────────────────────── */}
          {scanState !== "success" &&
            scanState !== "confirming" &&
            scanState !== "processing" && (
              <>
                <div className="flex w-full items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <Typography.Muted className="text-xs">
                    {t("clock.manualEntry")}
                  </Typography.Muted>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="flex w-full gap-2">
                  <Input
                    placeholder={t("clock.enterToken")}
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleManualSubmit();
                      }
                    }}
                  />
                  <Button
                    onClick={handleManualSubmit}
                    disabled={!manualToken.trim()}
                  >
                    {t("clock.submit")}
                  </Button>
                </div>
              </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
