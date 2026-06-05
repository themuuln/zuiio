"use client";

import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";

// ── Schema ───────────────────────────────────────────────────

const pinSchema = z
  .object({
    currentPin: z
      .string()
      .min(1, "Current PIN is required")
      .regex(/^[0-9]{4,6}$/, "PIN must be 4-6 digits"),
    newPin: z
      .string()
      .min(1, "New PIN is required")
      .regex(/^[0-9]{4,6}$/, "PIN must be 4-6 digits"),
    confirmPin: z.string().min(1, "Please confirm your new PIN"),
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

type PinFormValues = z.infer<typeof pinSchema>;

// ── Types ──────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ──────────────────────────────────────────────

export function PinSettingsDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("bayView");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const currentRef = useRef<HTMLInputElement>(null);

  const form = useForm<PinFormValues>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      currentPin: "",
      newPin: "",
      confirmPin: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    currentRef.current?.focus();
  }, [open]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({ currentPin: "", newPin: "", confirmPin: "" });
      setSaving(false);
      setError(null);
      setSuccess(false);
    }
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { updateBayViewPin } = await import(
        "@/lib/services/bay-view-service"
      );
      await updateBayViewPin(data.currentPin, data.newPin, data.confirmPin);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update PIN");
    } finally {
      setSaving(false);
    }
  });

  // Merge form.register ref with our currentRef for auto-focus
  const currentRegister = form.register("currentPin");
  const mergedCurrentRef = (el: HTMLInputElement | null) => {
    currentRegister.ref({ current: el });
    currentRef.current = el;
    if (el) el.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4 text-rose-500" />
            {t("bayPinSettings")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("bayPinSettings")}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex items-center justify-center size-12 bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-6 text-green-600" />
            </div>
            <Typography.Text className="text-sm font-medium text-center">
              {t("pinUpdated")}
            </Typography.Text>
            <Button onClick={() => onOpenChange(false)} size="default">
              {t("done")}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {error && (
              <div className=" bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-3 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <FieldGroup>
              {/* Current PIN */}
              <Field data-invalid={!!form.formState.errors.currentPin}>
                <FieldLabel className="text-xs font-medium text-muted-foreground">
                  {t("currentPin")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    ref={mergedCurrentRef}
                    type="password"
                    inputMode="numeric"
                    placeholder={t("enterCurrentPin")}
                    disabled={saving}
                    maxLength={6}
                    className="font-mono tracking-widest"
                    aria-invalid={!!form.formState.errors.currentPin}
                    onChange={currentRegister.onChange}
                    onBlur={currentRegister.onBlur}
                    name={currentRegister.name}
                  />
                  {form.formState.errors.currentPin && (
                    <FieldError>
                      {form.formState.errors.currentPin.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>

              {/* New PIN */}
              <Field data-invalid={!!form.formState.errors.newPin}>
                <FieldLabel className="text-xs font-medium text-muted-foreground">
                  {t("newPin")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    type="password"
                    inputMode="numeric"
                    placeholder={t("enterDigits")}
                    disabled={saving}
                    maxLength={6}
                    className="font-mono tracking-widest"
                    aria-invalid={!!form.formState.errors.newPin}
                    {...form.register("newPin")}
                  />
                  {form.formState.errors.newPin && (
                    <FieldError>
                      {form.formState.errors.newPin.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>

              {/* Confirm New PIN */}
              <Field data-invalid={!!form.formState.errors.confirmPin}>
                <FieldLabel className="text-xs font-medium text-muted-foreground">
                  {t("confirmNewPin")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    type="password"
                    inputMode="numeric"
                    placeholder={t("repeatNewPin")}
                    disabled={saving}
                    maxLength={6}
                    className="font-mono tracking-widest"
                    aria-invalid={!!form.formState.errors.confirmPin}
                    {...form.register("confirmPin")}
                  />
                  {form.formState.errors.confirmPin && (
                    <FieldError>
                      {form.formState.errors.confirmPin.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={saving}
                size="default"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                {saving ? t("updating") : t("updatePin")}
              </Button>
            </FieldGroup>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
