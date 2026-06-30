"use client";

import { Mail, Phone, User, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  isValidMongolianPhone,
  normalizeMongolianPhone,
} from "@/lib/form-validation";
import { useForm, zodResolver } from "@/lib/hooks/use-form";

// ── Schema ───────────────────────────────────────────────────

const mechanicSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || isValidMongolianPhone(val),
      "Enter a valid Mongolian phone number (8 digits)",
    ),
});

type MechanicFormValues = z.infer<typeof mechanicSchema>;

// ── Types ──────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered: (email: string, fullName: string, phone?: string) => void;
}

// ── Component ──────────────────────────────────────────────

export function MechanicRegistrationDialog({
  open,
  onOpenChange,
  onRegistered,
}: Props) {
  const t = useTranslations("bayView");

  const form = useForm<MechanicFormValues>({
    resolver: zodResolver(mechanicSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
    },
  });

  // Reset form when dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset({ fullName: "", email: "", phone: "" });
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = form.handleSubmit(async (data) => {
    const normalizedPhone = data.phone?.trim()
      ? normalizeMongolianPhone(data.phone)
      : undefined;

    // Optimistic: close immediately and hand off to parent
    onRegistered(data.email.trim(), data.fullName.trim(), normalizedPhone);
    onOpenChange(false);
  });

  return (
    <DetailDrawer open={open} onOpenChange={handleOpenChange} size="sm">
      <DetailDrawer.Header>
        <DetailDrawer.Title className="flex items-center gap-2 text-base">
          <Wrench className="size-4 text-purple-500" />
          {t("registerMechanicBtn")}
        </DetailDrawer.Title>
        <DetailDrawer.Description className="sr-only">
          {t("registerMechanicDesc")}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            {/* Full Name — required */}
            <Field data-invalid={!!form.formState.errors.fullName}>
              <FieldLabel className="text-xs font-medium text-muted-foreground">
                {t("fullName")}
              </FieldLabel>
              <FieldContent>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder={t("namePlaceholder")}
                    className="pl-10"
                    aria-invalid={!!form.formState.errors.fullName}
                    {...form.register("fullName")}
                  />
                </div>
                {form.formState.errors.fullName && (
                  <FieldError>
                    {form.formState.errors.fullName.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            {/* Email — required */}
            <Field data-invalid={!!form.formState.errors.email}>
              <FieldLabel className="text-xs font-medium text-muted-foreground">
                {t("email")}
              </FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    className="pl-10"
                    aria-invalid={!!form.formState.errors.email}
                    {...form.register("email")}
                  />
                </div>
                {form.formState.errors.email && (
                  <FieldError>{form.formState.errors.email.message}</FieldError>
                )}
              </FieldContent>
            </Field>

            {/* Phone — optional */}
            <Field data-invalid={!!form.formState.errors.phone}>
              <FieldLabel className="text-xs font-medium text-muted-foreground">
                {t("phone")}{" "}
                <span className="text-muted-foreground/60">(optional)</span>
              </FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder={t("phonePlaceholder")}
                    className="pl-10"
                    aria-invalid={!!form.formState.errors.phone}
                    {...form.register("phone")}
                  />
                </div>
                {form.formState.errors.phone && (
                  <FieldError>{form.formState.errors.phone.message}</FieldError>
                )}
              </FieldContent>
            </Field>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
              size="default"
            >
              <User className="size-4" />
              {t("registerMechanicBtn")}
            </Button>
          </FieldGroup>
        </form>
      </DetailDrawer.Body>
    </DetailDrawer>
  );
}
