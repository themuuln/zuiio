/**
 * E-Barimt Settings Component
 *
 * UI for configuring and testing the Mongolian electronic tax receipt
 * (e-barimt / Э-Баримт) integration for an organization.
 *
 * Uses react-hook-form + zod for form validation and server actions
 * for all data operations.
 */

"use client";

import { CheckCircle2, Loader2, Plug2, Save, XCircle } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import {
  readEbarimtSettings,
  testCurrentEbarimtConnection,
  updateEbarimtSettings,
} from "@/lib/actions/ebarimt-settings";
import { useForm, zodResolver } from "@/lib/hooks/use-form";

// ── Schema ───────────────────────────────────────────────────

const ebarimtSettingsSchema = z.object({
  enabled: z.boolean(),
  apiKey: z.string().min(1, "API key is required"),
  merchantId: z.string().min(1, "Merchant ID is required"),
  endpoint: z.string().url("Must be a valid URL"),
});

type EbarimtSettingsFormValues = z.infer<typeof ebarimtSettingsSchema>;

// ── Defaults ─────────────────────────────────────────────────

const DEFAULT_ENDPOINT = "https://ebarimt.mn/api";

const DEFAULT_VALUES: EbarimtSettingsFormValues = {
  enabled: false,
  apiKey: "",
  merchantId: "",
  endpoint: DEFAULT_ENDPOINT,
};

// ── Connection Status ────────────────────────────────────────

type ConnectionStatus =
  | { type: "idle" }
  | { type: "testing" }
  | { type: "success"; message: string }
  | { type: "failure"; message: string };

// ── Component ────────────────────────────────────────────────

interface EbarimtSettingsProps {
  orgId: string;
}

export function EbarimtSettings({ orgId }: EbarimtSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    type: "idle",
  });
  const [, startTransition] = useTransition();

  const form = useForm<EbarimtSettingsFormValues>({
    resolver: zodResolver(ebarimtSettingsSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const enabled = form.watch("enabled");

  // ── Load settings on mount ──────────────────────────────────

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await readEbarimtSettings(orgId);
        form.reset({
          enabled: settings.enabled,
          apiKey: settings.apiKey ?? "",
          merchantId: settings.merchantId ?? "",
          endpoint: settings.endpoint || DEFAULT_ENDPOINT,
        });
      } catch {
        // Settings failed to load — component stays in default state
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [orgId, form]);

  // ── Save ────────────────────────────────────────────────────

  const handleSave = form.handleSubmit(async (data) => {
    setSaving(true);
    setConnectionStatus({ type: "idle" });

    try {
      await updateEbarimtSettings(orgId, {
        enabled: data.enabled,
        apiKey: data.apiKey,
        merchantId: data.merchantId,
        endpoint: data.endpoint,
      });
    } catch {
      // Save error — could add toast notification
    } finally {
      setSaving(false);
    }
  });

  // ── Test Connection ─────────────────────────────────────────

  const handleTestConnection = useCallback(async () => {
    setConnectionStatus({ type: "testing" });

    startTransition(async () => {
      try {
        const result = await testCurrentEbarimtConnection(orgId);

        setConnectionStatus({
          type: result.success ? "success" : "failure",
          message: result.message,
        });
      } catch {
        setConnectionStatus({
          type: "failure",
          message: "Failed to test connection",
        });
      }
    });
  }, [orgId]);

  // ── Loading State ───────────────────────────────────────────

  if (loading) {
    return (
      <Card>
        <CardHeader className="gap-2 pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-full max-w-lg" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {/* Toggle skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
            {/* Field skeletons */}
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            {/* Buttons skeleton */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-36 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="gap-2 pb-4">
        <div className="flex items-center gap-2">
          <Plug2 className="h-5 w-5 text-muted-foreground" />
          <CardTitle>E-Barimt Integration</CardTitle>
        </div>
        <CardDescription>
          Configure electronic tax receipt (Э-Баримт) for Mongolian tax
          compliance. When enabled, invoices will be automatically registered
          with the General Taxation Authority upon completion.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* ── Enabled Toggle ─────────────────────────────── */}
          <Field>
            <FieldContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <FieldLabel>Enable E-Barimt</FieldLabel>
                  <FieldDescription>
                    Automatically send completed invoices to the tax authority
                  </FieldDescription>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    form.setValue("enabled", checked)
                  }
                  aria-label="Enable e-barimt"
                />
              </div>
            </FieldContent>
          </Field>

          {/* ── API Key ─────────────────────────────────────── */}
          <Field data-invalid={!!form.formState.errors.apiKey}>
            <FieldLabel>API Key</FieldLabel>
            <FieldContent>
              <Input
                type="password"
                placeholder="Enter your e-barimt API key"
                aria-invalid={!!form.formState.errors.apiKey}
                disabled={!enabled}
                {...form.register("apiKey")}
              />
              <FieldDescription>
                Your e-barimt API key for authenticating requests to the tax
                authority&apos;s system
              </FieldDescription>
              {form.formState.errors.apiKey && (
                <FieldError>{form.formState.errors.apiKey.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          {/* ── Merchant ID ──────────────────────────────────── */}
          <Field data-invalid={!!form.formState.errors.merchantId}>
            <FieldLabel>Merchant ID</FieldLabel>
            <FieldContent>
              <Input
                placeholder="Enter your merchant ID"
                aria-invalid={!!form.formState.errors.merchantId}
                disabled={!enabled}
                {...form.register("merchantId")}
              />
              <FieldDescription>
                Your registered merchant identifier assigned by the tax
                authority for your business
              </FieldDescription>
              {form.formState.errors.merchantId && (
                <FieldError>
                  {form.formState.errors.merchantId.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>

          {/* ── Endpoint URL ─────────────────────────────────── */}
          <Field data-invalid={!!form.formState.errors.endpoint}>
            <FieldLabel>Endpoint URL</FieldLabel>
            <FieldContent>
              <Input
                placeholder={DEFAULT_ENDPOINT}
                aria-invalid={!!form.formState.errors.endpoint}
                disabled={!enabled}
                {...form.register("endpoint")}
              />
              <FieldDescription>
                The e-barimt API endpoint URL (defaults to {DEFAULT_ENDPOINT})
              </FieldDescription>
              {form.formState.errors.endpoint && (
                <FieldError>
                  {form.formState.errors.endpoint.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>

          {/* ── Connection Status ─────────────────────────────── */}
          {connectionStatus.type !== "idle" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {connectionStatus.type === "testing" && (
                  <Badge
                    variant="secondary"
                    className="gap-1.5 px-3 py-1 text-sm"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Testing connection...
                  </Badge>
                )}
                {connectionStatus.type === "success" && (
                  <Badge className="gap-1.5 border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Connection Successful
                  </Badge>
                )}
                {connectionStatus.type === "failure" && (
                  <Badge
                    variant="destructive"
                    className="gap-1.5 px-3 py-1 text-sm"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Connection Failed
                  </Badge>
                )}
              </div>
              {connectionStatus.type !== "testing" &&
                connectionStatus.message && (
                  <Typography.Muted className="text-sm">
                    {connectionStatus.message}
                  </Typography.Muted>
                )}
            </div>
          )}

          {/* ── Actions ───────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving || !enabled}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Settings"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={
                connectionStatus.type === "testing" ||
                !enabled ||
                !form.formState.isValid
              }
              onClick={handleTestConnection}
            >
              {connectionStatus.type === "testing" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plug2 className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
