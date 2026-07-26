"use client";

import {
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  Smartphone,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { reportServerError } from "@/lib/sentry-report-server";

// ── Types ──────────────────────────────────────────────────

interface Mechanic {
  id: string;
  full_name: string;
}

interface DeviceInfo {
  deviceId: string;
  mechanicId: string;
  isActive: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}

const deviceRegistrationSchema = z.object({
  selectedMechanicId: z.string().min(1, "Please select a mechanic"),
  deviceName: z.string().optional(),
});
type DeviceRegistrationValues = z.infer<typeof deviceRegistrationSchema>;

type DialogState =
  | "form"
  | "generating"
  | "qr"
  | "expired"
  | "success"
  | "error";

// ── Component ──────────────────────────────────────────────

export function DeviceRegistrationDialog({ open, onOpenChange, orgId }: Props) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  const [state, setState] = useState<DialogState>("form");
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [mechanicLoading, setMechanicLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [countdown, setCountdown] = useState(300);
  const [errorMessage, setErrorMessage] = useState("");
  
  const form = useForm<DeviceRegistrationValues>({
    resolver: zodResolver(deviceRegistrationSchema),
    defaultValues: {
      selectedMechanicId: "",
      deviceName: "",
    },
  });
  const selectedMechanicId = form.watch("selectedMechanicId");
  const deviceName = form.watch("deviceName");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const loadMechanics = useCallback(async () => {
    if (!orgId) return;
    setMechanicLoading(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/reports?type=mechanics`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      setMechanics(json.data ?? []);
    } catch (err) {
      reportServerError("Unexpected error", err);
      setErrorMessage(
        err instanceof Error ? err.message : t("common.somethingWentWrong"),
      );
    } finally {
      setMechanicLoading(false);
    }
  }, [orgId, t]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setState("form");
      form.reset({
        selectedMechanicId: "",
        deviceName: "",
      });
      setQrDataUrl("");
      setErrorMessage("");
      setCountdown(300);
      loadMechanics();
    }
  }, [open, loadMechanics]);

  const selectedMechanic = mechanics.find((m) => m.id === selectedMechanicId);

  const handleGenerateQr = form.handleSubmit(async () => {
    setState("generating");
    setErrorMessage("");

    try {
      const res = await fetch(
        `/api/organizations/${orgId}/clock/generate-registration`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mechanicId: selectedMechanicId }),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);

      const { rawToken, sessionId } = json.data;

      // Generate QR code with registration payload
      const qrPayload = JSON.stringify({
        t: rawToken,
        s: sessionId,
        a: "register_device",
      });
      const dataUrl = await QRCode.toDataURL(qrPayload, {
        width: 220,
        margin: 2,
      });
      setQrDataUrl(dataUrl);
      setCountdown(300);
      setState("qr");

      // Start countdown timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setState("expired");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start polling for device registration
      startPolling();
    } catch (err) {
      reportServerError("Unexpected error", err);
      setErrorMessage(
        err instanceof Error ? err.message : t("common.somethingWentWrong"),
      );
      setState("error");
    }
  });

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);

    const attempt = async () => {
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/clock/devices?mechanicId=${selectedMechanicId}`,
        );
        const json = await res.json();
        if (json.error) return;
        const devices: DeviceInfo[] = json.data ?? [];
        const registered = devices.find(
          (d) => d.mechanicId === selectedMechanicId && d.isActive,
        );
        if (registered) {
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          setState("success");
          setTimeout(() => onOpenChange(false), 2000);
        }
      } catch {
        // Silently retry on next poll
      }
    };

    pollRef.current = setInterval(attempt, 5000);
    attempt();
  };

  const handleRefresh = () => {
    handleGenerateQr();
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    }
    onOpenChange(nextOpen);
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <DetailDrawer open={open} onOpenChange={handleOpenChange}>
      <DetailDrawer.Header>
        <DetailDrawer.Title className="flex items-center gap-2 text-base">
          <Smartphone className="size-4 text-info" />
          {t("deviceRegistration.title")}
        </DetailDrawer.Title>
        <DetailDrawer.Description className="sr-only">
          {t("deviceRegistration.title")}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        {/* ── Error ───────────────────────────────────── */}
        {state === "error" && (
          <Alert variant="destructive">
            <AlertDescription>
              {errorMessage || t("common.somethingWentWrong")}
            </AlertDescription>
          </Alert>
        )}

        {/* ── Success ─────────────────────────────────── */}
        {state === "success" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-6 text-green-600" />
            </div>
            <Typography.Text className="text-center text-sm font-medium">
              {t("deviceRegistration.success")}
            </Typography.Text>
          </div>
        )}

        {/* ── Form ────────────────────────────────────── */}
        {state === "form" && (
          <form onSubmit={handleGenerateQr} className="flex flex-col gap-4">
            {/* Mechanic select */}
            <Field data-invalid={!!form.formState.errors.selectedMechanicId}>
              <FieldLabel className="text-xs font-medium text-muted-foreground">
                {t("deviceRegistration.selectMechanic")}
              </FieldLabel>
              <FieldContent>
                <Select
                  value={selectedMechanicId || null}
                  onValueChange={(val) => form.setValue("selectedMechanicId", val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        mechanicLoading
                          ? t("common.loading")
                          : t("deviceRegistration.selectMechanic")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {mechanics.length === 0 && !mechanicLoading && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        {t("bayView.noMechanics")}
                      </div>
                    )}
                    {mechanics.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <User className="size-4" />
                        {m.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.selectedMechanicId && (
                  <FieldError>
                    {form.formState.errors.selectedMechanicId.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            {/* Device name (optional) */}
            <Field>
              <FieldLabel className="text-xs font-medium text-muted-foreground">
                {t("deviceRegistration.deviceName")}{" "}
                <span className="text-muted-foreground/60">
                  ({t("deviceRegistration.optional")})
                </span>
              </FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("deviceRegistration.deviceName")}
                  {...form.register("deviceName")}
                />
              </FieldContent>
            </Field>

            {/* Generate QR */}
            <Button
              className="w-full"
              disabled={!selectedMechanicId}
              type="submit"
            >
              <QrCode className="size-4" />
              {t("deviceRegistration.generateQr")}
            </Button>
          </form>
        )}

        {/* ── Generating ──────────────────────────────── */}
        {state === "generating" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <Typography.Text className="text-sm text-muted-foreground">
              {t("common.loading")}
            </Typography.Text>
          </div>
        )}

        {/* ── QR Display ──────────────────────────────── */}
        {state === "qr" && qrDataUrl && (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="rounded-lg border p-2">
              <img
                src={qrDataUrl}
                alt={t("bayView.registrationQrCode")}
                className="size-44"
              />
            </div>
            <Typography.Text className="text-center text-sm">
              {t("deviceRegistration.instructions", {
                name: selectedMechanic?.full_name ?? "",
              })}
            </Typography.Text>
            <Typography.Muted className="text-xs text-muted-foreground">
              {t("deviceRegistration.expiresIn", {
                time: formatCountdown(countdown),
              })}
            </Typography.Muted>
          </div>
        )}

        {/* ── Expired ─────────────────────────────────── */}
        {state === "expired" && qrDataUrl && (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative rounded-lg border p-2 opacity-50">
              <img
                src={qrDataUrl}
                alt={t("bayView.registrationQrCode")}
                className="size-44"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Typography.Muted className="text-sm font-medium">
                  {t("bayView.expiredLabel")}
                </Typography.Muted>
              </div>
            </div>
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="size-4" />
              {t("deviceRegistration.refresh")}
            </Button>
          </div>
        )}
      </DetailDrawer.Body>
    </DetailDrawer>
  );
}
