"use client";

import {
  Building2,
  Droplet,
  Gauge,
  Loader2,
  PaintBucket,
  Truck,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createOrganization } from "@/app/[locale]/auth/setup-organization/actions";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import type { BusinessType } from "@/lib/industry-presets";
import { BUSINESS_TYPES, INDUSTRY_PRESETS } from "@/lib/industry-presets";
import { cn } from "@/lib/utils";

interface PendingInvite {
  token: string;
  organization_name: string;
  inviter_name: string | null;
}

const BUSINESS_TYPE_ICONS: Record<
  BusinessType,
  React.ComponentType<{ className?: string }>
> = {
  general_repair: Wrench,
  tire_shop: Gauge,
  body_shop: PaintBucket,
  dealership: Building2,
  fleet: Truck,
  quick_lube: Droplet,
};

interface OrganizationSetupFormProps {
  pendingInvites: PendingInvite[];
  copy: {
    title: string;
    subtitle: string;
    businessTypeTitle: string;
    businessTypeSubtitle: string;
    orgNameLabel: string;
    orgNamePlaceholder: string;
    continueButton: string;
    backButton: string;
    createOrgButton: string;
    partSuggestionsLabel: string;
    partSuggestionsDesc: string;
    inviteSectionTitle: string;
    inviteSectionDesc: string;
    acceptInvite: string;
  };
}

export function OrganizationSetupForm({
  pendingInvites,
  copy,
}: OrganizationSetupFormProps) {
  const { push } = useRouter();
  const [state, formAction, isPending] = useActionState(createOrganization, {});
  const [step, setStep] = useState<"type" | "details">("type");
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
  const [orgName, setOrgName] = useState("");
  const [enablePartSuggestions, setEnablePartSuggestions] = useState(true);

  const prevFormError = useRef(state?.formError);
  useEffect(() => {
    if (state?.formError && state.formError !== prevFormError.current) {
      toast.error(state.formError, { duration: 5000 });
    }
    prevFormError.current = state?.formError;
  }, [state?.formError]);

  const fieldErrors = state?.fieldErrors ?? {};
  const t = useTranslations("auth.setupOrganization") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <Typography.H2 className="text-lg font-semibold text-foreground">
          {copy.title}
        </Typography.H2>
        <Typography.Muted className="mt-1 text-sm text-muted-foreground">
          {copy.subtitle}
        </Typography.Muted>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-primary" />
              {copy.inviteSectionTitle}
            </CardTitle>
            <CardDescription>{copy.inviteSectionDesc}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.token}
                className="flex items-center justify-between rounded-lg border bg-background p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {invite.organization_name}
                  </span>
                  {invite.inviter_name && (
                    <span className="text-xs text-muted-foreground">
                      Invited by {invite.inviter_name}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => push(`/invite/${invite.token}`)}
                >
                  {copy.acceptInvite}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 1: Business Type Selection */}
      {step === "type" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-muted-foreground" />
              {copy.businessTypeTitle}
            </CardTitle>
            <CardDescription>{copy.businessTypeSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BUSINESS_TYPES.map((type) => {
                const preset = INDUSTRY_PRESETS[type];
                const Icon = BUSINESS_TYPE_ICONS[type];
                const isSelected = selectedType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-4 text-left transition-all",
                      "hover:border-primary/50 hover:bg-accent/50",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-background",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Typography.Text
                        className={cn(
                          "block text-sm font-medium",
                          isSelected && "text-primary",
                        )}
                      >
                        {t(preset.labelKey)}
                      </Typography.Text>
                      <Typography.Muted className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {t(preset.descriptionKey)}
                      </Typography.Muted>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setStep("details")}
                disabled={!selectedType}
              >
                {copy.continueButton}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Organization Details */}
      {step === "details" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-muted-foreground" />
              {copy.orgNameLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction}>
              <FieldGroup>
                {state?.formError && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {state.formError}
                  </div>
                )}

                {/* Hidden field to carry business type */}
                {selectedType && (
                  <input
                    type="hidden"
                    name="businessType"
                    value={selectedType}
                  />
                )}

                {/* Hidden field to carry the part-suggestions preference */}
                <input
                  type="hidden"
                  name="enablePartSuggestions"
                  value={enablePartSuggestions ? "on" : "off"}
                />

                <Field>
                  <FieldLabel htmlFor="organizationName">
                    {copy.orgNameLabel}{" "}
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    autoComplete="organization"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder={copy.orgNamePlaceholder}
                    aria-invalid={
                      "organizationName" in fieldErrors || undefined
                    }
                  />
                  {"organizationName" in fieldErrors && (
                    <FieldError>{fieldErrors.organizationName}</FieldError>
                  )}
                </Field>

                <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent/50">
                  <input
                    type="checkbox"
                    checked={enablePartSuggestions}
                    onChange={(e) => setEnablePartSuggestions(e.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                  />
                  <span className="min-w-0 flex-1">
                    <Typography.Text className="block text-sm font-medium">
                      {copy.partSuggestionsLabel}
                    </Typography.Text>
                    <Typography.Muted className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {copy.partSuggestionsDesc}
                    </Typography.Muted>
                  </span>
                </label>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("type")}
                    className="flex-1"
                  >
                    {copy.backButton}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Building2 />
                    )}
                    {copy.createOrgButton}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
